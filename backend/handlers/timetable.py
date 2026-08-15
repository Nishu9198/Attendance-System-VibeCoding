import json
import os
from datetime import datetime
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TIMETABLE_TABLE", "attendance-system-timetable"))


def handle(event, method, path):
    """Timetable CRUD - manages Day Order × Period grid."""
    if method == "GET" and path == "/timetable":
        return get_timetable(event)
    elif method == "POST" and path == "/timetable":
        return set_slot(event)
    elif method == "DELETE" and path.startswith("/timetable/"):
        parts = path.split("/")
        slot_key = f"{parts[2]}#{parts[3]}" if len(parts) >= 4 else ""
        return delete_slot(event, slot_key)
    else:
        return _response(405, {"error": "Method not allowed"})


subjects_table = dynamodb.Table(os.environ.get("SUBJECTS_TABLE", "attendance-system-subjects"))
students_table = dynamodb.Table(os.environ.get("STUDENTS_TABLE", "attendance-system-students"))


def get_user_info(event):
    user = event.get("_user", {}) or {}
    role = user.get("role") or ""
    email = (user.get("email") or "").lower()
    sub = user.get("sub") or email or "demo-user-001"
    
    # Determine role
    if role == "student" or "student" in email or "stu" in sub.lower():
        actual_role = "student"
    else:
        actual_role = "teacher"
        
    user_key = f"{actual_role}_{sub}"
    return actual_role, sub, user_key


def get_timetable(event):
    """Get timetable matching teacher schedule for enrolled subjects."""
    try:
        role, sub, user_key = get_user_info(event)
        
        if role == "teacher":
            # Teachers see all scheduled teaching slots
            result = table.scan()
            all_slots = result.get("Items", [])
            # Filter slots for teacher or global teacher schedule
            slots = [s for s in all_slots if not str(s.get("teacherId", "")).startswith("student_")]
        else:
            # Student view: Find student's enrolled subjects
            student_id = sub if sub.startswith("STU") else "STU001"
            
            # Get student's rollNumber if available
            try:
                stud_rec = students_table.get_item(Key={"studentId": student_id}).get("Item", {})
                roll_num = stud_rec.get("rollNumber", "")
            except Exception:
                roll_num = ""

            # Scan subjects to find which subjects this student is enrolled in
            subj_res = subjects_table.scan()
            all_subjects = subj_res.get("Items", [])
            
            enrolled_codes = set()
            for s in all_subjects:
                enrolled_list = s.get("enrolledStudents", [])
                if not enrolled_list or student_id in enrolled_list or (roll_num and roll_num in enrolled_list):
                    enrolled_codes.add(s.get("subjectCode"))

            # Scan master timetable and filter only for the student's enrolled subjects
            result = table.scan()
            all_slots = result.get("Items", [])
            
            # Include teacher slots for enrolled subjects
            slots = [
                s for s in all_slots 
                if s.get("subjectCode") in enrolled_codes and not str(s.get("teacherId", "")).startswith("student_")
            ]
            
            # If no teacher slots exist yet, fallback to default student schedule
            if not slots:
                slots = [
                    {"slotKey": "1#1", "subjectCode": "CS501", "subjectName": "Cloud Computing & AWS", "className": "5th Year", "section": "A", "roomNumber": "Room 101"},
                    {"slotKey": "1#3", "subjectCode": "CS502", "subjectName": "Deep Learning & AI", "className": "5th Year", "section": "A", "roomNumber": "Lab 3"},
                    {"slotKey": "2#2", "subjectCode": "CS503", "subjectName": "Distributed Systems", "className": "5th Year", "section": "B", "roomNumber": "Hall B"},
                    {"slotKey": "3#1", "subjectCode": "CS501", "subjectName": "Cloud Computing & AWS", "className": "5th Year", "section": "A", "roomNumber": "Room 101"},
                    {"slotKey": "4#4", "subjectCode": "CS502", "subjectName": "Deep Learning & AI", "className": "5th Year", "section": "A", "roomNumber": "Lab 3"},
                    {"slotKey": "5#2", "subjectCode": "CS503", "subjectName": "Distributed Systems", "className": "5th Year", "section": "B", "roomNumber": "Hall B"},
                ]

        # Organize into grid structure
        grid = {}
        for slot in slots:
            slot_key = slot.get("slotKey", "")
            if "#" in slot_key:
                day_order, period = slot_key.split("#")
                if day_order not in grid:
                    grid[day_order] = {}
                grid[day_order][period] = {
                    "subjectCode": slot.get("subjectCode", ""),
                    "subjectName": slot.get("subjectName", ""),
                    "className": slot.get("className", ""),
                    "section": slot.get("section", ""),
                    "roomNumber": slot.get("roomNumber", ""),
                    "startTime": slot.get("startTime", ""),
                    "endTime": slot.get("endTime", ""),
                }

        return _response(200, {"timetable": grid, "slots": slots, "role": role})
    except Exception as e:
        return _response(500, {"error": str(e)})


def set_slot(event):
    """Set or update a timetable slot for the logged-in user."""
    try:
        body = json.loads(event.get("body", "{}"))
        role, sub, user_key = get_user_info(event)
        day_order = str(body.get("dayOrder", ""))
        period = str(body.get("period", ""))
        slot_key = f"{day_order}#{period}"

        item = {
            "teacherId": user_key,
            "slotKey": slot_key,
            "subjectCode": body.get("subjectCode", ""),
            "subjectName": body.get("subjectName", ""),
            "className": body.get("className", ""),
            "section": body.get("section", ""),
            "roomNumber": body.get("roomNumber", ""),
            "startTime": body.get("startTime", ""),
            "endTime": body.get("endTime", ""),
            "updatedAt": datetime.utcnow().isoformat(),
        }

        table.put_item(Item=item)
        return _response(200, {"message": "Timetable slot updated", "slot": item})
    except Exception as e:
        return _response(500, {"error": str(e)})


def delete_slot(event, slot_key):
    """Remove a subject from a timetable slot for the logged-in user."""
    try:
        role, sub, user_key = get_user_info(event)
        table.delete_item(Key={"teacherId": user_key, "slotKey": slot_key})
        return _response(200, {"message": "Slot cleared"})
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
