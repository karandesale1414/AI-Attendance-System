import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "attendance.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(attendance)")
rows = cur.fetchall()

print("TABLE STRUCTURE:")
for r in rows:
    print(r)

conn.close()