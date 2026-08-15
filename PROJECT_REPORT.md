# SRM Institute of Science and Technology
### Department of Computer Science & Engineering
## Cloud Strategy Planning and Management (21CSE463T)

---

# 🎓 VIBE CODING ACTIVITY — PROJECT REPORT
## Problem Statement - 15: Serverless Cloud-Native Attendance & Smart Biometric Verification System (AttendCloud)

---

### 1. Student Details
- **Student Name:** Sahil Moghaiz
- **Register Number:** RA2311028010062
- **Section:** V1
- **Course Code:** 21CSE463T (Cloud Strategy Planning and Management)
- **Faculty In-Charge:** Dr. S. Prabakeran
- **Date of Activity:** August 15, 2026

---

### 2. Problem Statement
**Problem Statement - 15:** Design, implement, and deploy a cloud-native, serverless attendance management system that replaces manual roll calls and standalone fingerprint hardware with secure facial biometric verification, role-based portals for teachers and students, automated timetable scheduling synchronization, and proactive attendance shortage notifications.

---

### 3. Objective
The objective of AttendCloud is to:
1. Eliminate instructional time loss and proxy attendance in classrooms through **Amazon Rekognition** biometric facial verification.
2. Provide a scalable, 100% serverless multi-tenant web platform with zero server maintenance costs leveraging **AWS Free Tier**.
3. Synchronize student class schedules automatically with faculty master timetables based on enrolled course instances.
4. Calculate dynamic attendance threshold analytics ($75\%$ safety margin and consecutive recovery classes required).
5. Automate daily shortage alerts to faculty and students using **Amazon SNS** and **Amazon EventBridge**.
6. Automate end-to-end cloud infrastructure provisioning via **Terraform (Infrastructure as Code)**.

---

### 4. Syllabus Concepts Used
The project directly incorporates core principles from the **Cloud Strategy Planning and Management (21CSE463T)** curriculum:
1. **Serverless Compute Architecture (AWS Lambda):** Event-driven, auto-scaling backend execution without provisioning virtual machines (EC2).
2. **Infrastructure as Code (IaC - Terraform):** Declarative infrastructure provisioning ensuring 100% reproducibility and zero configuration drift.
3. **Cloud Identity & Access Management (Amazon Cognito):** Multi-factor role-based access control (RBAC), OAuth 2.0 / JWT token validation, and secure session management.
4. **Managed NoSQL Database Design (Amazon DynamoDB):** High-throughput, single-digit millisecond latency data modeling using Partition Keys, Sort Keys, and Global Secondary Indexes (GSIs).
5. **Cloud Object Storage & Static Hosting (Amazon S3):** Secure bucket policies, CORS configuration, and public access blocks for assets and biometric data.
6. **Edge Caching & Content Delivery Networks (Amazon CloudFront):** Global SSL/TLS HTTPS distribution and sub-second asset caching.
7. **Cloud AI & Computer Vision Services (Amazon Rekognition):** Deep learning facial feature extraction and vector comparison.
8. **Event-Driven Architecture & Pub/Sub Messaging (Amazon SNS & EventBridge):** Automated asynchronous notification triggers and cron schedule rules.
9. **Cloud Cost Optimization & Governance:** Architecting specifically within AWS Always-Free limits with $\$0.00$ idle cost.

---

### 5. Tools and Technologies Used
- **Vibe Coding Tool:** Antigravity / Claude 3.7 Sonnet / Gemini 2.5 Flash
- **Programming Languages:** Python 3.12 (Backend Lambda), JavaScript / ES6+ (Frontend React)
- **Frontend Framework:** React 18, Vite, Chart.js, Lucide Icons, Vanilla CSS Design System
- **Backend Framework:** AWS Lambda Python runtime, AWS Boto3 SDK
- **Database:** Amazon DynamoDB (NoSQL on-demand)
- **Cloud Platform:** Amazon Web Services (AWS - Asia Pacific Mumbai `ap-south-1`)
- **Infrastructure as Code:** Terraform v1.10+ by HashiCorp

---

### 6. Application Design

#### 6.1 Simple Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                CLIENT LAYER                                   |
|   [Student Web Browser (SPA)]                  [Teacher Web Browser (SPA)]    |
+------------------------------------+------------------------------------------+
                                     |
                          HTTPS (TLS 1.2+ / Edge CDN)
                                     v
