import smtplib
from email.message import EmailMessage
import os

# ---------------- EMAIL FUNCTION ----------------
def send_email_report():

    sender_email = "karand3961@gmail.com"

    sender_password = "rcpu xobp vpbf lcxn"

    receiver_email = "YOUR_EMAIL@gmail.com"

    pdf_file = "attendance_report.pdf"

    # ---------------- EMAIL ----------------
    msg = EmailMessage()

    msg['Subject'] = "AI Attendance Report"

    msg['From'] = sender_email

    msg['To'] = receiver_email

    msg.set_content(
        "Attendance report attached."
    )

    # ---------------- ATTACH PDF ----------------
    with open(pdf_file, "rb") as f:

        file_data = f.read()

        file_name = os.path.basename(pdf_file)

    msg.add_attachment(
        file_data,
        maintype="application",
        subtype="pdf",
        filename=file_name
    )

    # ---------------- SEND EMAIL ----------------
    with smtplib.SMTP_SSL(
        'smtp.gmail.com',
        465
    ) as smtp:

        smtp.login(
            sender_email,
            sender_password
        )

        smtp.send_message(msg)

    print("✅ Email Sent Successfully")