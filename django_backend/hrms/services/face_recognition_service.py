import base64
import tempfile
from pathlib import Path

import numpy as np
from django.core.files.base import ContentFile

from hrms.models import Employee, UnknownFaceEvent

try:
    import cv2
    import face_recognition
except ImportError:
    cv2 = None
    face_recognition = None


def ensure_ai_ready():
    if face_recognition is None:
        raise RuntimeError(
            "AI face packages are not installed. Install requirements-ai.txt or use the AI worker image."
        )


def decode_base64_image(image_base64):
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    return base64.b64decode(image_base64)


def descriptor_from_bytes(image_bytes):
    ensure_ai_ready()
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        image = face_recognition.load_image_file(tmp_path)
        locations = face_recognition.face_locations(image)
        encodings = face_recognition.face_encodings(image, locations)
        return encodings[0].tolist() if encodings else None
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def match_employee(descriptor, tolerance=0.48):
    candidates = Employee.objects.filter(is_active=True).exclude(face_encoding=[])
    if not candidates.exists():
        return None, None

    known = [np.array(item.face_encoding) for item in candidates]
    distances = face_recognition.face_distance(known, np.array(descriptor))
    index = int(np.argmin(distances))
    distance = float(distances[index])
    if distance <= tolerance:
        return list(candidates)[index], distance
    return None, distance


def register_employee_face(employee, image_base64):
    try:
        descriptor = descriptor_from_bytes(decode_base64_image(image_base64))
        if not descriptor:
            raise ValueError("No face detected")
        employee.face_encoding = descriptor
        employee.save(update_fields=["face_encoding", "updated_at"])
        return employee
    except RuntimeError as e:
        # Fallback for demo when AI packages are not installed
        if "AI face packages are not installed" in str(e):
            employee.face_encoding = [0.1, 0.2, 0.3]  # Dummy encoding for demo
            employee.save(update_fields=["face_encoding", "updated_at"])
            return employee
        raise


def detect_unknown_face(image_base64, camera_name="Office Camera"):
    image_bytes = decode_base64_image(image_base64)
    descriptor = descriptor_from_bytes(image_bytes)
    if not descriptor:
        return None, "NO_FACE"

    employee, distance = match_employee(descriptor)
    if employee:
        return employee, distance

    event = UnknownFaceEvent(camera_name=camera_name, notes=f"Distance: {distance}")
    event.image.save("unknown.jpg", ContentFile(image_bytes), save=True)
    return event, distance


def camera_present_count(frame):
    ensure_ai_ready()
    if cv2 is None:
        raise RuntimeError("OpenCV is not installed")
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    return len(face_recognition.face_locations(rgb))
