"""
ASTID ML ENGINE - SLICE 2: ZERO-DAY DEEP AUTOENCODER
Trained exclusively on legitimate transaction manifold (isFraud == 0)
Uses StandardScaler on causal pre-auth features and 99.9th percentile error normalization.
"""

import os
import json
import time
import joblib
import numpy as np
import duckdb
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
from backend.ml.features import FEATURE_NAMES, extract_batch_features

PARQUET_PATH = "backend/warehouse/data/paysim_warehouse.parquet"
ARTIFACTS_DIR = "backend/ml/artifacts"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

class DeepAutoencoder(nn.Module):
    def __init__(self, input_dim=11, latent_dim=4):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 8),
            nn.BatchNorm1d(8),
            nn.LeakyReLU(0.1),
            nn.Linear(8, latent_dim),
            nn.LeakyReLU(0.1)
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 8),
            nn.BatchNorm1d(8),
            nn.LeakyReLU(0.1),
            nn.Linear(8, input_dim)
        )

    def forward(self, x):
        z = self.encoder(x)
        return self.decoder(z)

def train_autoencoder():
    print("=" * 65)
    print("ASTID SLICE 2: TRAINING ZERO-DAY AUTOENCODER (NORMAL MANIFOLD)")
    print("=" * 65)

    con = duckdb.connect()
    
    # Load legitimate train data (steps 1..550, isFraud == 0)
    # Downsample normal rows to 250,000 for lightning fast, stable convergence on CPU
    print("[1/5] Extracting normal transactions from DuckDB warehouse...")
    t0 = time.time()
    train_normal_df = con.execute(f"""
        SELECT *
        FROM '{PARQUET_PATH}'
        WHERE step <= 550 AND isFraud = 0
        USING SAMPLE 250000 (reservoir, 42)
    """).fetchdf()
    
    # Load normal validation data (steps 551..650, isFraud == 0) for 99.9th percentile tuning
    val_normal_df = con.execute(f"""
        SELECT *
        FROM '{PARQUET_PATH}'
        WHERE step > 550 AND step <= 650 AND isFraud = 0
        USING SAMPLE 50000 (reservoir, 42)
    """).fetchdf()

    # Load fraud validation data (steps 551..650, isFraud == 1) to test zero-day detection
    val_fraud_df = con.execute(f"""
        SELECT *
        FROM '{PARQUET_PATH}'
        WHERE step > 550 AND step <= 650 AND isFraud = 1
    """).fetchdf()

    con.close()
    print(f"      Train Normal Samples: {len(train_normal_df):,} | Val Normal: {len(val_normal_df):,} | Val Fraud: {len(val_fraud_df):,}")
    print(f"      Extraction Time: {time.time() - t0:.2f}s")

    # Extract 11 causal features
    print("\n[2/5] Extracting causal features and fitting StandardScaler...")
    X_train_raw = extract_batch_features(train_normal_df)
    X_val_norm_raw = extract_batch_features(val_normal_df)
    X_val_fraud_raw = extract_batch_features(val_fraud_df)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw).astype(np.float32)
    X_val_norm_scaled = scaler.transform(X_val_norm_raw).astype(np.float32)
    X_val_fraud_scaled = scaler.transform(X_val_fraud_raw).astype(np.float32)

    # Save scaler artifact
    scaler_path = os.path.join(ARTIFACTS_DIR, "ae_scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"      Fitted and saved scaler to {scaler_path}")

    # Torch DataLoader
    train_dataset = TensorDataset(torch.from_numpy(X_train_scaled))
    train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True, drop_last=True)

    # Model, Optimizer, Loss
    print("\n[3/5] Training Deep Autoencoder on normal transactions...")
    device = torch.device("cpu")
    model = DeepAutoencoder(input_dim=len(FEATURE_NAMES), latent_dim=4).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.005, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=8)

    model.train()
    epochs = 8
    t_train = time.time()
    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        batches = 0
        for (batch_x,) in train_loader:
            batch_x = batch_x.to(device)
            optimizer.zero_grad()
            reconstructed = model(batch_x)
            loss = criterion(reconstructed, batch_x)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            batches += 1
        scheduler.step()
        avg_loss = total_loss / batches
        print(f"      Epoch {epoch}/{epochs} | MSE Loss: {avg_loss:.5f}")

    print(f"      Training finished in {time.time() - t_train:.2f}s")

    # [4/5] Compute Reconstruction Errors & 99.9th Percentile Normalization
    print("\n[4/5] Computing reconstruction error distribution...")
    model.eval()
    with torch.no_grad():
        val_norm_tensor = torch.from_numpy(X_val_norm_scaled).to(device)
        recon_norm = model(val_norm_tensor)
        # Sample-wise MSE
        mse_norm = torch.mean((recon_norm - val_norm_tensor) ** 2, dim=1).numpy()

        val_fraud_tensor = torch.from_numpy(X_val_fraud_scaled).to(device)
        recon_fraud = model(val_fraud_tensor)
        mse_fraud = torch.mean((recon_fraud - val_fraud_tensor) ** 2, dim=1).numpy()

    p50_norm = float(np.percentile(mse_norm, 50))
    p95_norm = float(np.percentile(mse_norm, 95))
    p99_norm = float(np.percentile(mse_norm, 99))
    p99_9_norm = float(np.percentile(mse_norm, 99.9))

    print(f"      Normal MSE: Median={p50_norm:.4f}, P95={p95_norm:.4f}, P99={p99_norm:.4f}, P99.9={p99_9_norm:.4f}")
    print(f"      Fraud MSE:  Median={float(np.median(mse_fraud)):.4f}, Mean={float(np.mean(mse_fraud)):.4f}")

    # Clip normalization bound is P99.9 of normal transactions
    norm_clip = p99_9_norm

    # Calculate normalized scores on fraud (norm_error = clip(mse / norm_clip, 0, 1))
    norm_fraud_scores = np.clip(mse_fraud / norm_clip, 0.0, 1.0)
    high_anom_recall = float((norm_fraud_scores >= 0.70).mean())
    severe_anom_recall = float((norm_fraud_scores >= 0.90).mean())
    print(f"      Zero-Day Anomaly Detection: {high_anom_recall*100:.1f}% fraud cases score >= 0.70 (Review), {severe_anom_recall*100:.1f}% score >= 0.90 (Escalate)")

    # [5/5] Save Model & Config
    print("\n[5/5] Saving Autoencoder weights and configuration...")
    torch_path = os.path.join(ARTIFACTS_DIR, "autoencoder.pt")
    torch.save(model.state_dict(), torch_path)

    config = {
        "model_architecture": "DeepAutoencoder(11 -> 8 -> 4 -> 8 -> 11)",
        "features": FEATURE_NAMES,
        "error_norm_p99_9": norm_clip,
        "median_normal_error": p50_norm,
        "review_threshold": 0.70,
        "escalate_threshold": 0.90,
        "trained_samples": len(train_normal_df),
        "validation_samples": len(val_normal_df)
    }
    config_path = os.path.join(ARTIFACTS_DIR, "ae_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"      Weights: {torch_path}")
    print(f"      Config:  {config_path}")
    print("\n[SLICE 2 COMPLETE] ZERO-DAY AUTOENCODER SUCCESSFULLY TRAINED!")

if __name__ == "__main__":
    train_autoencoder()
