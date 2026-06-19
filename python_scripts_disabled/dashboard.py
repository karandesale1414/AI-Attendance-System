import customtkinter as ctk
from tkinter import ttk
import sqlite3
import pandas as pd
from datetime import datetime
import subprocess
import os

from PIL import Image, ImageTk

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

from email_report import send_email_report

# ---------------- THEME ----------------
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ---------------- WINDOW ----------------
app = ctk.CTk()

app.title("AI Attendance Dashboard")

app.geometry("1450x850")

# ---------------- TITLE ----------------
title = ctk.CTkLabel(
    app,
    text="AI FACE RECOGNITION ATTENDANCE SYSTEM",
    font=("Montserrat", 32, "bold"),
    text_color="#4FC3F7"
)

title.pack(pady=20)

# ---------------- TOP FRAME ----------------
top_frame = ctk.CTkFrame(
    app,
    corner_radius=20,
    fg_color="#1e1e1e"
)

top_frame.pack(
    fill="x",
    padx=20,
    pady=10
)

# ---------------- TOTAL STUDENTS ----------------
student_label = ctk.CTkLabel(
    top_frame,
    text="👨‍🎓 Total Students: 0",
    font=("Arial", 22, "bold"),
    text_color="#00E676"
)

student_label.pack(
    side="left",
    padx=30,
    pady=20
)

# ---------------- TODAY ATTENDANCE ----------------
attendance_label = ctk.CTkLabel(
    top_frame,
    text="📅 Today's Attendance: 0",
    font=("Arial", 22, "bold"),
    text_color="#FFCA28"
)

attendance_label.pack(
    side="left",
    padx=30
)

# ---------------- BUTTON FRAME ----------------
button_frame = ctk.CTkFrame(
    app,
    corner_radius=20,
    fg_color="#1e1e1e"
)

button_frame.pack(
    fill="x",
    padx=20,
    pady=10
)

# ---------------- START RECOGNITION ----------------
def start_recognition():

    subprocess.Popen(
        ["python", "recognizer.py"]
    )

# ---------------- EXPORT EXCEL ----------------
def export_excel():

    conn = sqlite3.connect("attendance.db")

    df = pd.read_sql_query(
        "SELECT * FROM attendance",
        conn
    )

    df.to_excel(
        "attendance_export.xlsx",
        index=False
    )

    conn.close()

    email_status.configure(
        text="✅ Excel Exported"
    )

# ---------------- EXPORT PDF ----------------
def export_pdf():

    conn = sqlite3.connect("attendance.db")

    cursor = conn.cursor()

    cursor.execute("""

        SELECT student_id, name, date, time
        FROM attendance

    """)

    data = cursor.fetchall()

    conn.close()

    pdf = SimpleDocTemplate(
        "attendance_report.pdf"
    )

    elements = []

    styles = getSampleStyleSheet()

    pdf_title = Paragraph(
        "AI Attendance Report",
        styles['Title']
    )

    elements.append(pdf_title)

    elements.append(Spacer(1, 20))

    table_data = [
        ["Student ID", "Name", "Date", "Time"]
    ]

    for row in data:

        table_data.append(row)

    table = Table(table_data)

    table.setStyle(TableStyle([

        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1f6aa5")),

        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),

        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),

        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),

        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),

        ('GRID', (0, 0), (-1, -1), 1, colors.black)

    ]))

    elements.append(table)

    pdf.build(elements)

    email_status.configure(
        text="✅ PDF Exported"
    )

# ---------------- SEND EMAIL ----------------
def send_email():

    try:

        export_pdf()

        send_email_report()

        email_status.configure(
            text="✅ Email Sent Successfully"
        )

    except Exception as e:

        email_status.configure(
            text=f"❌ {e}"
        )

# ---------------- BUTTONS ----------------

recognition_btn = ctk.CTkButton(
    button_frame,
    text="🎥 Start Recognition",
    command=start_recognition,
    width=220,
    height=55,
    font=("Arial", 18, "bold"),
    fg_color="#1f6aa5",
    hover_color="#144870",
    corner_radius=12
)

recognition_btn.pack(
    side="left",
    padx=15,
    pady=20
)

# ---------------- EXCEL BUTTON ----------------
excel_btn = ctk.CTkButton(
    button_frame,
    text="📗 Export Excel",
    command=export_excel,
    width=220,
    height=55,
    font=("Arial", 18, "bold"),
    fg_color="#107C41",
    hover_color="#0B5E31",
    corner_radius=12
)

excel_btn.pack(
    side="left",
    padx=15
)

# ---------------- PDF BUTTON ----------------
pdf_btn = ctk.CTkButton(
    button_frame,
    text="📕 Export PDF",
    command=export_pdf,
    width=220,
    height=55,
    font=("Arial", 18, "bold"),
    fg_color="#C62828",
    hover_color="#8E1B1B",
    corner_radius=12
)

pdf_btn.pack(
    side="left",
    padx=15
)

# ---------------- EMAIL BUTTON ----------------
email_btn = ctk.CTkButton(
    button_frame,
    text="📧 Send Gmail Report",
    command=send_email,
    width=260,
    height=55,
    font=("Arial", 18, "bold"),
    fg_color="#EA4335",
    hover_color="#C5221F",
    corner_radius=12
)

email_btn.pack(
    side="left",
    padx=15
)

