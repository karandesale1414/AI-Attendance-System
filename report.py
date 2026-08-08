import sqlite3
import os
from openpyxl import Workbook

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "attendance.db")


def generate_student_report(name):

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        # 🔥 SAFE QUERY (no crash if columns exist)
        cur.execute("""
            SELECT name, date, entry_time, exit_time, working_hours
            FROM attendance
            WHERE name=?
        """, (name,))

        rows = cur.fetchall()
        conn.close()

        if not rows:
            print("❌ No data found for:", name)
            return

        wb = Workbook()
        ws = wb.active

        ws.append(["Name", "Date", "Entry Time", "Exit Time", "Hours"])

        for r in rows:
            ws.append(r)

        file_path = os.path.join(BASE_DIR, f"{name}_report.xlsx")
        wb.save(file_path)

        print("✅ Report Created:", file_path)

    except Exception as e:
        print("❌ ERROR:", e)


# ---------------- TEST RUN ----------------
if __name__ == "__main__":
    user = input("Enter student name: ")
    generate_student_report(user)