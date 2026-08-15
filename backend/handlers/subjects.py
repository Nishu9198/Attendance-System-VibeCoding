import json
import os
from datetime import datetime
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("SUBJECTS_TABLE", "attendance-system-subjects"))

SAMPLE_SUBJECTS = [
    {
        "teacherId": "demo-teacher-001",
        "subjectCode": "CS501",
        "subjectName": "Cloud Computing & AWS",
        "className": "5th Year",
        "section": "A",
        "building": "Main Block",
        "roomNumber": "Room 101",
        "threshold": 75,
        "editWindowDays": 10,
        "enrolledStudents": ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"],
        "createdAt": "2026-08-15T00:50:00Z",
    },
    {
        "teacherId": "demo-teacher-001",
        "subjectCode": "CS502",
        "subjectName": "Deep Learning & AI",
        "className": "5th Year",
        "section": "A",
        "building": "Lab Block",
        "roomNumber": "Lab 3",
        "threshold": 75,
        "editWindowDays": 10,
        "enrolledStudents": ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"],
        "createdAt": "2026-08-15T00:50:00Z",
    },
    {
        "teacherId": "demo-teacher-001",
        "subjectCode": "CS503",
        "subjectName": "Distributed Systems",
        "className": "5th Year",
        "section": "B",
        "building": "Tech Tower",
        "roomNumber": "Hall B",
        "threshold": 80,
        "editWindowDays": 10,
        "enrolledStudents": ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"],
        "createdAt": "2026-08-15T00:50:00Z",
    },
]


def handle(event, method, path):
    """Subject management with attendance threshold settings."""
    if method == "GET" and (path == "/subjects" or path == "/subjects/"):
        return list_subjects(event)
    elif method == "POST" and (path == "/subjects" or path == "/subjects/"):
        return create_subject(event)
    elif method == "PUT" and path.startswith("/subjects/"):
        subject_code = path.split("/")[-1]
        return update_subject(event, subject_code)
    elif method == "DELETE" and path.startswith("/subjects/"):
        subject_code = path.split("/")[-1]
        return delete_subject(event, subject_code)
    else:
        return _response(405, {"error": "Method not allowed"})


def get_teacher_id(event):
    user = event.get("_user", {}) or {}
    return user.get("sub") or user.get("email") or "demo-teacher-001"


def list_subjects(event):
    """Get all subjects. Auto-seeds defaults if empty."""
    try:
        result = table.scan()
        subjects = result.get("Items", [])
        if not subjects:
            for s in SAMPLE_SUBJECTS:
                try:
                    table.put_item(Item=s)
                except Exception as seed_err:
                    print(f"Error seeding subject {s['subjectCode']}: {seed_err}")
            subjects = SAMPLE_SUBJECTS

        return _response(200, {"subjects": subjects})
    except Exception as e:
        return _response(500, {"error": str(e)})


def create_subject(event):
    """Create a new subject with threshold and student list."""
    try:
        body = json.loads(event.get("body", "{}"))
        teacher_id = get_teacher_id(event)

        code = str(body.get("subjectCode", "")).strip()
        name = str(body.get("subjectName", "")).strip()

        if not code or not name:
            return _response(400, {"error": "Subject Code and Subject Name are required."})

        # Default student enrollment if empty
        enrolled = body.get("enrolledStudents", [])
        if not enrolled or len(enrolled) == 0:
            enrolled = ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"]

        item = {
            "teacherId": teacher_id,
            "subjectCode": code,
            "subjectName": name,
            "className": str(body.get("className") or "4th year"),
            "section": str(body.get("section") or "Section A"),
            "building": str(body.get("building") or "UB"),
            "roomNumber": str(body.get("roomNumber") or "1207"),
            "threshold": int(body.get("threshold") or 75),
            "editWindowDays": int(body.get("editWindowDays") or 10),
            "enrolledStudents": enrolled,
            "totalClasses": 0,
            "createdAt": datetime.utcnow().isoformat(),
        }

        table.put_item(Item=item)
        return _response(201, {"message": "Subject created successfully", "subject": item})
    except Exception as e:
        print(f"Error creating subject: {e}")
        return _response(500, {"error": str(e)})


def update_subject(event, subject_code):
    """Update subject settings (threshold, enrolled students, edit window)."""
    try:
        body = json.loads(event.get("body", "{}"))
        
        # Find item in DynamoDB
        scan_res = table.scan()
        items = [i for i in scan_res.get("Items", []) if i.get("subjectCode") == subject_code]
        teacher_id = items[0].get("teacherId") if items else get_teacher_id(event)

        update_parts = []
        expr_values = {}
        expr_names = {}

        for key, value in body.items():
            if key not in ("teacherId", "subjectCode"):
                safe_key = f"#{key}"
                safe_val = f":{key}"
                update_parts.append(f"{safe_key} = {safe_val}")
                expr_names[safe_key] = key
                expr_values[safe_val] = value

        if not update_parts:
            return _response(400, {"error": "No fields to update"})

        update_parts.append("#updatedAt = :updatedAt")
        expr_names["#updatedAt"] = "updatedAt"
        expr_values[":updatedAt"] = datetime.utcnow().isoformat()

        result = table.update_item(
            Key={"teacherId": teacher_id, "subjectCode": subject_code},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _response(200, {"message": "Subject updated", "subject": result["Attributes"]})
    except Exception as e:
        return _response(500, {"error": str(e)})


def delete_subject(event, subject_code):
    """Delete a subject."""
    try:
        scan_res = table.scan()
        items = [i for i in scan_res.get("Items", []) if i.get("subjectCode") == subject_code]
        for item in items:
            t_id = item.get("teacherId")
            table.delete_item(Key={"teacherId": t_id, "subjectCode": subject_code})
        return _response(200, {"message": "Subject deleted"})
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