+-------------------------------------------------------------------------------+
|                    AMAZON CLOUDFRONT (CDN Distribution)                       |
|       Origin: Amazon S3 Bucket (attendance-system-frontend-5c2c7946)          |
+------------------------------------+------------------------------------------+
                                     |
                            API Calls + Cognito JWT
                                     v
+-------------------------------------------------------------------------------+
|                       AMAZON API GATEWAY (HTTP API v2)                        |
|                                    | (Proxy Integration)                      |
|                                    v                                          |
|                          AWS LAMBDA (Python 3.12)                             |
|          +-------------------------+--------------------------+               |
|          |                         |                          |               |
|          v                         v                          v               |
|   [Amazon Rekognition]     [Amazon DynamoDB]            [Amazon SNS]          |
|    - CompareFaces API       - Students Table             - Shortage Alerts    |
|    - Vector Verification    - Subjects Table                  ^               |
|          |                  - Timetable Table                 | (Daily Trigger|
|          v                  - Attendance Records Table  [Amazon EventBridge]  |
|    [Amazon S3 Photos]       - Teacher Attendance Table   (Cron Schedule Rule) |
+-------------------------------------------------------------------------------+
```

#### 6.2 Application Workflow
1. **Authentication:** User logs in via Cognito. JWT tokens identify role (`teacher` vs `student`).
2. **Subject & Timetable Configuration:** Teacher sets up subjects, enrolls students, and assigns Day Order/Period slots.
3. **Biometric Face Verification:** When teacher opens attendance marking, the webcam captures the teacher's face and verifies it against the S3 master photo via Amazon Rekognition `CompareFaces`.
4. **Attendance Submission:** Teacher marks Present/Late/Absent with one click; records are batch-written to DynamoDB.
5. **Automated Student Synchronization:** When students log in, their personal timetable and dashboard automatically reflect the teacher's schedule for their enrolled subjects.
6. **Analytics & Alerts:** Margin of safety and shortage recovery metrics are computed live. If attendance falls below $75\%$, Amazon SNS sends shortage alerts.

#### 6.3 Main Features
- **Facial Biometric Unlock:** Rekognition-verified teacher attendance check-in.
- **Dynamic Timetable Sync:** Student schedules automatically inherit teacher-scheduled slots.
- **Roster & Defaulter Analytics:** Real-time percentage tracking, recovery predictions, and CSV export.
- **Automated SNS Alerts:** Immediate and scheduled shortage email notifications.
- **Responsive Dark/Light Theme:** Glassmorphism UI built for desktop and mobile.

---

### 7. Prompts Used During Development

| S.No. | AI Tool | Prompt Used | Purpose |
|:---:|:---|:---|:---|
| 1 | Antigravity / Claude | `"Build a serverless full-stack attendance management system with AWS Cognito, Lambda, API Gateway, DynamoDB, S3, and Terraform IaC."` | Initial project scaffolding, Terraform resource definitions, and backend routing. |
| 2 | Antigravity / Claude | `"Integrate Amazon Rekognition CompareFaces with webcam capture to verify teacher presence before unlocking attendance marking."` | Biometric face verification pipeline and S3 photo storage. |
| 3 | Antigravity / Claude | `"Implement mathematical logic for 75% attendance threshold: calculate safe margin of absences and consecutive classes needed to recover."` | Core academic business logic and defaulter recovery formulas. |
| 4 | Antigravity / Gemini | `"Fix CORS preflight OPTIONS failure and AWS S3 ListBucket AccessDenied exception during face verification."` | Cloud security debugging, IAM policy tuning, and API Gateway CORS setup. |
| 5 | Antigravity / Claude | `"When a teacher creates a subject and assigns timetable slots, automatically synchronize the student's timetable so it matches the teacher."` | Student-to-Teacher timetable auto-sync and subject enrollment filtering. |
| 6 | Antigravity / Claude | `"Generate a comprehensive academic project report mapped to the 14-point evaluation rubrics for Cloud Strategy Planning."` | Complete documentation and academic submission generation. |

---

### 8. Application Screenshots

1. **Teacher Biometric Facial Verification (`/attendance`):**
   - Live webcam feed capturing facial vectors and verifying against S3 master photo via Amazon Rekognition.
2. **Subject Settings & Student Enrollment (`/subject-settings`):**
   - Course subject configuration, custom threshold setting ($75\%$), building/room assignment, and student multi-selection.
3. **Weekly Master Timetable (`/timetable`):**
   - Interactive Day Order (1–5) $\times$ Period (1–8) grid for scheduling lecture slots.
4. **Student Attendance Roster & Defaulter Analytics (`/roster`):**
   - Real-time student attendance rate, Present/Late/Absent counters, margin safety indicator, and CSV export.
5. **Student Portal Dashboard (`/`):**
   - Today's classes strip, enrolled course breakdown, overall attendance percentage, and shortage warning banners.

---

### 9. GitHub Link
- **Repository URL:** [https://github.com/Nishu9198/AttendCloud-AWS-Attendance-System](https://github.com/Nishu9198/AttendCloud-AWS-Attendance-System)
- **Live Production URL:** [https://d1yszng57r6fz7.cloudfront.net](https://d1yszng57r6fz7.cloudfront.net)

---

### 10. Video Demonstration Link
- **Video Link:** `https://youtu.be/your-video-link-here` *(Insert your uploaded YouTube/Drive video recording link with camera and voiceover)*

---

### 11. Blockers Faced & Solutions

| S.No. | Blocker / Issue Faced | Root Cause | Resolution Applied |
|:---:|:---|:---|:---|
| 1 | **S3 `AccessDenied` on `GetObject`** | AWS S3 returns `403 AccessDenied` instead of `404 NoSuchKey` when checking non-existent files if `s3:ListBucket` is omitted from the IAM role. | Added `s3:ListBucket` and `s3:GetBucketLocation` to Lambda IAM policy in `terraform/lambda.tf`. |
| 2 | **CORS `Failed to fetch` on POST Requests** | HTTP API Gateway `$default` route forwarded browser preflight `OPTIONS` requests to Lambda without proper 200 status and CORS headers. | Implemented global `OPTIONS` handler in `main.py` returning `200 OK` and configured API Gateway CORS wildcard headers. |
| 3 | **Timetable Shared Across All Roles** | Timetable database scan was retrieving all records globally without user role partitioning. | Partitioned DynamoDB records by role/user key and auto-matched student timetables against teacher-scheduled slots for enrolled courses. |
| 4 | **Teacher Face Rekognition Initial Registration** | Initial teacher verification had no existing master photo in S3, causing face comparison failure. | Implemented automatic first-photo enrollment in `face_recognition.py` to register the master face on first check-in. |

---

### 12. Experience of the Activity
Using **Vibe Coding tools** (Antigravity with Claude 3.7 Sonnet and Gemini 2.5 Flash) transformed the traditional multi-week cloud development lifecycle into an agile, highly productive session. Instead of writing repetitive boilerplate, AI-assisted development enabled rapid prototyping of complex cloud architectures, automated Terraform IaC synthesis, real-time AWS debugging, and seamless integration between frontend UI and serverless backend microservices.

---

### 13. Learning from the Activity
- **Cloud Concepts:** Deep practical understanding of Serverless architectures (Lambda, API Gateway), NoSQL partitioning (DynamoDB), CloudFront CDN distribution, and IAM least-privilege policies.
- **Application Development:** Full-stack integration connecting React SPA with AWS serverless APIs and computer vision services.
- **AI-Assisted Coding:** Effective decomposition of system requirements into structured, iterative prompts.
- **Prompt Writing:** Formulating precise technical prompts with explicit context, error traces, and architectural constraints.
- **Debugging & Testing:** Diagnosing distributed cloud issues through CloudWatch logs, API Gateway status codes, and IAM permission audits.

---

### 14. Conclusion
**AttendCloud** demonstrates a complete, production-ready, cloud-native serverless solution for modern attendance management. By integrating **AWS Lambda, DynamoDB, Cognito, S3, Rekognition, SNS, and CloudFront** through **Terraform IaC**, the project delivers zero-server-maintenance scalability, sub-second biometric verification, automated timetable synchronization, and intelligent attendance analytics—all operating within the **AWS Free Tier ($0.00 / month)**.
