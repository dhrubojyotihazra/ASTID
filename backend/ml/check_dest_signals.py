import os
import duckdb

p = os.path.abspath("backend/warehouse/data/paysim_warehouse.parquet").replace(os.sep, "/")
con = duckdb.connect()

print("=" * 65)
print("PAYSIM DESTINATION SIGNALS CHECK (6.36M ROWS)")
print("=" * 65)

query = f"""
    WITH dest_counts AS (
        SELECT nameDest, count(*) as cnt 
        FROM '{p}' 
        GROUP BY nameDest
    )
    SELECT 
        t.isFraud,
        count(*) as total_rows,
        round(avg(CASE WHEN d.cnt > 1 THEN 1.0 ELSE 0.0 END), 4) as dest_repeat,
        round(avg(CASE WHEN t.oldbalanceDest = 0 THEN 1.0 ELSE 0.0 END), 4) as dest_oldbal_zero,
        round(avg(CASE WHEN t.nameDest LIKE 'M%' THEN 1.0 ELSE 0.0 END), 4) as merchant_dest
    FROM '{p}' t
    JOIN dest_counts d ON t.nameDest = d.nameDest
    GROUP BY t.isFraud
    ORDER BY t.isFraud ASC
"""

res = con.execute(query).fetchall()

print(f"{'isFraud':<8} | {'Total Rows':<12} | {'dest_repeat':<12} | {'dest_oldbal_zero':<16} | {'merchant_dest':<14}")
print("-" * 65)
for r in res:
    print(f"{r[0]:<8} | {r[1]:<12,d} | {r[2]:<12.4f} | {r[3]:<16.4f} | {r[4]:<14.4f}")
