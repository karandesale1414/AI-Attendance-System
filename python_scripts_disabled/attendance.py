import cv2
import pandas as pd
from datetime import datetime
import os

from database import mark_attendance
from email_alert import send_email

# ---------------- PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- LOAD STUDENTS ----------------
students_file = os.path.join(BASE_DIR, "students.xlsx")

if not os.path.exists(students_file):
    print("students.xlsx missing")
    exit()

students = pd.read_excel(students_file)

# ---------------- LOAD MODEL ----------------
recognizer = cv2.face.LBPHFaceRecognizer_create()

trainer_file = os.path.join(BASE_DIR, "trainer.yml")

if not os.path.exists(trainer_file):
    print("trainer.yml missing")
    exit()

recognizer.read(trainer_file)

# ---------------- FACE CASCADE ----------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ---------------- UNKNOWN FOLDER ----------------
unknown_folder = os.path.join(BASE_DIR, "unknown_faces")

if not os.path.exists(unknown_folder):
    os.makedirs(unknown_folder)

# ---------------- CAMERA ----------------
cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cam.isOpened():
    print("Camera not working")
    exit()

print("AI Attendance System Started...")

# ---------------- ANTI SPAM ----------------
last_seen = {}
last_unknown_save = 0

while True:

    ret, frame = cam.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # ---------------- FACE DETECTION ----------------
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=6,
        minSize=(100, 100)
    )

    for (x, y, w, h) in faces:

        # ---------------- FACE CROP ----------------
        face = gray[y:y+h, x:x+w]

        # ---------------- RESIZE ----------------
        face = cv2.resize(face, (200, 200))

        # ---------------- PREDICT ----------------
        try:
            id, confidence = recognizer.predict(face)

        except Exception as e:
            print("Prediction Error:", e)
            continue

        print(f"ID: {id} | Confidence: {confidence}")

        # ---------------- RECOGNIZED ----------------
        if confidence < 70:

            student = students[students["ID"] == id]

            if not student.empty:

                name = student.iloc[0]["Name"]

                now = datetime.now()

                key = (id, now.strftime("%Y-%m-%d"))

                # ---------------- ANTI SPAM ----------------
                if key not in last_seen or (
                    datetime.now().timestamp() - last_seen[key]
                ) > 10:

                    last_seen[key] = datetime.now().timestamp()

                    try:

                        # SAVE ATTENDANCE
                        mark_attendance(name, "Present")

                        # SEND EMAIL
                        send_email(name)

                        print(f"ENTRY MARKED: {name}")

                    except Exception as e:
                        print("DATABASE/EMAIL ERROR:", e)

                # ---------------- GREEN BOX ----------------
                cv2.rectangle(
                    frame,
                    (x, y),
                    (x+w, y+h),
                    (0,255,0),
                    2
                )

                cv2.putText(
                    frame,
                    f"{name} ({round(100-confidence)}%)",
                    (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0,255,0),
                    2
                )

        # ---------------- UNKNOWN ----------------
        else:

            cv2.rectangle(
                frame,
                (x, y),
                (x+w, y+h),
                (0,0,255),
                2
            )

            cv2.putText(
                frame,
                "Unknown",
                (x, y-10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0,0,255),
                2
            )

            # ---------------- SAVE UNKNOWN ----------------
            current_time = datetime.now().timestamp()

            if current_time - last_unknown_save > 5:

                img_path = os.path.join(
                    unknown_folder,
                    f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                )

                cv2.imwrite(img_path, frame)

                last_unknown_save = current_time

    # ---------------- SHOW WINDOW ----------------
    cv2.imshow("AI Attendance System", frame)

    # PRESS ESC TO EXIT
    if cv2.waitKey(1) == 27:
        break

# ---------------- RELEASE ----------------
cam.release()
cv2.destroyAllWindows()