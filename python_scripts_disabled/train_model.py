import cv2
import os
import numpy as np
from PIL import Image

# ---------------- PROJECT PATH ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- FACES FOLDER ----------------
path = os.path.join(BASE_DIR, "faces")

print("Reading images from:", path)

# ---------------- CHECK FOLDER ----------------
if not os.path.exists(path):
    print("❌ Faces folder not found!")
    exit()

# ---------------- FACE DETECTOR ----------------
detector = cv2.CascadeClassifier(
    os.path.join(
        BASE_DIR,
        "haarcascade_frontalface_default.xml"
    )
)

# ---------------- LBPH RECOGNIZER ----------------
recognizer = cv2.face.LBPHFaceRecognizer_create()

face_samples = []
ids = []

# ---------------- READ IMAGES ----------------
for image_name in os.listdir(path):

    print("Found File:", image_name)

    image_path = os.path.join(path, image_name)

    try:

        # ---------------- IMAGE CHECK ----------------
        if not image_name.lower().endswith(
            ('.png', '.jpg', '.jpeg')
        ):
            print("Skipped Non-Image:", image_name)
            continue

        # ---------------- OPEN IMAGE ----------------
        pil_img = Image.open(image_path).convert('L')

        img_numpy = np.array(pil_img, 'uint8')

        # ---------------- GET ID ----------------
        # Example:
        # karan.04.1.jpg

        parts = image_name.split(".")

        if len(parts) < 4:
            print("❌ Invalid Filename:", image_name)
            continue

        face_id = int(parts[1])

        print("Detected ID:", face_id)

        # ---------------- DETECT FACE ----------------
        faces = detector.detectMultiScale(img_numpy)

        for (x, y, w, h) in faces:

            face_samples.append(
                img_numpy[y:y+h, x:x+w]
            )

            ids.append(face_id)

    except Exception as e:

        print("❌ Error Processing:", image_name)
        print("Reason:", e)

# ---------------- CHECK DATA ----------------
if len(face_samples) == 0:

    print("❌ No valid face data found!")
    exit()

# ---------------- TRAIN MODEL ----------------
print("Training Model...")

recognizer.train(
    face_samples,
    np.array(ids)
)

# ---------------- SAVE MODEL ----------------
trainer_path = os.path.join(
    BASE_DIR,
    "trainer.yml"
)

recognizer.save(trainer_path)

print("✅ MODEL TRAINED SUCCESSFULLY")
print("Saved at:", trainer_path)
print("Total Faces Trained:", len(face_samples))