# ---------------- STATUS LABEL ----------------
email_status = ctk.CTkLabel(
    button_frame,
    text="",
    font=("Arial", 14, "bold"),
    text_color="#00FF99"
)

email_status.pack(
    side="left",
    padx=20
)

# ---------------- MAIN FRAME ----------------
main_frame = ctk.CTkFrame(
    app,
    fg_color="transparent"
)

main_frame.pack(
    fill="both",
    expand=True,
    padx=20,
    pady=10
)

# ---------------- TABLE FRAME ----------------
table_frame = ctk.CTkFrame(
    main_frame,
    corner_radius=20,
    fg_color="#1e1e1e"
)

table_frame.pack(
    side="left",
    fill="both",
    expand=True,
    padx=10,
    pady=10
)

# ---------------- PHOTO FRAME ----------------
photo_frame = ctk.CTkFrame(
    main_frame,
    width=260,
    corner_radius=20,
    fg_color="#1e1e1e",
    border_width=2,
    border_color="#2b2b2b"
)

photo_frame.pack(
    side="right",
    fill="y",
    padx=10,
    pady=10
)

photo_title = ctk.CTkLabel(
    photo_frame,
    text="🖼 Student Photo",
    font=("Arial", 22, "bold"),
    text_color="#4FC3F7"
)

photo_title.pack(pady=20)

photo_label = ctk.CTkLabel(
    photo_frame,
    text="No Photo",
    width=220,
    height=220
)

photo_label.pack(pady=20)

# ---------------- TABLE STYLE ----------------
style = ttk.Style()

style.theme_use("default")

style.configure(
    "Treeview",
    background="#2b2b2b",
    foreground="white",
    rowheight=38,
    fieldbackground="#2b2b2b",
    borderwidth=0,
    font=("Arial", 12)
)

style.map(
    'Treeview',
    background=[('selected', '#1f6aa5')]
)

style.configure(
    "Treeview.Heading",
    background="#1f6aa5",
    foreground="white",
    font=("Arial", 13, "bold")
)

# ---------------- TABLE ----------------
columns = (
    "ID",
    "Student ID",
    "Name",
    "Date",
    "Time"
)

tree = ttk.Treeview(
    table_frame,
    columns=columns,
    show="headings",
    height=20
)

for col in columns:

    tree.heading(col, text=col)

    tree.column(
        col,
        width=160,
        anchor="center"
    )

# ---------------- SCROLLBAR ----------------
scrollbar = ttk.Scrollbar(
    table_frame,
    orient="vertical",
    command=tree.yview
)

tree.configure(
    yscrollcommand=scrollbar.set
)

scrollbar.pack(
    side="right",
    fill="y"
)

tree.pack(
    fill="both",
    expand=True,
    padx=10,
    pady=10
)

# ---------------- SHOW PHOTO ----------------
def show_student_photo(student_id):

    faces_folder = "faces"

    image_path = None

    if not os.path.exists(faces_folder):

        photo_label.configure(
            image="",
            text="Faces Folder Missing"
        )

        return

    for file in os.listdir(faces_folder):

        file_lower = file.lower()

        if (
            f".{student_id}." in file_lower
            and file_lower.endswith(
                (".jpg", ".jpeg", ".png")
            )
        ):

            image_path = os.path.join(
                faces_folder,
                file
            )

            break

    if image_path:

        try:

            img = Image.open(image_path)

            img = img.resize((220, 220))

            photo = ImageTk.PhotoImage(img)

            photo_label.configure(
                image=photo,
                text=""
            )

            photo_label.image = photo

        except Exception as e:

            print("Photo Error:", e)

            photo_label.configure(
                image="",
                text="Photo Error"
            )

    else:

        photo_label.configure(
            image="",
            text="No Photo Found"
        )

# ---------------- TABLE SELECT ----------------
def on_select(event):

    selected = tree.focus()

    data = tree.item(selected)

    values = data.get("values")

    if values:

        student_id = values[1]

        show_student_photo(student_id)

tree.bind(
    "<<TreeviewSelect>>",
    on_select
)

# ---------------- LOAD DATA ----------------
def load_data():

    conn = sqlite3.connect("attendance.db")

    cursor = conn.cursor()

    for row in tree.get_children():

        tree.delete(row)

    cursor.execute("""

        SELECT * FROM attendance
        ORDER BY id DESC

    """)

    rows = cursor.fetchall()

    for row in rows:

        tree.insert(
            "",
            "end",
            values=row
        )

    cursor.execute("""

        SELECT COUNT(*) FROM students

    """)

    total_students = cursor.fetchone()[0]

    today = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""

        SELECT COUNT(*) FROM attendance
        WHERE date=?

    """, (today,))

    today_attendance = cursor.fetchone()[0]

    student_label.configure(
        text=f"👨‍🎓 Total Students: {total_students}"
    )

    attendance_label.configure(
        text=f"📅 Today's Attendance: {today_attendance}"
    )

    conn.close()

    app.after(2000, load_data)

# ---------------- FOOTER ----------------
footer = ctk.CTkLabel(
    app,
    text="AI Attendance System | Developed with Python & OpenCV",
    font=("Arial", 14),
    text_color="#888888"
)

footer.pack(
    pady=10
)

# ---------------- START ----------------
load_data()

# ---------------- RUN ----------------
app.mainloop()