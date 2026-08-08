import customtkinter as ctk
from tkinter import messagebox
import pandas as pd
import os

# ---------------- THEME ----------------
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ---------------- WINDOW ----------------
app = ctk.CTk()
app.title("Student Registration")
app.geometry("500x500")

# ---------------- FILE ----------------
students_file = "students.xlsx"

# CREATE FILE IF NOT EXISTS
if not os.path.exists(students_file):

    df = pd.DataFrame(columns=["ID", "Name"])

    df.to_excel(students_file, index=False)

# ---------------- TITLE ----------------
title = ctk.CTkLabel(
    app,
    text="Student Registration Form",
    font=("Arial", 26, "bold")
)

title.pack(pady=20)

# ---------------- ID ----------------
id_label = ctk.CTkLabel(
    app,
    text="Student ID",
    font=("Arial", 18)
)

id_label.pack(pady=5)

id_entry = ctk.CTkEntry(
    app,
    width=300,
    height=40,
    font=("Arial", 16)
)

id_entry.pack(pady=10)

# ---------------- NAME ----------------
name_label = ctk.CTkLabel(
    app,
    text="Student Name",
    font=("Arial", 18)
)

name_label.pack(pady=5)

name_entry = ctk.CTkEntry(
    app,
    width=300,
    height=40,
    font=("Arial", 16)
)

name_entry.pack(pady=10)

# ---------------- SAVE FUNCTION ----------------
def save_student():

    student_id = id_entry.get().strip()
    student_name = name_entry.get().strip()

    # VALIDATION
    if student_id == "" or student_name == "":
        messagebox.showerror(
            "Error",
            "All fields are required"
        )
        return

    # LOAD FILE
    df = pd.read_excel(students_file)

    # CHECK DUPLICATE ID
    if int(student_id) in df["ID"].values:

        messagebox.showerror(
            "Error",
            "Student ID already exists"
        )

        return

    # NEW DATA
    new_row = {
        "ID": int(student_id),
        "Name": student_name
    }

    # ADD DATA
    df = pd.concat(
        [df, pd.DataFrame([new_row])],
        ignore_index=True
    )

    # SAVE
    df.to_excel(students_file, index=False)

    messagebox.showinfo(
        "Success",
        "Student Registered Successfully"
    )

    # CLEAR
    id_entry.delete(0, "end")
    name_entry.delete(0, "end")

# ---------------- BUTTON ----------------
save_btn = ctk.CTkButton(
    app,
    text="Register Student",
    command=save_student,
    width=250,
    height=50,
    font=("Arial", 18)
)

save_btn.pack(pady=30)

# ---------------- RUN ----------------
app.mainloop()