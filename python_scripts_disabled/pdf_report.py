import os
import pandas as pd

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

# ---------------- DESKTOP PDF PATH ----------------
pdf_file = r"C:\Users\karan\Desktop\Attendance_Report.pdf"

# ---------------- PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- ATTENDANCE FILE ----------------
attendance_file = os.path.join(BASE_DIR, "attendance.xlsx")

# ---------------- CHECK FILE ----------------
if not os.path.exists(attendance_file):
    print("attendance.xlsx not found")
    raise SystemExit

# ---------------- LOAD EXCEL ----------------
try:
    df = pd.read_excel(attendance_file)

except Exception as error:
    print("Excel Error:", error)
    raise SystemExit

# ---------------- CHECK EMPTY ----------------
if df.empty:
    print("Attendance file is empty")
    raise SystemExit

# ---------------- PDF DOCUMENT ----------------
doc = SimpleDocTemplate(
    pdf_file,
    pagesize=letter
)

# ---------------- ELEMENTS ----------------
elements = []

styles = getSampleStyleSheet()

# ---------------- TITLE ----------------
title = Paragraph(
    "AI Attendance Report",
    styles["Title"]
)

elements.append(title)

elements.append(Spacer(1, 20))

# ---------------- TABLE DATA ----------------
table_data = []

# HEADERS
table_data.append(df.columns.tolist())

# ROWS
for row in df.values.tolist():

    clean_row = []

    for item in row:
        clean_row.append(str(item))

    table_data.append(clean_row)

# ---------------- TABLE ----------------
table = Table(table_data)

# ---------------- STYLE ----------------
table_style = TableStyle([

    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),

    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),

    ("ALIGN", (0, 0), (-1, -1), "CENTER"),

    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

    ("FONTSIZE", (0, 0), (-1, -1), 10),

    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),

    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),

    ("GRID", (0, 0), (-1, -1), 1, colors.black)

])

table.setStyle(table_style)

elements.append(table)

# ---------------- BUILD PDF ----------------
try:

    doc.build(elements)

    print("\nPDF Generated Successfully")
    print("\nSaved At:")
    print(pdf_file)

except Exception as error:

    print("PDF Error:", error)