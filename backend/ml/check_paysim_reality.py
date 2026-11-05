import duckdb
import os

p = os.path.abspath("backend/warehouse/data/paysim_warehouse.parquet").replace(os.sep, "/")
con = duckdb.connect()

print("=" * 60)
print("PAYSIM DATASET GROUND-TRUTH REALITY CHECK")
print("=" * 60)

# Check 1: nameOrig max frequency & value counts
print("\n--- 1. nameOrig Frequency Distribution ---")
top_orig = con.execute(f"""
    SELECT nameOrig, count(*) as cnt 
    FROM '{p}' 
    GROUP BY nameOrig 
    ORDER BY cnt DESC 
    LIMIT 10
""").fetchall()
print("Top 10 most frequent nameOrig:")
for name, cnt in top_orig:
    print(f"  {name}: {cnt} times")

total_rows = con.execute(f"SELECT count(*) FROM '{p}'").fetchone()[0]
total_orig = con.execute(f"SELECT count(DISTINCT nameOrig) FROM '{p}'").fetchone()[0]
orig_gt_1 = con.execute(f"SELECT count(*) FROM (SELECT nameOrig FROM '{p}' GROUP BY nameOrig HAVING count(*) > 1)").fetchone()[0]
max_orig_cnt = con.execute(f"SELECT max(cnt) FROM (SELECT count(*) as cnt FROM '{p}' GROUP BY nameOrig)").fetchone()[0]

print(f"\nTotal transactions: {total_rows:,}")
print(f"Distinct nameOrig:  {total_orig:,}")
print(f"Max nameOrig count (df.nameOrig.value_counts().max()): {max_orig_cnt}")
print(f"nameOrig with count > 1: {orig_gt_1:,} ({orig_gt_1 / total_orig * 100:.4f}% of accounts)")

# Check 2: isFraud vs nameOrig.nunique()
print("\n--- 2. isFraud vs unique nameOrig ---")
fraud_groups = con.execute(f"""
    SELECT 
        isFraud, 
        count(DISTINCT nameOrig) as unique_orig, 
        count(*) as total_records,
        max(cnt) as max_repeat_per_user
    FROM (
        SELECT isFraud, nameOrig, count(*) over (partition by isFraud, nameOrig) as cnt
        FROM '{p}'
    )
    GROUP BY isFraud
""").fetchall()

for is_f, unq_orig, tot, max_rep in fraud_groups:
    print(f"isFraud = {is_f}:")
    print(f"  unique nameOrig:     {unq_orig:,}")
    print(f"  total records:       {tot:,}")
    print(f"  max repeat per user: {max_rep}")
    print(f"  ratio (tot/unq):     {tot/unq_orig:.6f}")

# Check 3: nameDest Frequency
print("\n--- 3. nameDest Frequency Distribution ---")
total_dest = con.execute(f"SELECT count(DISTINCT nameDest) FROM '{p}'").fetchone()[0]
max_dest_cnt = con.execute(f"SELECT max(cnt) FROM (SELECT count(*) as cnt FROM '{p}' GROUP BY nameDest)").fetchone()[0]
dest_gt_1 = con.execute(f"SELECT count(*) FROM (SELECT nameDest FROM '{p}' GROUP BY nameDest HAVING count(*) > 1)").fetchone()[0]
print(f"Distinct nameDest:  {total_dest:,}")
print(f"Max nameDest count: {max_dest_cnt:,}")
print(f"nameDest with count > 1: {dest_gt_1:,} ({dest_gt_1 / total_dest * 100:.2f}%)")

# Check 4: Transfer -> Cashout Chain Reality
print("\n--- 4. TRANSFER -> CASH_OUT Account Linking ---")
overlap_orig_dest = con.execute(f"""
    SELECT count(DISTINCT nameDest) 
    FROM '{p}' 
    WHERE nameDest IN (SELECT DISTINCT nameOrig FROM '{p}')
""").fetchone()[0]
print(f"Accounts appearing as BOTH nameDest and nameOrig: {overlap_orig_dest:,}")

fraud_overlap = con.execute(f"""
    SELECT count(DISTINCT nameDest) 
    FROM '{p}' 
    WHERE isFraud = 1 
      AND nameDest IN (SELECT DISTINCT nameOrig FROM '{p}' WHERE isFraud = 1)
""").fetchone()[0]
print(f"Fraud accounts appearing as BOTH nameDest and nameOrig: {fraud_overlap}")
