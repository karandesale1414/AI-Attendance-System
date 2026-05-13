import cv2
import os

# 👉 CURRENT DIRECTORY CHECK
print("Current Directory:", os.getcwd())

# 👉 SAFE PATH (Documents me save karega)
save_path = os.path.join(os.getcwd(), "faces")

if not os.path.exists(save_path):
    os.makedirs(save_path)

print("Saving in:", save_path)

cam = cv2.VideoCapture(0)

if not cam.isOpened():
    print("❌ Camera issue")
    exit()

face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

count = 0

while True:
    ret, img = cam.read()
    if not ret:
        break

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        count += 1

        file_name = os.path.join(save_path, f"img_{count}.jpg")

        success = cv2.imwrite(file_name, gray[y:y+h, x:x+w])

        print("👉 Saving:", file_name, "| Status:", success)

        break

    cv2.imshow("Test", img)

    if count >= 5:
        break

    if cv2.waitKey(1) == 27:
        break

cam.release()
cv2.destroyAllWindows()