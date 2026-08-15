# ============================================================
# Lambda Function (Always Free: 1M requests/month)
# ============================================================

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
          "dynamodb:BatchWriteItem", "dynamodb:BatchGetItem",
        ]
        Resource = [
          aws_dynamodb_table.timetable.arn,
          aws_dynamodb_table.subjects.arn,
          "${aws_dynamodb_table.subjects.arn}/index/*",
          aws_dynamodb_table.attendance.arn,
          "${aws_dynamodb_table.attendance.arn}/index/*",
          aws_dynamodb_table.teacher_attendance.arn,
          aws_dynamodb_table.students.arn,
          "${aws_dynamodb_table.students.arn}/index/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = [
          "s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.photos.arn,
          "${aws_s3_bucket.photos.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.attendance_reminders.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminListGroupsForUser",
        ]
        Resource = aws_cognito_user_pool.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rekognition:CompareFaces",
          "rekognition:DetectFaces",
          "rekognition:IndexFaces",
          "rekognition:SearchFacesByImage",
          "rekognition:CreateCollection",
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/lambda_package.zip"
}

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers.main.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.12"
  memory_size      = 128
  timeout          = 30

  environment {
    variables = {
      TIMETABLE_TABLE          = aws_dynamodb_table.timetable.name
      SUBJECTS_TABLE           = aws_dynamodb_table.subjects.name
      ATTENDANCE_TABLE         = aws_dynamodb_table.attendance.name
      TEACHER_ATTENDANCE_TABLE = aws_dynamodb_table.teacher_attendance.name
      STUDENTS_TABLE           = aws_dynamodb_table.students.name
      PHOTOS_BUCKET            = aws_s3_bucket.photos.bucket
      SNS_TOPIC_ARN            = aws_sns_topic.attendance_reminders.arn
      COGNITO_USER_POOL_ID     = aws_cognito_user_pool.main.id
      CORS_ORIGIN              = var.frontend_domain
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 7
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


