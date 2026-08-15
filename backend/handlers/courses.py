import json
import os
import uuid
from datetime import datetime

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("COURSES_TABLE", "attendance-system-courses"))


def handle(event, method, path):
    """Route course requests."""
    if method == "GET" and path == "/courses":
        return list_courses(event)
    elif method == "POST" and path == "/courses":
        return create_course(event)
    elif method == "GET" and path.startswith("/courses/"):
        course_id = path.split("/")[-1]
        return get_course(course_id)
    elif method == "PUT" and path.startswith("/courses/"):
        course_id = path.split("/")[-1]
        return update_course(event, course_id)
    elif method == "DELETE" and path.startswith("/courses/"):
        course_id = path.split("/")[-1]
        return delete_course(course_id)
    else:
        return _response(405, {"error": "Method not allowed"})


def list_courses(event):
    """Get all courses (optionally filter by teacher)."""
    try:
        user_email = event.get("_user", {}).get("email", "")
        result = table.scan()
        courses = result.get("Items", [])
        return _response(200, {"courses": courses, "count": len(courses)})
    except Exception as e:
        return _response(500, {"error": str(e)})


def create_course(event):
    """Create a new course."""
    try:
        body = json.loads(event.get("body", "{}"))
        course_id = str(uuid.uuid4())[:8].upper()

        course = {
            "courseId": course_id,
            "courseName": body.get("courseName", ""),
            "courseCode": body.get("courseCode", ""),
            "department": body.get("department", ""),
            "semester": body.get("semester", ""),
            "section": body.get("section", ""),
            "teacherId": event.get("_user", {}).get("sub", ""),
            "teacherName": body.get("teacherName", ""),
            "teacherEmail": event.get("_user", {}).get("email", ""),
            "enrolledStudents": body.get("enrolledStudents", []),
            "schedule": body.get("schedule", ""),
            "createdAt": datetime.utcnow().isoformat(),
        }

        table.put_item(Item=course)
        return _response(201, {"message": "Course created", "course": course})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_course(course_id):
    """Get a single course."""
    try:
        result = table.get_item(Key={"courseId": course_id})
        course = result.get("Item")
        if not course:
            return _response(404, {"error": "Course not found"})
        return _response(200, {"course": course})
    except Exception as e:
        return _response(500, {"error": str(e)})


def update_course(event, course_id):
    """Update a course."""
    try:
        body = json.loads(event.get("body", "{}"))

        update_expr_parts = []
        expr_values = {}
        expr_names = {}

        for key, value in body.items():
            if key != "courseId":
                safe_key = f"#{key}"
                safe_val = f":{key}"
                update_expr_parts.append(f"{safe_key} = {safe_val}")
                expr_names[safe_key] = key
                expr_values[safe_val] = value

        if not update_expr_parts:
            return _response(400, {"error": "No fields to update"})

        update_expr = "SET " + ", ".join(update_expr_parts)
        update_expr += ", #updatedAt = :updatedAt"
        expr_names["#updatedAt"] = "updatedAt"
        expr_values[":updatedAt"] = datetime.utcnow().isoformat()

        result = table.update_item(
            Key={"courseId": course_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _response(200, {"message": "Course updated", "course": result["Attributes"]})
    except Exception as e:
        return _response(500, {"error": str(e)})


def delete_course(course_id):
    """Delete a course."""
    try:
        table.delete_item(Key={"courseId": course_id})
        return _response(200, {"message": "Course deleted"})
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
