import json
import os


def handler(event, context):
    """Main Lambda router for AttendCloud API."""
    http_method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod") or "GET"
    path = event.get("rawPath", "")

    # Extract user info from JWT
    claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
    event["_user"] = {
        "email": claims.get("email", ""),
        "sub": claims.get("sub", ""),
        "name": claims.get("name", ""),
        "role": claims.get("custom:role", ""),
    }

    if http_method == "OPTIONS":
        return _response(200, {"status": "ok"})

    try:
        if path.startswith("/timetable"):
            from handlers.timetable import handle
            return handle(event, http_method, path)

        elif path.startswith("/subjects"):
            from handlers.subjects import handle
            return handle(event, http_method, path)

        elif path.startswith("/attendance"):
            from handlers.attendance import handle
            return handle(event, http_method, path)

        elif path.startswith("/teacher-attendance"):
            from handlers.teacher_attendance import handle
            return handle(event, http_method, path)

        elif path.startswith("/students"):
            from handlers.students import handle
            return handle(event, http_method, path)

        elif path.startswith("/student"):
            from handlers.students import handle
            return handle(event, http_method, path)

        elif path.startswith("/notifications"):
            from handlers.notifications import handle
            return handle(event, http_method, path)

        elif path.startswith("/reports"):
            from handlers.reports import handle
            return handle(event, http_method, path)

        elif path.startswith("/faces"):
            from handlers.face_recognition import handle
            return handle(event, http_method, path)

        else:
            return _response(404, {"error": "Route not found", "path": path})

    except Exception as e:
        print(f"Error: {str(e)}")
        return _response(500, {"error": "Internal server error", "message": str(e)})


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
