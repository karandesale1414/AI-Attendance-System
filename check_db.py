import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "attendance.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT * FROM attendance")
rows = cur.fetchall()

print("TOTAL RECORDS:", len(rows))
print("-" * 30)

for row in rows:
    print(row)

conn.close()