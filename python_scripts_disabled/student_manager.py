import customtkinter as ctk
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "attendance.db")

# ---------------- UI ----------------
app = ctk.CTk()
app.geometry("700x500")
app.title("Student Manager")

name_var = ctk.StringVar()
roll_var = ctk.StringVar()

# ---------------- TITLE ----------------
title = ctk.CTkLabel(app, text="STUDENT MANAGEMENT", font=("Arial", 24, "bold"))
title.pack(pady=20)

# ---------------- INPUT ----------------
entry1 = ctk.CTkEntry(app, textvariable=name_var, placeholder_text="Student Name")
entry1.pack(pady=10)

entry2 = ctk.CTkEntry(app, textvariable=roll_var, placeholder_text="Roll Number")
entry2.pack(pady=10)

# ---------------- ADD STUDENT ----------------
def add_student():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        cur.execute("INSERT INTO students (name, roll) VALUES (?, ?)",
                    (name_var.get(), roll_var.get()))
        conn.commit()
    except Exception as e:
        print("Error:", e)

    conn.close()
    show_students()

btn = ctk.CTkButton(app, text="Add Student", command=add_student)
btn.pack(pady=10)

# ---------------- LIST ----------------
box = ctk.CTkTextbox(app, width=600, height=300)
box.pack(pady=20)

# ---------------- SHOW ----------------
def show_students():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT * FROM students")
    rows = cur.fetchall()

    box.delete("1.0", "end")

    for r in rows:
        box.insert("end", f"{r[0]} | {r[1]} | {r[2]}\n")

    conn.close()

show_students()

app.mainloop()