import customtkinter as ctk
import subprocess
import os

# ---------------- CURRENT PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- THEME ----------------
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ---------------- WINDOW ----------------
app = ctk.CTk()
app.title("AI Attendance System")
app.geometry("500x500")

# ---------------- TITLE ----------------
title = ctk.CTkLabel(
    app,
    text="AI Attendance System",
    font=("Arial", 28, "bold")
)
title.pack(pady=30)

# ---------------- FUNCTIONS ----------------
def run_capture():
    subprocess.Popen(
        ["python", os.path.join(BASE_DIR, "capture_faces.py")]
    )

def run_train():
    subprocess.Popen(
        ["python", os.path.join(BASE_DIR, "train_model.py")]
    )

def run_attendance():
    subprocess.Popen(
        ["python", os.path.join(BASE_DIR, "attendance.py")]
    )

def run_dashboard():
    subprocess.Popen(
        ["python", os.path.join(BASE_DIR, "dashboard.py")]
    )

# ---------------- BUTTONS ----------------
btn1 = ctk.CTkButton(
    app,
    text="Capture Faces",
    command=run_capture,
    width=250,
    height=50
)
btn1.pack(pady=15)

btn2 = ctk.CTkButton(
    app,
    text="Train Model",
    command=run_train,
    width=250,
    height=50
)
btn2.pack(pady=15)

btn3 = ctk.CTkButton(
    app,
    text="Start Attendance",
    command=run_attendance,
    width=250,
    height=50
)
btn3.pack(pady=15)

btn4 = ctk.CTkButton(
    app,
    text="Open Dashboard",
    command=run_dashboard,
    width=250,
    height=50
)
btn4.pack(pady=15)

# ---------------- EXIT ----------------
exit_btn = ctk.CTkButton(
    app,
    text="Exit",
    fg_color="red",
    command=app.destroy,
    width=250,
    height=50
)
exit_btn.pack(pady=30)

# ---------------- RUN ----------------
app.mainloop()