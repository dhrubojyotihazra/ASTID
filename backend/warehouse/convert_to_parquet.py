import os
import time
import duckdb

def convert():
    csv_path = os.path.abspath("ml/data/PS_20174392719_1491204439457_log.csv")
    parquet_path = os.path.abspath("backend/warehouse/data/paysim_warehouse.parquet")
    sample_path = os.path.abspath("backend/warehouse/data/scored_test_sample.parquet")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Source PaySim CSV not found at: {csv_path}")

    csv_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
    print(f"[DuckDB ETL] Source CSV: {csv_path} ({csv_size_mb:.2f} MB)")

    start_time = time.time()
    con = duckdb.connect()

    # Query structure and count
    print("[DuckDB ETL] Scanning CSV schema and row counts...")
    schema = con.execute(f"DESCRIBE SELECT * FROM read_csv_auto('{csv_path.replace(os.sep, '/')}')").fetchall()
    for col in schema:
        print(f"  - {col[0]} ({col[1]})")

    # Export full dataset to Parquet with Snappy compression
    print(f"[DuckDB ETL] Writing columnar Parquet -> {parquet_path}...")
    con.execute(f"""
        COPY (SELECT * FROM read_csv_auto('{csv_path.replace(os.sep, '/')}')) 
        TO '{parquet_path.replace(os.sep, '/')}' (FORMAT PARQUET, COMPRESSION SNAPPY)
    """)

    parquet_size_mb = os.path.getsize(parquet_path) / (1024 * 1024)
    duration = time.time() - start_time
    print(f"[DuckDB ETL] Completed full conversion in {duration:.2f}s!")
    print(f"[DuckDB ETL] Size reduction: {csv_size_mb:.2f} MB -> {parquet_size_mb:.2f} MB (Compression ratio: {csv_size_mb/parquet_size_mb:.2f}x)")

    # Export 50,000-row test sample for live simulation & benchmarking
    print(f"[DuckDB ETL] Creating 50,000-row holdout test sample -> {sample_path}...")
    con.execute(f"""
        COPY (SELECT * FROM '{parquet_path.replace(os.sep, '/')}' WHERE step >= 650 LIMIT 50000) 
        TO '{sample_path.replace(os.sep, '/')}' (FORMAT PARQUET, COMPRESSION SNAPPY)
    """)
    sample_size_mb = os.path.getsize(sample_path) / (1024 * 1024)
    print(f"[DuckDB ETL] Test sample created: {sample_size_mb:.2f} MB")

    # Quick verification query
    row_count = con.execute(f"SELECT count(*) FROM '{parquet_path.replace(os.sep, '/')}'").fetchone()[0]
    fraud_count = con.execute(f"SELECT count(*) FROM '{parquet_path.replace(os.sep, '/')}' WHERE isFraud = 1").fetchone()[0]
    print(f"[DuckDB ETL] Verified Parquet row count: {row_count:,} | Fraud cases: {fraud_count:,} ({fraud_count/row_count*100:.4f}%)")

if __name__ == "__main__":
    convert()
