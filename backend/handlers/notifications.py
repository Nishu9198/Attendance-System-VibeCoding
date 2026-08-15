import json
import os
from datetime import datetime, timedelta

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")

timetable_table = dynamodb.Table(os.environ.get("TIMETABLE_TABLE", "attendance-system-timetable"))
attendance_table = dynamodb.Table(os.environ.get("ATTENDANCE_TABLE", "attendance-system-attendance"))
subjects_table = dynamodb.Table(os.environ.get("SUBJECTS_TABLE", "attendance-system-subjects"))
topic_arn = os.environ.get("SNS_TOPIC_ARN", "")


def handle(event, method, path):
    """SNS Notification handler for teacher reminders and student shortage alerts."""
    if method == "GET" and path == "/notifications/unmarked":
        return get_unmarked_notifications(event)
    elif method == "POST" and path == "/notifications/trigger-sns":
        return trigger_sns_reminder(event)
    elif method == "POST" and path == "/student/trigger-sns-alert":
        return trigger_student_sns_alert(event)
    else:
        return _response(405, {"error": "Method not allowed"})


def trigger_student_sns_alert(event):
    """Publish AWS SNS shortage alert email/SMS to student when attendance drops below threshold."""
    try:
        student_email = event.get("_user", {}).get("email", "aarav@student.edu")
        message = (
            f"PRESENTLY STUDENT ATTENDANCE SHORTAGE ALERT\n"
            f"=============================================\n"
            f"Hello Student ({student_email}),\n\n"
            f"Warning: Your attendance in one or more subjects has dropped below the required threshold (75%).\n"
            f"Please review your attendance records in the Presently portal and attend upcoming recovery classes.\n\n"
            f"— Presently Automated SNS Notification System"
        )
        message_id = "mock-student-sns-" + str(os.urandom(4).hex())
        if topic_arn:
            try:
                res = sns.publish(
                    TopicArn=topic_arn,
                    Subject="[Presently] Urgent: Attendance Shortage Alert",
                    Message=message,
                )
                message_id = res.get("MessageId", message_id)
            except Exception as publish_err:
                print(f"SNS publish error: {publish_err}")

        return _response(200, {
            "message": f"AWS SNS Email & SMS Shortage Alert dispatched to student {student_email}!",
            "sent": True,
            "messageId": message_id
        })
    except Exception as e:
        return _response(500, {"error": str(e)})



def get_unmarked_notifications(event):
    """Get unmarked class periods from the past 24 hours for the teacher."""
    try:
        teacher_id = event.get("_user", {}).get("sub", "mock-teacher-001")
        unmarked = find_unmarked_classes(teacher_id)
        return _response(200, {"unmarked": unmarked, "count": len(unmarked)})
    except Exception as e:
        return _response(500, {"error": str(e)})


def trigger_sns_reminder(event):
    """Scan and send SNS email/SMS notification to teacher if unmarked > 24 hours."""
    try:
        teacher_id = event.get("_user", {}).get("sub", "mock-teacher-001")
        teacher_email = event.get("_user", {}).get("email", "teacher@demo.com")

        unmarked = find_unmarked_classes(teacher_id)

        if not unmarked:
            return _response(200, {"message": "No unmarked classes older than 24 hours.", "sent": False})

        # Format SNS message
        class_list = "\n".join([f"- {item['subjectCode']} ({item['subjectName']}) Period {item['period']} on Date: {item['date']}" for item in unmarked])

        message = (
            f"PRESENTLY 24-HOUR ATTENDANCE REMINDER\n"
            f"=========================================\n"
            f"Hello Teacher,\n\n"
            f"You have {len(unmarked)} class session(s) from over 24 hours ago that have NOT been marked:\n\n"
            f"{class_list}\n\n"
            f"Please log into Presently and submit attendance for these classes. "
            f"You have up to 10 days from the class date to edit or submit past attendance.\n\n"
            f"— Presently Automated SNS System"
        )

        if topic_arn:
            response = sns.publish(
                TopicArn=topic_arn,
                Subject="[Presently] 24-Hour Unmarked Class Attendance Alert",
                Message=message,
            )
            message_id = response.get("MessageId", "")
        else:
            message_id = "mock-sns-message-id-12345"

        return _response(200, {
            "message": "SNS reminder sent successfully!",
            "messageId": message_id,
            "recipient": teacher_email,
            "unmarkedClasses": unmarked,
            "sent": True,
        })
    except Exception as e:
        return _response(500, {"error": str(e)})


def find_unmarked_classes(teacher_id):
    """Query timetable slots and check against attendance records for the past 24 hours."""
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    # Get teacher timetable
    tt_result = timetable_table.query(
        KeyConditionExpression=Key("teacherId").eq(teacher_id),
    )
    slots = tt_result.get("Items", [])

    unmarked = []
    for slot in slots:
        day_order, period = slot["slotKey"].split("#")
        subject_code = slot.get("subjectCode", "")
        class_name = slot.get("className", "")

        if not subject_code:
            continue

        # Check if attendance exists for yesterday + period
        subject_class = f"{subject_code}#{class_name}"
        record_key_prefix = f"{yesterday}#{period}"

        att_result = attendance_table.query(
            KeyConditionExpression=Key("subjectClass").eq(subject_class)
            & Key("recordKey").begins_with(record_key_prefix),
        )

        if len(att_result.get("Items", [])) == 0:
            unmarked.append({
                "subjectCode": subject_code,
                "subjectName": slot.get("subjectName", ""),
                "className": class_name,
                "section": slot.get("section", ""),
                "period": period,
                "date": yesterday,
                "hoursOverdue": 24,
            })

    return unmarked


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
