import cv2
import os

# Folder create
if not os.path.exists("unknown_faces"):
    os.makedirs("unknown_faces")

# Black image create
img = cv2.imread("trainer.yml")

# Dummy white image
import numpy as np
dummy = np.ones((200,200,3), dtype="uint8") * 255

# Save
path = "unknown_faces/test.jpg"

saved = cv2.imwrite(path, dummy)

print("Saved:", saved)
print("Path:", os.path.abspath(path))