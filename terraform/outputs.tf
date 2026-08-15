output "api_url" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "frontend_url" {
  description = "S3 static website URL"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend deployment"
  value       = aws_s3_bucket.frontend.bucket
}

output "photos_bucket" {
  description = "S3 bucket name for student photos"
  value       = aws_s3_bucket.photos.bucket
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}

output "cloudfront_url" {
  description = "CloudFront HTTPS distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for attendance reminders"
  value       = aws_sns_topic.attendance_reminders.arn
}

