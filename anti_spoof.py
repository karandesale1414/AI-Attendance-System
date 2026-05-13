from cvzone.FaceMeshModule import FaceMeshDetector
import cv2
import math

detector = FaceMeshDetector(maxFaces=1)

def eye_aspect_ratio(points):

    left = points[159]
    right = points[23]

    top = points[27]
    bottom = points[145]

    horizontal = math.hypot(left[0]-right[0], left[1]-right[1])
    vertical = math.hypot(top[0]-bottom[0], top[1]-bottom[1])

    ratio = vertical / horizontal

    return ratio

def check_real_face(frame):

    frame, faces = detector.findFaceMesh(frame, draw=False)

    if faces:

        face = faces[0]

        ratio = eye_aspect_ratio(face)

        # BLINK DETECT
        if ratio < 0.20:
            return True

    return False