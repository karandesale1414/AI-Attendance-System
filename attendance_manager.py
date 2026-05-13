import sqlite3
from datetime import datetime

# ---------------- DATABASE ----------------
DB_NAME = "attendance.db"

# ---------------- MARK ATTENDANCE ----------------
def mark_attendance(student_id, name):

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    # ---------------- CURRENT DATE/TIME ----------------
    now = datetime.now()

    current_date = now.strftime("%Y-%m-%d")

    current_time = now.strftime("%H:%M:%S")

    # ---------------- CHECK DUPLICATE ----------------
    cursor.execute("""

        SELECT * FROM attendance

        WHERE student_id = ?
        AND date = ?

    """, (student_id, current_date))

    already_marked = cursor.fetchone()

    # ---------------- SAVE ATTENDANCE ----------------
    if already_marked is None:

        cursor.execute("""

            INSERT INTO attendance (
                student_id,
                name,
                date,
                time
            )

            VALUES (?, ?, ?, ?)

        """, (

            student_id,
            name,
            current_date,
            current_time

        ))

        conn.commit()

        print(f"✅ Attendance Marked -> {name}")

    else:

        print(f"⚠ Already Marked -> {name}")

    conn.close()