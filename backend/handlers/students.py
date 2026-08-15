import json
import os
import uuid
from datetime import datetime
import boto3

from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("STUDENTS_TABLE", "attendance-system-students"))
subjects_table = dynamodb.Table(os.environ.get("SUBJECTS_TABLE", "attendance-system-subjects"))
attendance_table = dynamodb.Table(os.environ.get("ATTENDANCE_TABLE", "attendance-system-attendance"))
timetable_table = dynamodb.Table(os.environ.get("TIMETABLE_TABLE", "attendance-system-timetable"))

SAMPLE_STUDENTS = [
    {"studentId": "STU001", "name": "Aarav Sharma", "rollNumber": "21CS001", "email": "aarav@university.edu", "section": "A", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU002", "name": "Priya Patel", "rollNumber": "21CS002", "email": "priya@university.edu", "section": "A", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU003", "name": "Rahul Kumar", "rollNumber": "21CS003", "email": "rahul@university.edu", "section": "A", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU004", "name": "Sneha Gupta", "rollNumber": "21CS004", "email": "sneha@university.edu", "section": "B", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU005", "name": "Vikram Singh", "rollNumber": "21CS005", "email": "vikram@university.edu", "section": "B", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU006", "name": "Ananya Reddy", "rollNumber": "21CS006", "email": "ananya@university.edu", "section": "A", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU007", "name": "Karthik Nair", "rollNumber": "21CS007", "email": "karthik@university.edu", "section": "B", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
    {"studentId": "STU008", "name": "Divya Menon", "rollNumber": "21CS008", "email": "divya@university.edu", "section": "A", "department": "Computer Science", "semester": "5th Year", "faceRegistered": False},
]


def handle(event, method, path):
    """Route student requests."""
    if method == "GET" and (path == "/students" or path == "/students/"):
        return list_students(event)
    elif method == "GET" and path.startswith("/student/dashboard"):
        return get_student_dashboard(event)
    elif method == "POST" and path.startswith("/student/enrolled-subjects"):
        return update_student_enrolled_subjects(event)
    elif method == "POST" and path == "/student/trigger-sns-alert":
        from handlers.notifications import trigger_student_sns_alert
        return trigger_student_sns_alert(event)
    elif method == "POST" and (path == "/students" or path == "/students/"):
        return create_student(event)
    elif method == "GET" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return get_student(student_id)
    elif method == "PUT" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return update_student(event, student_id)
    elif method == "DELETE" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return delete_student(student_id)
    else:
        return _response(405, {"error": "Method not allowed"})


def list_students(event):
    """Get all students. Auto-seeds default students if empty."""
    try:
        result = table.scan()
        students = result.get("Items", [])
        if not students:
            for s in SAMPLE_STUDENTS:
                try:
                    table.put_item(Item=s)
                except Exception as seed_err:
                    print(f"Error seeding student {s['studentId']}: {seed_err}")
            students = SAMPLE_STUDENTS
        return _response(200, {"students": students, "count": len(students)})
    except Exception as e:
        return _response(500, {"error": str(e)})


def create_student(event):
    """Create a new student."""
    try:
        body = json.loads(event.get("body", "{}"))
        student_id = body.get("studentId") or f"STU{str(uuid.uuid4())[:4].upper()}"

        student = {
            "studentId": student_id,
            "name": body.get("name", ""),
            "email": body.get("email", ""),
            "rollNumber": body.get("rollNumber", ""),
            "section": body.get("section", "A"),
            "department": body.get("department", "Computer Science"),
            "semester": body.get("semester", "5th Year"),
            "phone": body.get("phone", ""),
            "photoUrl": body.get("photoUrl", ""),
            "faceRegistered": False,
            "createdAt": datetime.utcnow().isoformat(),
            "createdBy": event.get("_user", {}).get("email", "teacher@demo.com"),
        }

        table.put_item(Item=student)
        return _response(201, {"message": "Student created", "student": student})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_student(student_id):
    """Get a single student by ID."""
    try:
        result = table.get_item(Key={"studentId": student_id})
        student = result.get("Item")
        if not student:
            return _response(404, {"error": "Student not found"})
        return _response(200, {"student": student})
    except Exception as e:
        return _response(500, {"error": str(e)})


def update_student(event, student_id):
    """Update a student."""
    try:
        body = json.loads(event.get("body", "{}"))

        update_expr_parts = []
        expr_values = {}
        expr_names = {}

        for key, value in body.items():
            if key != "studentId":
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
            Key={"studentId": student_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _response(200, {"message": "Student updated", "student": result["Attributes"]})
    except Exception as e:
        return _response(500, {"error": str(e)})


def delete_student(student_id):
    """Delete a student."""
    try:
        table.delete_item(Key={"studentId": student_id})
        return _response(200, {"message": "Student deleted"})
    except Exception as e:
        return _response(500, {"error": str(e)})


def update_student_enrolled_subjects(event):
    """Save student custom enrolled subjects and faculty choices."""
    try:
        body = json.loads(event.get("body", "{}"))
        user = event.get("_user", {}) or {}
        student_id = user.get("sub") or "STU001"
        if student_id.startswith("mock-") or student_id.startswith("demo-"):
            student_id = "STU001"

        enrolled_subjects = body.get("enrolledSubjects", [])
        faculty_mapping = body.get("facultyMapping", {})

        table.update_item(
            Key={"studentId": student_id},
            UpdateExpression="SET #es = :es, #fm = :fm, #ua = :ua",
            ExpressionAttributeNames={
                "#es": "enrolledSubjects",
                "#fm": "facultyMapping",
                "#ua": "updatedAt",
            },
            ExpressionAttributeValues={
                ":es": enrolled_subjects,
                ":fm": faculty_mapping,
                ":ua": datetime.utcnow().isoformat(),
            },
        )
        return _response(200, {"message": "Enrolled subjects updated", "enrolledSubjects": enrolled_subjects, "facultyMapping": faculty_mapping})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_student_dashboard(event):
    """Get complete dashboard overview for student."""
    try:
        user = event.get("_user", {}) or {}
        student_id = user.get("sub")
        if not student_id or student_id.startswith("mock-") or student_id.startswith("demo-"):
            student_id = "STU001"

        # Fetch student profile
        s_res = table.get_item(Key={"studentId": student_id})
        student = s_res.get("Item")
        if not student:
            student = SAMPLE_STUDENTS[0]

        # Check if student selected custom enrolled subjects
        chosen_subjects = student.get("enrolledSubjects", [])
        faculty_mapping = student.get("facultyMapping", {})

        # Fetch subjects where student is enrolled
        subj_res = subjects_table.scan()
        all_subjects = subj_res.get("Items", [])
        
        if chosen_subjects and len(chosen_subjects) > 0:
            student_subjects = [s for s in all_subjects if s.get("subjectCode") in chosen_subjects]
        else:
            student_subjects = [
                s for s in all_subjects 
                if (student_id in s.get("enrolledStudents", []) or not s.get("enrolledStudents"))
            ]

        # Fetch attendance records for this student
        att_res = attendance_table.query(
            IndexName="StudentIndex",
            KeyConditionExpression=Key("studentId").eq(student_id),
        )
        records = att_res.get("Items", [])

        total_attended = 0
        total_classes_count = 0
        subject_stats = []

        for subj in student_subjects:
            code = subj.get("subjectCode", "")
            cname = subj.get("className", "")
            sc = f"{code}#{cname}"
            threshold = int(subj.get("threshold", 75))
            
            # Faculty override if student selected a specific faculty
            faculty_info = faculty_mapping.get(code, {})
            custom_teacher = faculty_info.get("teacherName") or subj.get("teacherName") or "Faculty"

            subj_recs = [r for r in records if r.get("subjectClass") == sc]
            present = len([r for r in subj_recs if r.get("status") == "present"])
            late = len([r for r in subj_recs if r.get("status") == "late"])
            absent = len([r for r in subj_recs if r.get("status") == "absent"])
            total = len(subj_recs)
            attended = present + late

            total_attended += attended
            total_classes_count += total

            rate = round((attended / total * 100) if total > 0 else 100.0, 1)

            if threshold > 0:
                margin = max(0, int((attended * 100 / threshold) - total))
            else:
                margin = 999

            needed = 0
            if rate < threshold and threshold < 100:
                needed = max(0, int((threshold * total - attended * 100) / (100 - threshold)) + 1)

            if rate >= threshold + 10:
                status = "safe"
            elif rate >= threshold:
                status = "ok"
            elif rate >= threshold - 10:
                status = "risk"
            else:
                status = "critical"

            subject_stats.append({
                "subjectCode": code,
                "subjectName": subj.get("subjectName", ""),
                "className": cname,
                "teacherName": custom_teacher,
                "building": subj.get("building", "UB"),
                "roomNumber": subj.get("roomNumber", "1207"),
                "present": present,
                "absent": absent,
                "late": late,
                "total": total,
                "rate": rate,
                "threshold": threshold,
                "margin": margin,
                "classesNeeded": needed,
                "status": status,
                "history": sorted(subj_recs, key=lambda x: x.get("date", ""), reverse=True),
            })

        overall_rate = round((total_attended / total_classes_count * 100) if total_classes_count > 0 else 100.0, 1)
        shortage_count = len([s for s in subject_stats if s["rate"] < s["threshold"]])

        # Timetable matching teacher schedule for enrolled subjects
        enrolled_codes = set(s.get("subjectCode") for s in student_subjects)
        tt_res = timetable_table.scan()
        tt_items = tt_res.get("Items", [])
        tt_map = {}
        for item in tt_items:
            if item.get("subjectCode") in enrolled_codes and not str(item.get("teacherId", "")).startswith("student_"):
                slot_key = item.get("slotKey", "")
                if "#" in slot_key:
                    day, period = slot_key.split("#")
                    if day not in tt_map:
                        tt_map[day] = {}
                    tt_map[day][period] = item

        return _response(200, {
            "student": student,
            "overallRate": overall_rate,
            "totalClasses": total_classes_count,
            "totalAttended": total_attended,
            "shortageSubjectsCount": shortage_count,
            "subjectStats": subject_stats,
            "timetable": tt_map,
        })
    except Exception as e:
        print(f"Error getting student dashboard: {e}")
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
