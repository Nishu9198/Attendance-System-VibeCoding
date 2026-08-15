import json
import os
from datetime import datetime, timedelta

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("ATTENDANCE_TABLE", "attendance-system-attendance"))
subjects_table = dynamodb.Table(os.environ.get("SUBJECTS_TABLE", "attendance-system-subjects"))


def handle(event, method, path):
    """Per-period student attendance with edit window enforcement."""
    clean_path = path.split("?")[0].rstrip("/")
    if method == "POST" and clean_path == "/attendance":
        return mark_attendance(event)
    elif method == "GET" and clean_path == "/attendance":
        return get_attendance(event)
    elif method == "GET" and "/attendance/student" in clean_path:
        student_id = clean_path.split("/")[-1]
        return get_student_attendance(event, student_id)
    elif method == "GET" and "/attendance/roster" in clean_path:
        subject_code = clean_path.split("/")[-1]
        return get_roster(event, subject_code)
    else:
        return _response(405, {"error": "Method not allowed"})


def mark_attendance(event):
    """
    Mark attendance for a class period.
    Body: {
        "subjectCode": "CS501",
        "className": "5-A",
        "date": "2024-08-14",
        "period": "3",
        "records": [
            {"studentId": "STU001", "status": "present"},
            {"studentId": "STU002", "status": "absent"},
        ]
    }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"
        subject_code = body.get("subjectCode", "")
        class_name = body.get("className", "")
        date = body.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
        period = str(body.get("period", "1"))
        records = body.get("records", [])

        # Check edit window
        subject_key = f"{subject_code}#{class_name}"
        try:
            subj_result = subjects_table.get_item(
                Key={"teacherId": teacher_id, "subjectCode": subject_code}
            )
            edit_window = int(subj_result.get("Item", {}).get("editWindowDays", 10))
        except Exception:
            edit_window = 10

        record_date = datetime.strptime(date, "%Y-%m-%d")
        today = datetime.utcnow()
        days_diff = (today - record_date).days

        if days_diff > edit_window:
            return _response(403, {
                "error": f"Cannot edit attendance older than {edit_window} days",
                "daysDiff": days_diff,
            })

        saved = []
        for r in records:
            student_id = r.get("studentId", "")
            status = r.get("status", "absent")
            record_key = f"{date}#{period}#{student_id}"

            item = {
                "subjectClass": subject_key,
                "recordKey": record_key,
                "studentId": student_id,
                "date": date,
                "period": period,
                "status": status,
                "markedBy": teacher_id,
                "markedAt": datetime.utcnow().isoformat(),
            }
            table.put_item(Item=item)
            saved.append(item)

        return _response(201, {"message": f"Marked {len(saved)} students", "records": saved})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_attendance(event):
    """Get attendance records for a subject/class, optionally filtered by date."""
    try:
        params = event.get("queryStringParameters", {}) or {}
        subject_code = params.get("subjectCode", "")
        class_name = params.get("className", "")
        date = params.get("date", "")

        subject_class = f"{subject_code}#{class_name}"

        if date:
            result = table.query(
                KeyConditionExpression=Key("subjectClass").eq(subject_class)
                & Key("recordKey").begins_with(date),
            )
        else:
            result = table.query(
                KeyConditionExpression=Key("subjectClass").eq(subject_class),
            )

        records = result.get("Items", [])
        return _response(200, {"records": records, "count": len(records)})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_student_attendance(event, student_id):
    """Get attendance for a specific student across all subjects."""
    try:
        result = table.query(
            IndexName="StudentIndex",
            KeyConditionExpression=Key("studentId").eq(student_id),
        )
        records = result.get("Items", [])
        return _response(200, {"records": records, "count": len(records)})
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_roster(event, subject_code):
    """
    Get full roster analytics for a subject:
    - Per-student: present/absent/late counts, rate, margin, classes needed
    """
    try:
        user = event.get("_user", {}) or {}
        teacher_id = user.get("sub") or user.get("email") or "demo-teacher-001"
        params = event.get("queryStringParameters", {}) or {}
        class_name = params.get("className", "")

        # Get subject info (threshold)
        subj_items = subjects_table.scan().get("Items", [])
        matched_subjs = [s for s in subj_items if s.get("subjectCode") == subject_code]
        subject = matched_subjs[0] if matched_subjs else {}
        threshold = int(subject.get("threshold", 75))
        enrolled_students = subject.get("enrolledStudents", [])
        if not enrolled_students or len(enrolled_students) == 0:
            enrolled_students = ["STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"]

        if not class_name and subject:
            class_name = subject.get("className", "5th Year")

        # Get all attendance records
        subject_class = f"{subject_code}#{class_name}"
        att_result = table.query(
            KeyConditionExpression=Key("subjectClass").eq(subject_class),
        )
        records = att_result.get("Items", [])

        # Count unique periods (total classes)
        unique_classes = set()
        student_stats = {}

        for r in records:
            unique_classes.add(f"{r['date']}#{r['period']}")
            sid = r["studentId"]
            if sid not in student_stats:
                student_stats[sid] = {"present": 0, "absent": 0, "late": 0, "total": 0}
            student_stats[sid]["total"] += 1
            status = r.get("status", "absent")
            if status in student_stats[sid]:
                student_stats[sid][status] += 1

        total_classes = len(unique_classes)

        # Build roster with analytics
        roster = []
        for sid in enrolled_students:
            stats = student_stats.get(sid, {"present": 0, "absent": 0, "late": 0, "total": 0})
            attended = stats["present"] + stats["late"]  # late counts as attended
            rate = round((attended / total_classes * 100) if total_classes > 0 else 100.0, 1)

            # Calculate margin: how many more classes can be missed
            # Formula: (attended / (total_classes + X)) >= threshold/100
            # Solve for X: X <= (attended * 100 / threshold) - total_classes
            if threshold > 0:
                margin = max(0, int((attended * 100 / threshold) - total_classes))
            else:
                margin = 999

            # Calculate classes needed to reach threshold
            # Formula: ((attended + Y) / (total_classes + Y)) >= threshold/100
            # Solve for Y: Y >= (threshold * total_classes - attended * 100) / (100 - threshold)
            if rate < threshold and threshold < 100:
                needed = max(0, int(
                    (threshold * total_classes - attended * 100) / (100 - threshold)
                ) + 1)
            else:
                needed = 0

            # Status
            if rate >= threshold + 10:
                status_label = "safe"
            elif rate >= threshold:
                status_label = "ok"
            elif rate >= threshold - 10:
                status_label = "risk"
            else:
                status_label = "critical"

            roster.append({
                "studentId": sid,
                "present": stats["present"],
                "absent": stats["absent"],
                "late": stats["late"],
                "totalClasses": total_classes,
                "attended": attended,
                "rate": rate,
                "margin": margin,
                "classesNeeded": needed,
                "status": status_label,
            })

        roster.sort(key=lambda x: x["rate"])

        return _response(200, {
            "subjectCode": subject_code,
            "className": class_name,
            "threshold": threshold,
            "totalClasses": total_classes,
            "roster": roster,
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
