# ============================================================
# DynamoDB Tables (Always Free: 25 GB + 25 RCU/WCU)
# Redesigned for timetable-driven per-period attendance
# ============================================================

# --- Timetable Table ---
# Teacher's weekly schedule with Day Order 1-5
resource "aws_dynamodb_table" "timetable" {
  name         = "${var.project_name}-timetable"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "teacherId"
  range_key    = "slotKey" # format: "dayOrder#period" e.g. "1#1", "3#5"

  attribute {
    name = "teacherId"
    type = "S"
  }

  attribute {
    name = "slotKey"
    type = "S"
  }
}

# --- Subjects Table ---
# Subjects managed by a teacher with attendance threshold
resource "aws_dynamodb_table" "subjects" {
  name         = "${var.project_name}-subjects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "teacherId"
  range_key    = "subjectCode"

  attribute {
    name = "teacherId"
    type = "S"
  }

  attribute {
    name = "subjectCode"
    type = "S"
  }
}

# --- Attendance Records Table ---
# Per-student per-period per-date records
resource "aws_dynamodb_table" "attendance" {
  name         = "${var.project_name}-attendance"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subjectClass"  # format: "subjectCode#className"
  range_key    = "recordKey"     # format: "date#period#studentId"

  attribute {
    name = "subjectClass"
    type = "S"
  }

  attribute {
    name = "recordKey"
    type = "S"
  }

  attribute {
    name = "studentId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # Query attendance by student across all subjects
  global_secondary_index {
    name            = "StudentIndex"
    hash_key        = "studentId"
    range_key       = "date"
    projection_type = "ALL"
  }
}

# --- Teacher Attendance Table ---
# Teacher's own daily check-in
resource "aws_dynamodb_table" "teacher_attendance" {
  name         = "${var.project_name}-teacher-attendance"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "teacherId"
  range_key    = "date"

  attribute {
    name = "teacherId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }
}

# --- Students Table ---
resource "aws_dynamodb_table" "students" {
  name         = "${var.project_name}-students"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "studentId"

  attribute {
    name = "studentId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }
}
