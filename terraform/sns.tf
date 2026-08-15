# ============================================================
# Amazon SNS - Attendance Reminders & Notifications
# ============================================================

resource "aws_sns_topic" "attendance_reminders" {
  name = "${var.project_name}-attendance-reminders"
}

# --- SNS Email Subscription ---
resource "aws_sns_topic_subscription" "teacher_email" {
  topic_arn = aws_sns_topic.attendance_reminders.arn
  protocol  = "email"
  endpoint  = var.teacher_notification_email
}

# --- EventBridge Rule for 24h Unmarked Attendance Reminders ---
resource "aws_cloudwatch_event_rule" "daily_reminder" {
  name                = "${var.project_name}-daily-attendance-reminder"
  description         = "Triggers Lambda daily to send SNS notifications for unmarked classes after 24 hours"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "trigger_lambda" {
  rule      = aws_cloudwatch_event_rule.daily_reminder.name
  target_id = "TriggerLambdaReminder"
  arn       = aws_lambda_function.api.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_reminder.arn
}
