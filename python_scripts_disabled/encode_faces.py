import cv2
import numpy as np
import os
from tensorflow.keras.models import load_model

# ---------------- MODEL ----------------
try:
    model = load_model("facenet_keras.h5")
except:
    print("❌ Model load failed - check facenet_keras.h5")
    exit()

# ---------------- EMBEDDING ----------------
def get_embedding(img):

    try:
        img = cv2.resize(img, (160, 160))
    except:
        return None

    img = img.astype("float32")

    img = (img - 127.5) / 128.0

    img = np.expand_dims(img, axis=0)

    return model.predict(img, verbose=0)[0]

# ---------------- DATASET ----------------
path = "dataset_faces"

if not os.path.exists(path):
    print("❌ dataset_faces missing")
    exit()

embeddings = []
names = []

for person in os.listdir(path):

    person_path = os.path.join(path, person)

    if not os.path.isdir(person_path):
        continue

    for img_name in os.listdir(person_path):

        img_path = os.path.join(person_path, img_name)

        img = cv2.imread(img_path)

        if img is None:
            print("Skipping bad image:", img_path)
            continue

        emb = get_embedding(img)

        if emb is None:
            continue

        embeddings.append(emb)
        names.append(person)

        print("Done:", person, img_name)

# ---------------- SAVE ----------------
np.save("encodings.npy", np.array(embeddings))
np.save("names.npy", np.array(names))

print("✅ Encoding completed successfully")