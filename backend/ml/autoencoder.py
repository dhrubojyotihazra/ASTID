"""
ASTID ML ENGINE - ZERO-DAY AUTOENCODER INFERENCE MODULE
Provides sub-millisecond reconstruction anomaly scoring with 99.9th percentile normalized error.
"""

import os
import json
import joblib
import numpy as np
import torch
import torch.nn as nn
from typing import Tuple, Dict, Any, Optional

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

class AutoencoderScorer:
    def __init__(self, artifacts_dir: str = "backend/ml/artifacts"):
        self.artifacts_dir = os.path.abspath(artifacts_dir)
        self.model: Optional[DeepAutoencoder] = None
        self.scaler = None
        self.error_norm_p99_9 = 1.0887
        self.review_thresh = 0.70
        self.escalate_thresh = 0.90
        self.enabled = False

        self._load_artifacts()

    def _load_artifacts(self):
        torch_path = os.path.join(self.artifacts_dir, "autoencoder.pt")
        scaler_path = os.path.join(self.artifacts_dir, "ae_scaler.joblib")
        config_path = os.path.join(self.artifacts_dir, "ae_config.json")

        if os.path.exists(torch_path) and os.path.exists(scaler_path) and os.path.exists(config_path):
            try:
                # Load Config
                with open(config_path, "r") as f:
                    cfg = json.load(f)
                    self.error_norm_p99_9 = float(cfg.get("error_norm_p99_9", 1.0887))
                    self.review_thresh = float(cfg.get("review_threshold", 0.70))
                    self.escalate_thresh = float(cfg.get("escalate_threshold", 0.90))

                # Load Scaler
                self.scaler = joblib.load(scaler_path)

                # Load PyTorch Model
                model = DeepAutoencoder(input_dim=11, latent_dim=4)
                model.load_state_dict(torch.load(torch_path, map_location=torch.device("cpu"), weights_only=True))
                model.eval()
                self.model = model
                self.enabled = True
            except Exception as e:
                print(f"[AutoencoderScorer] Warning: Failed to load AE artifacts ({e}). Zero-day scoring disabled.")
                self.enabled = False

    def score(self, raw_feat_vector: np.ndarray) -> Tuple[float, float, str]:
        """
        Takes raw 11-feature vector, scales it, passes through autoencoder,
        computes sample MSE, and normalizes against 99.9th percentile.
        Returns:
            (norm_score: float in [0.0, 1.0], raw_mse: float, severity: str)
        """
        if not self.enabled or self.model is None or self.scaler is None:
            return 0.0, 0.0, "NORMAL"

        with torch.no_grad():
            scaled = self.scaler.transform(raw_feat_vector.reshape(1, -1)).astype(np.float32)
            tensor_in = torch.from_numpy(scaled)
            tensor_recon = self.model(tensor_in)
            mse = float(torch.mean((tensor_recon - tensor_in) ** 2).item())

            norm_score = float(np.clip(mse / self.error_norm_p99_9, 0.0, 1.0))

            if norm_score >= self.escalate_thresh:
                severity = "SEVERE_ZERO_DAY"
            elif norm_score >= self.review_thresh:
                severity = "NOVEL_PATTERN"
            else:
                severity = "NORMAL"

            return round(norm_score, 4), round(mse, 4), severity

# Singleton instance
ae_scorer_instance = AutoencoderScorer()
