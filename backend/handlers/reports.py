import json
import os
import csv
import io
from datetime import datetime, timedelta
from collections import defaultdict

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
attendance_table = dynamodb.Table(os.environ.get("ATTENDANCE_TABLE", "attendance-system-attendance"))
students_table = dynamodb.Table(os.environ.get("STUDENTS_TABLE", "attendance-system-students"))
courses_table = dynamodb.Table(os.environ.get("COURSES_TABLE", "attendance-system-courses"))


def handle(event, method, path):
    """Route report requests."""
    if method == "GET" and path == "/reports/summary":
        return get_summary(event)
    elif method == "GET" and "/reports/course/" in path:
        course_id = path.split("/")[-1]
        return get_course_report(course_id)
    elif method == "GET" and path == "/reports/export":
        return export_csv(event)
    else:
        return _response(405, {"error": "Method not allowed"})


def get_summary(event):
    """
    Get overall dashboard summary:
    - Total students, courses
    - Today's attendance stats
    - Weekly attendance trend
    """
    try:
        # Count students
        students_result = students_table.scan(Select="COUNT")
        total_students = students_result.get("Count", 0)

        # Count courses
        courses_result = courses_table.scan(Select="COUNT")
        total_courses = courses_result.get("Count", 0)

        # Today's attendance across all courses
        today = datetime.utcnow().strftime("%Y-%m-%d")
        attendance_result = attendance_table.scan()
        all_records = attendance_result.get("Items", [])

        today_records = [r for r in all_records if r.get("date") == today]
        today_present = sum(1 for r in today_records if r.get("status") == "present")
        today_absent = sum(1 for r in today_records if r.get("status") == "absent")
        today_late = sum(1 for r in today_records if r.get("status") == "late")
        today_total = len(today_records)

        # Weekly trend (last 7 days)
        weekly_trend = []
        for i in range(6, -1, -1):
            day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            day_records = [r for r in all_records if r.get("date") == day]
            day_present = sum(1 for r in day_records if r.get("status") == "present")
            day_total = len(day_records)
            weekly_trend.append({
                "date": day,
                "present": day_present,
                "total": day_total,
                "rate": round((day_present / day_total * 100) if day_total > 0 else 0, 1),
            })

        return _response(200, {
            "totalStudents": total_students,
            "totalCourses": total_courses,
            "today": {
                "date": today,
                "present": today_present,
                "absent": today_absent,
                "late": today_late,
                "total": today_total,
                "rate": round((today_present / today_total * 100) if today_total > 0 else 0, 1),
            },
            "weeklyTrend": weekly_trend,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def get_course_report(course_id):
    """Get detailed attendance report for a specific course."""
    try:
        result = attendance_table.query(
            KeyConditionExpression=Key("courseId").eq(course_id),
        )
        records = result.get("Items", [])

        # Group by student
        student_stats = defaultdict(lambda: {"present": 0, "absent": 0, "late": 0, "total": 0})
        dates = set()

        for record in records:
            sid = record.get("studentId", "")
            status = record.get("status", "absent")
            dates.add(record.get("date", ""))
            student_stats[sid]["total"] += 1
            student_stats[sid][status] = student_stats[sid].get(status, 0) + 1

        # Calculate attendance rates
        student_report = []
        for sid, stats in student_stats.items():
            rate = round((stats["present"] / stats["total"] * 100) if stats["total"] > 0 else 0, 1)
            student_report.append({
                "studentId": sid,
                "present": stats["present"],
                "absent": stats["absent"],
                "late": stats.get("late", 0),
                "total": stats["total"],
                "rate": rate,
            })

        # Sort by attendance rate
        student_report.sort(key=lambda x: x["rate"], reverse=True)

        return _response(200, {
            "courseId": course_id,
            "totalDates": len(dates),
            "studentReport": student_report,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def export_csv(event):
    """Export attendance data as CSV."""
    try:
        params = event.get("queryStringParameters", {}) or {}
        course_id = params.get("courseId", "")

        if course_id:
            result = attendance_table.query(
                KeyConditionExpression=Key("courseId").eq(course_id),
            )
        else:
            result = attendance_table.scan()

        records = result.get("Items", [])

        # Build CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Course ID", "Student ID", "Date", "Status", "Marked By", "Marked At"])

        for record in records:
            writer.writerow([
                record.get("courseId", ""),
                record.get("studentId", ""),
                record.get("date", ""),
                record.get("status", ""),
                record.get("markedBy", ""),
                record.get("markedAt", ""),
            ])

        csv_content = output.getvalue()

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "text/csv",
                "Content-Disposition": f"attachment; filename=attendance_export_{datetime.utcnow().strftime('%Y%m%d')}.csv",
                "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            },
            "body": csv_content,
        }
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
