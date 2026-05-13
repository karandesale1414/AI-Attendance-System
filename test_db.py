import sqlite3

conn = sqlite3.connect("attendance.db")
cur = conn.cursor()

cur.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER)")
conn.commit()
conn.close()

print("DB CREATED SUCCESSFULLY")