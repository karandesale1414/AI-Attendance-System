import cv2
import os

# ---------------- USER INFO ----------------
user_name = input("Enter Name: ")
user_id = input("Enter ID: ")

# ---------------- PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- FACES FOLDER ----------------
faces_path = os.path.join(BASE_DIR, "faces")

if not os.path.exists(faces_path):
    os.makedirs(faces_path)

# ---------------- LOAD FACE DETECTOR ----------------
face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ---------------- CAMERA ----------------
cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# HD Resolution
cam.set(3, 1280)
cam.set(4, 720)

count = 0

print("📸 FACE CAPTURE STARTED")
print("💡 Sit in good lighting")
print("😀 Keep face in center")
print("❌ Press Q to Exit")

while True:

    ret, frame = cam.read()

    if not ret:
        print("❌ Camera Error")
        break

    # Flip Camera
    frame = cv2.flip(frame, 1)

    # Improve Brightness
    frame = cv2.convertScaleAbs(frame, alpha=1.2, beta=25)

    # Convert to Gray
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Improve Contrast
    gray = cv2.equalizeHist(gray)

    # ---------------- FACE DETECTION ----------------
    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=8,
        minSize=(120, 120),
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    for (x, y, w, h) in faces:

        # ---------------- FILTER FAKE DETECTIONS ----------------
        if w < 120 or h < 120:
            continue

        # Face shape ratio check
        ratio = w / h

        if ratio < 0.75 or ratio > 1.3:
            continue

        # Crop Face
        face = gray[y:y+h, x:x+w]

        # Resize Face
        face = cv2.resize(face, (200, 200))

        # Increase Counter
        count += 1

        # File Name
        file_name = f"{user_name}.{user_id}.{count}.jpg"

        # Save Image
        cv2.imwrite(
            os.path.join(faces_path, file_name),
            face
        )

        # Draw Rectangle
        cv2.rectangle(
            frame,
            (x, y),
            (x+w, y+h),
            (0, 255, 0),
            3
        )

        # Show Counter
        cv2.putText(
            frame,
            f"Saved: {count}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,255,0),
            2
        )

    # ---------------- SHOW WINDOW ----------------
    cv2.imshow("AI Face Capture", frame)

    # Stop after 100 images
    if count >= 100:
        break

    # Press Q to Exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ---------------- CLEANUP ----------------
cam.release()
cv2.destroyAllWindows()

print("✅ FACE DATA CAPTURED")
print(f"✅ Total Images Saved: {count}")