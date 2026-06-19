import cv2
import os
from attendance_manager import mark_attendance

# ---------------- PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- TRAINER FILE ----------------
trainer_path = os.path.join(BASE_DIR, "trainer.yml")

# ---------------- LOAD RECOGNIZER ----------------
recognizer = cv2.face.LBPHFaceRecognizer_create(
    radius=2,
    neighbors=16,
    grid_x=8,
    grid_y=8
)

recognizer.read(trainer_path)

# ---------------- FACE CASCADE ----------------
faceCascade = cv2.CascadeClassifier(
    os.path.join(
        BASE_DIR,
        "haarcascade_frontalface_default.xml"
    )
)

# ---------------- FONT ----------------
font = cv2.FONT_HERSHEY_SIMPLEX

# ---------------- NAME MAP ----------------
names = {
    4: "Karan"
}

# ---------------- CAMERA ----------------
cam = cv2.VideoCapture(0)

cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# ---------------- CAMERA QUALITY ----------------
cam.set(cv2.CAP_PROP_BRIGHTNESS, 150)

print("Starting AI Face Recognition...")

# ---------------- ATTENDANCE CACHE ----------------
marked_ids = set()

while True:

    ret, img = cam.read()

    if not ret:
        print("❌ Camera Error")
        break

    # ---------------- FLIP ----------------
    img = cv2.flip(img, 1)

    # ---------------- GRAYSCALE ----------------
    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    # ---------------- IMAGE ENHANCEMENT ----------------
    gray = cv2.equalizeHist(gray)

    gray = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )

    # ---------------- DETECT FACE ----------------
    faces = faceCascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=8,
        minSize=(120, 120)
    )

    for (x, y, w, h) in faces:

        # ---------------- FACE ROI ----------------
        face_roi = gray[y:y+h, x:x+w]

        face_roi = cv2.resize(
            face_roi,
            (200, 200)
        )

        # ---------------- PREDICT ----------------
        id, confidence = recognizer.predict(face_roi)

        print("ID:", id, "Confidence:", confidence)

        # ---------------- CONFIDENCE PERCENT ----------------
        confidence_percent = round(
            100 - confidence
        )

        # ---------------- MATCH ----------------
        if confidence < 85:

            name = names.get(
                id,
                "Unknown"
            )

            # ---------------- SAVE ATTENDANCE ----------------
            if id not in marked_ids:

                mark_attendance(id, name)

                marked_ids.add(id)

            text = f"{name} | {confidence_percent}%"

            color = (0, 255, 0)

        else:

            text = "Unknown"

            color = (0, 0, 255)

        # ---------------- FACE BOX ----------------
        cv2.rectangle(
            img,
            (x, y),
            (x+w, y+h),
            color,
            3
        )

        # ---------------- TEXT ----------------
        cv2.putText(
            img,
            text,
            (x, y-10),
            font,
            0.9,
            color,
            2
        )

    # ---------------- SHOW WINDOW ----------------
    cv2.imshow(
        "AI Face Recognition Attendance",
        img
    )

    # ---------------- EXIT ----------------
    key = cv2.waitKey(1)

    if key == ord('q'):
        break

# ---------------- CLEANUP ----------------
cam.release()

cv2.destroyAllWindows()