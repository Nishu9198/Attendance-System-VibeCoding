import json
import os
import base64
import boto3

s3 = boto3.client("s3")
rekognition = boto3.client("rekognition")
dynamodb = boto3.resource("dynamodb")

STUDENTS_TABLE = os.environ.get("STUDENTS_TABLE", "attendance-system-students")
PHOTOS_BUCKET = os.environ.get("PHOTOS_BUCKET", "attendance-system-photos")
table = dynamodb.Table(STUDENTS_TABLE)


def handle(event, method, path):
    """Handle face registration and face verification requests."""
    if method == "POST" and path == "/faces/register":
        return register_face(event)
    elif method == "POST" and path == "/faces/register-teacher":
        return register_teacher_face(event)
    elif method == "POST" and path == "/faces/verify":
        return verify_face(event)
    elif method == "POST" and path == "/faces/verify-teacher":
        return verify_teacher_face(event)
    elif method == "GET" and path.startswith("/faces/status/"):
        student_id = path.split("/")[-1]
        return get_face_status(student_id)
    else:
        return _response(405, {"error": "Method not allowed"})


def register_teacher_face(event):
    """Register master reference photo for teacher."""
    try:
        body = json.loads(event.get("body", "{}"))
        image_data = body.get("imageBase64", "")
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"

        if not image_data:
            return _response(400, {"error": "Missing imageBase64"})

        if "," in image_data:
            image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)

        # Detect face with Rekognition to verify face is present
        try:
            rek_res = rekognition.detect_faces(
                Image={"Bytes": image_bytes},
                Attributes=["DEFAULT"]
            )
            face_details = rek_res.get("FaceDetails", [])
            if len(face_details) == 0:
                return _response(400, {"error": "No clear face detected in snapshot. Please face the camera and try again."})
        except Exception as rek_err:
            print(f"Rekognition detect_faces error: {rek_err}")

        # Upload image to S3 bucket
        object_key = f"reference_faces/teacher_{teacher_id}.jpg"
        s3.put_object(
            Bucket=PHOTOS_BUCKET,
            Key=object_key,
            Body=image_bytes,
            ContentType="image/jpeg",
        )

        photo_url = f"https://{PHOTOS_BUCKET}.s3.amazonaws.com/{object_key}"
        return _response(200, {
            "message": "Master Teacher Face profile registered successfully!",
            "verified": True,
            "photoUrl": photo_url,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def register_face(event):
    """
    Register a reference photo for a student.
    Body: { "studentId": "STU001", "imageBase64": "data:image/jpeg;base64,..." }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        student_id = body.get("studentId", "")
        image_data = body.get("imageBase64", "")

        if not student_id or not image_data:
            return _response(400, {"error": "Missing studentId or imageBase64"})

        # Decode base64 image
        if "," in image_data:
            image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)

        # Detect face with Rekognition to verify face is present
        try:
            rek_res = rekognition.detect_faces(
                Image={"Bytes": image_bytes},
                Attributes=["DEFAULT"]
            )
            face_details = rek_res.get("FaceDetails", [])
            if len(face_details) == 0:
                return _response(400, {"error": "No clear face detected in reference photo. Please face the camera directly."})
        except Exception as rek_err:
            print(f"Rekognition detect_faces warning: {rek_err}")

        # Upload image to S3 bucket
        object_key = f"reference_faces/{student_id}.jpg"
        s3.put_object(
            Bucket=PHOTOS_BUCKET,
            Key=object_key,
            Body=image_bytes,
            ContentType="image/jpeg",
        )

        # Update DynamoDB student record with photo URL & registration status
        photo_url = f"https://{PHOTOS_BUCKET}.s3.amazonaws.com/{object_key}"
        try:
            table.update_item(
                Key={"studentId": student_id},
                UpdateExpression="SET faceRegistered = :reg, facePhotoUrl = :url, faceRegisteredAt = :now",
                ExpressionAttributeValues={
                    ":reg": True,
                    ":url": photo_url,
                    ":now": datetime.utcnow().isoformat()
                }
            )
        except Exception as db_err:
            print(f"DynamoDB update error: {db_err}")

        return _response(200, {
            "message": "Face profile successfully registered!",
            "studentId": student_id,
            "faceRegistered": True,
            "photoUrl": photo_url,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def verify_face(event):
    """
    Verify live captured photo against student's registered reference photo.
    Body: { "studentId": "STU001", "imageBase64": "data:image/jpeg;base64,..." }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        student_id = body.get("studentId", "")
        image_data = body.get("imageBase64", "")

        if not student_id or not image_data:
            return _response(400, {"error": "Missing studentId or imageBase64"})

        # Decode base64 image
        if "," in image_data:
            image_data = image_data.split(",")[1]
        target_bytes = base64.b64decode(image_data)

        # First verify that a face is detected in the live camera capture
        try:
            live_detect = rekognition.detect_faces(
                Image={"Bytes": target_bytes},
                Attributes=["DEFAULT"]
            )
            if len(live_detect.get("FaceDetails", [])) == 0:
                return _response(200, {
                    "verified": False,
                    "confidence": 0.0,
                    "message": "No face detected in camera snapshot. Please look directly at the camera."
                })
        except Exception as det_err:
            print(f"Live detect warning: {det_err}")

        # Retrieve registered reference image from S3
        reference_key = f"reference_faces/{student_id}.jpg"
        try:
            s3_obj = s3.get_object(Bucket=PHOTOS_BUCKET, Key=reference_key)
            source_bytes = s3_obj["Body"].read()
        except Exception:
            return _response(200, {
                "verified": False,
                "isFirstTime": True,
                "confidence": 0.0,
                "message": f"No registered reference photo found for student {student_id}. Please register reference face first."
            })

        # Compare face using AWS Rekognition with 85% similarity threshold
        try:
            comp_res = rekognition.compare_faces(
                SourceImage={"Bytes": source_bytes},
                TargetImage={"Bytes": target_bytes},
                SimilarityThreshold=85.0
            )
            face_matches = comp_res.get("FaceMatches", [])
            if face_matches and face_matches[0]["Similarity"] >= 85.0:
                similarity = round(face_matches[0]["Similarity"], 1)
                return _response(200, {
                    "verified": True,
                    "isFirstTime": False,
                    "confidence": similarity,
                    "message": f"Face verified with {similarity}% confidence!"
                })
            else:
                return _response(200, {
                    "verified": False,
                    "isFirstTime": False,
                    "confidence": 0.0,
                    "message": "Face match failed! Live camera face does not match student reference photo."
                })
        except Exception as rek_err:
            print(f"Rekognition compare_faces error: {rek_err}")
            return _response(200, {
                "verified": False,
                "isFirstTime": False,
                "confidence": 0.0,
                "message": f"Facial comparison error: {str(rek_err)}"
            })
    except Exception as e:
        return _response(500, {"error": str(e)})


def verify_teacher_face(event):
    """
    Verify live captured photo against teacher's registered reference photo via AWS Rekognition.
    Body: { "imageBase64": "data:image/jpeg;base64,..." }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        image_data = body.get("imageBase64", "")
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"

        if not image_data:
            return _response(400, {"error": "Missing imageBase64"})

        if "," in image_data:
            image_data = image_data.split(",")[1]
        target_bytes = base64.b64decode(image_data)

        # Detect face in live image
        try:
            live_detect = rekognition.detect_faces(
                Image={"Bytes": target_bytes},
                Attributes=["DEFAULT"]
            )
            if len(live_detect.get("FaceDetails", [])) == 0:
                return _response(200, {
                    "verified": False,
                    "confidence": 0.0,
                    "message": "No face detected in camera view. Please face the camera directly."
                })
        except Exception as det_err:
            print(f"Teacher live detect warning: {det_err}")

        # Retrieve registered teacher reference image from S3
        reference_key = f"reference_faces/teacher_{teacher_id}.jpg"
        source_bytes = None
        try:
            s3_obj = s3.get_object(Bucket=PHOTOS_BUCKET, Key=reference_key)
            source_bytes = s3_obj["Body"].read()
        except Exception as s3_err:
            print(f"Teacher reference photo lookup: {s3_err}")
            # If no master teacher photo is registered yet, register this first one as master face
            try:
                s3.put_object(
                    Bucket=PHOTOS_BUCKET,
                    Key=reference_key,
                    Body=target_bytes,
                    ContentType="image/jpeg",
                )
                photo_url = f"https://{PHOTOS_BUCKET}.s3.amazonaws.com/{reference_key}"
                return _response(200, {
                    "verified": True,
                    "isFirstTime": True,
                    "confidence": 100.0,
                    "message": "✨ Master Teacher Face registered successfully! Subsequent sessions will strictly verify against this face.",
                    "photoUrl": photo_url
                })
            except Exception as put_err:
                print(f"S3 PutObject error: {put_err}")
                return _response(500, {"error": str(put_err)})

        # Compare face using AWS Rekognition with 85% threshold
        try:
            comp_res = rekognition.compare_faces(
                SourceImage={"Bytes": source_bytes},
                TargetImage={"Bytes": target_bytes},
                SimilarityThreshold=85.0
            )
            face_matches = comp_res.get("FaceMatches", [])
            if face_matches and face_matches[0]["Similarity"] >= 85.0:
                similarity = round(face_matches[0]["Similarity"], 1)
                return _response(200, {
                    "verified": True,
                    "isFirstTime": False,
                    "confidence": similarity,
                    "message": f"✅ Teacher Face Verified ({similarity}% match)!"
                })
            else:
                return _response(200, {
                    "verified": False,
                    "isFirstTime": False,
                    "confidence": 0.0,
                    "message": "❌ Teacher Verification Failed: Face does not match registered teacher."
                })
        except Exception as rek_err:
            print(f"Rekognition teacher verify error: {rek_err}")
            return _response(200, {
                "verified": False,
                "isFirstTime": False,
                "confidence": 0.0,
                "message": f"❌ Teacher Verification check failed: {str(rek_err)}"
            })
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_face_status(student_id):
    """Check if student has a registered reference photo."""
    try:
        response = table.get_item(Key={"studentId": student_id})
        item = response.get("Item", {})
        is_registered = item.get("faceRegistered", False)
        photo_url = item.get("facePhotoUrl", "")
        return _response(200, {
            "studentId": student_id,
            "faceRegistered": is_registered,
            "photoUrl": photo_url,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body, default=str),
    }
