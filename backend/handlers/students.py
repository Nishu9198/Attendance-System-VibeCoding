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


def handle(event, method, path):
    """Route student requests for Teacher Roster management."""
    if method == "GET" and (path == "/students" or path == "/students/"):
        return list_students(event)
    elif method == "POST" and (path == "/students" or path == "/students/"):
        return create_student(event)
    elif method == "GET" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return get_student(student_id)
    elif method == "GET" and path.startswith("/student/dashboard"):
        return get_student_dashboard(event)
    elif method == "POST" and path.startswith("/student/enrolled-subjects"):
        return update_student_enrolled_subjects(event)
    elif method == "POST" and path == "/student/trigger-sns-alert":
        from handlers.notifications import trigger_student_sns_alert
        return trigger_student_sns_alert(event)
    elif method == "PUT" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return update_student(event, student_id)
    elif method == "DELETE" and path.startswith("/students/"):
        student_id = path.split("/")[-1]
        return delete_student(student_id)
    else:
        return _response(405, {"error": "Method not allowed"})


def list_students(event):
    """Get all students from database."""
    try:
        result = table.scan()
        students = result.get("Items", [])
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
    """Save student custom enrolled subjects, profile details, and faculty choices."""
    try:
        body = json.loads(event.get("body", "{}"))
        user = event.get("_user", {}) or {}
        user_email = (user.get("email") or body.get("email") or "").strip().lower()
        student_id = body.get("studentId") or user.get("sub") or ""

        # Try to find student by email or ID
        student = None
        if student_id and not student_id.startswith("mock-") and not student_id.startswith("demo-"):
            res = table.get_item(Key={"studentId": student_id})
            student = res.get("Item")

        if not student and user_email:
            scan_res = table.scan()
            for item in scan_res.get("Items", []):
                if (item.get("email") or "").strip().lower() == user_email:
                    student = item
                    student_id = item.get("studentId")
                    break

        if not student_id or student_id.startswith("mock-") or student_id.startswith("demo-"):
            student_id = f"STU{str(uuid.uuid4())[:4].upper()}"

        enrolled_subjects = body.get("enrolledSubjects", [])
        faculty_mapping = body.get("facultyMapping", {})
        name = body.get("name") or (student.get("name") if student else "") or (user_email.split("@")[0].title() if user_email else "Student")
        roll_number = body.get("rollNumber") or (student.get("rollNumber") if student else "") or f"21CS{str(uuid.uuid4())[:3].upper()}"
        section = body.get("section") or (student.get("section") if student else "A")
        department = body.get("department") or (student.get("department") if student else "Computer Science")
        semester = body.get("semester") or (student.get("semester") if student else "5th Year")

        updated_student = {
            **(student or {}),
            "studentId": student_id,
            "name": name,
            "email": user_email or (student.get("email") if student else "student@university.edu"),
            "rollNumber": roll_number,
            "section": section,
            "department": department,
            "semester": semester,
            "enrolledSubjects": enrolled_subjects,
            "facultyMapping": faculty_mapping,
            "updatedAt": datetime.utcnow().isoformat(),
        }

        table.put_item(Item=updated_student)

        # Sync enrollment with subjects table so teacher rosters stay updated
        try:
            all_subj_res = subjects_table.scan()
            for subj in all_subj_res.get("Items", []):
                code = subj.get("subjectCode")
                current_enrolled = list(subj.get("enrolledStudents", []))
                should_be_enrolled = code in enrolled_subjects
                is_currently_enrolled = (student_id in current_enrolled or roll_number in current_enrolled)

                if should_be_enrolled and not is_currently_enrolled:
                    current_enrolled.append(student_id)
                    subjects_table.update_item(
                        Key={"subjectCode": code},
                        UpdateExpression="SET #es = :es",
                        ExpressionAttributeNames={"#es": "enrolledStudents"},
                        ExpressionAttributeValues={":es": current_enrolled},
                    )
                elif not should_be_enrolled and is_currently_enrolled:
                    new_enrolled = [s for s in current_enrolled if s != student_id and s != roll_number]
                    subjects_table.update_item(
                        Key={"subjectCode": code},
                        UpdateExpression="SET #es = :es",
                        ExpressionAttributeNames={"#es": "enrolledStudents"},
                        ExpressionAttributeValues={":es": new_enrolled},
                    )
        except Exception as sync_err:
            print(f"Error syncing subjects enrolledStudents: {sync_err}")

        return _response(200, {
            "message": "Enrolled subjects and profile updated",
            "student": updated_student,
            "enrolledSubjects": enrolled_subjects,
            "facultyMapping": faculty_mapping,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_student_dashboard(event):
    """Get complete dashboard overview for student with accurate profile and enrolled subjects."""
    try:
        user = event.get("_user", {}) or {}
        user_email = (user.get("email") or "").strip().lower()
        student_id = user.get("sub") or ""

        # Query param override if present
        params = event.get("queryStringParameters") or {}
        if params.get("email"):
            user_email = params.get("email").strip().lower()
        if params.get("studentId"):
            student_id = params.get("studentId")

        student = None
        # 1. Look up student by studentId
        if student_id and not student_id.startswith("mock-") and not student_id.startswith("demo-"):
            s_res = table.get_item(Key={"studentId": student_id})
            student = s_res.get("Item")

        # 2. Look up student by email if not found
        if not student and user_email:
            scan_res = table.scan()
            for item in scan_res.get("Items", []):
                if (item.get("email") or "").strip().lower() == user_email:
                    student = item
                    student_id = item.get("studentId")
                    break

        # 3. If still not found, create new personalized student record
        if not student:
            if user_email:
                default_name = user.get("name") or user_email.split("@")[0].replace(".", " ").title()
                new_id = f"STU{str(uuid.uuid4())[:4].upper()}"
                student = {
                    "studentId": new_id,
                    "name": default_name,
                    "email": user_email,
                    "rollNumber": f"21CS{str(uuid.uuid4())[:3].upper()}",
                    "section": "A",
                    "department": "Computer Science",
                    "semester": "5th Year",
                    "enrolledSubjects": [],
                    "facultyMapping": {},
                    "faceRegistered": False,
                }
                table.put_item(Item=student)
                student_id = new_id
            else:
                student = SAMPLE_STUDENTS[0]
                student_id = student.get("studentId", "STU001")

        # Get student's enrolled subjects
        chosen_subjects = student.get("enrolledSubjects", [])
        faculty_mapping = student.get("facultyMapping", {})

        # Fetch subjects from database
        subj_res = subjects_table.scan()
        all_subjects = subj_res.get("Items", [])

        # If student has explicit enrolledSubjects list, use it; otherwise check teacher-enrolled subjects
        if chosen_subjects and len(chosen_subjects) > 0:
            student_subjects = [s for s in all_subjects if s.get("subjectCode") in chosen_subjects]
        else:
            roll_num = student.get("rollNumber", "")
            student_subjects = [
                s for s in all_subjects
                if (student_id in s.get("enrolledStudents", []) or (roll_num and roll_num in s.get("enrolledStudents", [])))
            ]
            # Update student record with these teacher-assigned subjects
            if student_subjects:
                chosen_subjects = [s.get("subjectCode") for s in student_subjects]
                student["enrolledSubjects"] = chosen_subjects

        # Fetch attendance records for this student
        records = []
        try:
            att_res = attendance_table.query(
                IndexName="StudentIndex",
                KeyConditionExpression=Key("studentId").eq(student_id),
            )
            records = att_res.get("Items", [])
        except Exception:
            records = []

        total_attended = 0
        total_classes_count = 0
        subject_stats = []

        for subj in student_subjects:
            code = subj.get("subjectCode", "")
            cname = subj.get("className", "")
            sc = f"{code}#{cname}"
            threshold = int(subj.get("threshold", 75))

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
            margin = max(0, int((attended * 100 / threshold) - total)) if threshold > 0 else 999
            needed = max(0, int((threshold * total - attended * 100) / (100 - threshold)) + 1) if (rate < threshold and threshold < 100) else 0

            status = "safe" if rate >= threshold + 10 else "ok" if rate >= threshold else "risk" if rate >= threshold - 10 else "critical"

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

        # Timetable matching ONLY enrolled subjects
        enrolled_codes = set(s.get("subjectCode") for s in student_subjects)
        tt_res = timetable_table.scan()
        tt_items = tt_res.get("Items", [])
        tt_map = {}
        for item in tt_items:
            if item.get("subjectCode") in enrolled_codes:
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
