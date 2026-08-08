import sqlite3

# ---------------- CONNECT DATABASE ----------------
conn = sqlite3.connect("attendance.db")

cursor = conn.cursor()

# ---------------- STUDENTS TABLE ----------------
cursor.execute("""

CREATE TABLE IF NOT EXISTS students (

    id INTEGER PRIMARY KEY,

    name TEXT NOT NULL

)

""")

# ---------------- ATTENDANCE TABLE ----------------
cursor.execute("""

CREATE TABLE IF NOT EXISTS attendance (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id INTEGER,

    name TEXT,

    date TEXT,

    time TEXT

)

""")

# ---------------- SAVE ----------------
conn.commit()

conn.close()

print("✅ DATABASE CREATED SUCCESSFULLY")