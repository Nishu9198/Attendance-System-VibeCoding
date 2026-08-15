variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1" # Mumbai - closest to India
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "attendance-system"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "frontend_domain" {
  description = "Frontend domain for Cognito callback URLs"
  type        = string
  default     = "http://localhost:5173"
}

variable "teacher_notification_email" {
  description = "Teacher email address for SNS 24h attendance reminder notifications"
  type        = string
  default     = "teacher@demo.com"
}
