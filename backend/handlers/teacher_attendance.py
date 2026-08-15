import json
import os
from datetime import datetime
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TEACHER_ATTENDANCE_TABLE", "attendance-system-teacher-attendance"))


def handle(event, method, path):
    """Teacher's own daily attendance check-in."""
    if method == "POST" and path == "/teacher-attendance":
        return mark_attendance(event)
    elif method == "GET" and path == "/teacher-attendance":
        return get_attendance(event)
    else:
        return _response(405, {"error": "Method not allowed"})


def mark_attendance(event):
    """Teacher marks their own attendance for today."""
    try:
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"
        today = datetime.utcnow().strftime("%Y-%m-%d")

        item = {
            "teacherId": teacher_id,
            "date": today,
            "status": "present",
            "markedAt": datetime.utcnow().isoformat(),
        }

        table.put_item(Item=item)
        return _response(200, {"message": "Attendance marked", "record": item})
    except Exception as e:
        print(f"Error marking teacher attendance: {e}")
        return _response(500, {"error": str(e)})


def get_attendance(event):
    """Get teacher's own attendance history."""
    try:
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"
        result = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("teacherId").eq(teacher_id),
            ScanIndexForward=False,
            Limit=30,
        )
        records = result.get("Items", [])
        today = datetime.utcnow().strftime("%Y-%m-%d")
        marked_today = any(r.get("date") == today for r in records)

        return _response(200, {
            "records": records,
            "markedToday": marked_today,
            "totalDays": len(records),
        })
    except Exception as e:
        print(f"Error getting teacher attendance: {e}")
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
