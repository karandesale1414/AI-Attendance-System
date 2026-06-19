import sqlite3

conn = sqlite3.connect("attendance.db")
cursor = conn.cursor()

cursor.execute("""
DROP TABLE IF EXISTS attendance
""")

cursor.execute("""
CREATE TABLE attendance (
    name TEXT,
    date TEXT,
    entry_time TEXT,
    exit_time TEXT,
    working_hours TEXT
)
""")

conn.commit()
conn.close()

print("Database Updated Successfully")