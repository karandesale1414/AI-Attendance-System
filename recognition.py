import cv2
from datetime import datetime
from database import init_db, mark_attendance

# ---------------- INIT DB ----------------
init_db()

# ---------------- MODEL ----------------
recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read("trainer.yml")

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

names = {
    1: "Karan",
    2: "Rahul",
    3: "Amit"
}

cam = cv2.VideoCapture(0)

print("🔴 Running Face Recognition with Attendance...")

while True:
    ret, img = cam.read()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:

        id, confidence = recognizer.predict(gray[y:y+h, x:x+w])

        if confidence < 60:
            name = names.get(id, "Unknown")

            # ---------------- TIME ----------------
            now = datetime.now()
            date = now.strftime("%Y-%m-%d")
            time = now.strftime("%H:%M:%S")

            # ---------------- MARK ATTENDANCE ----------------
            mark_attendance(id, name, date, time)

            text = f"{name} | {round(100 - confidence)}%"
            color = (0, 255, 0)
        else:
            text = "Unknown"
            color = (0, 0, 255)

        cv2.rectangle(img, (x, y), (x+w, y+h), color, 2)

        cv2.putText(
            img,
            text,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            color,
            2
        )

    cv2.imshow("Attendance System", img)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cam.release()
cv2.destroyAllWindows()