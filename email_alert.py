import smtplib
from email.mime.text import MIMEText

EMAIL = "karand3961@gmail.com"
PASSWORD = "dvcj pwte ncum atfi"

def send_email(student_name):

    subject = "Attendance Alert"
    body = f"{student_name} marked present successfully."

    msg = MIMEText(body)

    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = EMAIL

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        server.login(EMAIL, PASSWORD)

        server.sendmail(
            EMAIL,
            EMAIL,
            msg.as_string()
        )

        server.quit()

        print("Email Sent Successfully")

    except Exception as e:
        print("Email Error:", e)