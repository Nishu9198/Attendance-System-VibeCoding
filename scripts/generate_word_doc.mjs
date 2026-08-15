import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBorderOffsetFrom,
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDocPath = path.resolve(__dirname, '../AttendCloud_Vibe_Coding_Report.docx');

// Styling Constants
const PRIMARY_COLOR = '1E3A8A'; // Deep Navy
const ACCENT_COLOR = '2563EB';  // Vibrant Blue
const BG_HEADER = 'EFF6FF';     // Light Blue
const BG_ROW_ALT = 'F8FAFC';    // Soft Gray
const BORDER_COLOR = 'CBD5E1';  // Slate Gray

function createStyledCell(text, isHeader = false, isAlt = false, widthPercent = 50) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: {
      type: ShadingType.CLEAR,
      fill: isHeader ? PRIMARY_COLOR : isAlt ? BG_ROW_ALT : 'FFFFFF',
    },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: isHeader,
            color: isHeader ? 'FFFFFF' : '1E293B',
            size: 20, // 10pt
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function createHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        color: PRIMARY_COLOR,
        size: level === HeadingLevel.HEADING_1 ? 26 : 22,
        font: 'Calibri',
      }),
    ],
  });
}

function createBullet(text, boldPrefix = '') {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      boldPrefix ? new TextRun({ text: boldPrefix + ' ', bold: true, font: 'Calibri', size: 21, color: '0F172A' }) : new TextRun(''),
      new TextRun({ text: text, font: 'Calibri', size: 21, color: '334155' }),
    ],
  });
}

function createParagraph(text, isBold = false) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({
        text: text,
        bold: isBold,
        font: 'Calibri',
        size: 21,
        color: '1E293B',
      }),
    ],
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Calibri',
          size: 21, // 10.5pt
          color: '1E293B',
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          borders: {
            pageBorders: {
              offsetFrom: PageBorderOffsetFrom.PAGE,
            },
            pageBorderTop: { style: BorderStyle.DOUBLE, size: 12, color: PRIMARY_COLOR },
            pageBorderBottom: { style: BorderStyle.DOUBLE, size: 12, color: PRIMARY_COLOR },
            pageBorderLeft: { style: BorderStyle.DOUBLE, size: 12, color: PRIMARY_COLOR },
            pageBorderRight: { style: BorderStyle.DOUBLE, size: 12, color: PRIMARY_COLOR },
          },
        },
      },
      children: [
        // Title Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: 'SRM INSTITUTE OF SCIENCE AND TECHNOLOGY',
              bold: true,
              size: 28,
              color: PRIMARY_COLOR,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
              bold: true,
              size: 22,
              color: '475569',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: 'Course: Cloud Strategy Planning and Management (21CSE463T)',
              bold: true,
              size: 20,
              color: ACCENT_COLOR,
              font: 'Calibri',
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 200 },
          children: [
            new TextRun({
              text: 'VIBE CODING ACTIVITY — COMPREHENSIVE PROJECT REPORT',
              bold: true,
              size: 26,
              color: PRIMARY_COLOR,
              font: 'Calibri',
              underline: {},
            }),
          ],
        }),

        // 1. Student Details Table
        createHeading('1. Student & Submission Details', HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createStyledCell('Field', true, false, 35),
                createStyledCell('Details', true, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Student Name', false, false, 35),
                createStyledCell('Sahil Moghaiz', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Register Number', false, true, 35),
                createStyledCell('RA2311028010062', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Section', false, false, 35),
                createStyledCell('V1', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Course Name', false, true, 35),
                createStyledCell('Cloud Strategy Planning and Management', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Subject Code', false, false, 35),
                createStyledCell('21CSE463T', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Faculty In-Charge', false, true, 35),
                createStyledCell('Dr. S. Prabakeran', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Problem Statement Assigned', false, false, 35),
                createStyledCell('Problem Statement - 15 (AttendCloud)', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Live Production HTTPS URL', false, true, 35),
                createStyledCell('https://d1yszng57r6fz7.cloudfront.net', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('GitHub Source Code URL', false, false, 35),
                createStyledCell('https://github.com/Nishu9198/AttendCloud-AWS-Attendance-System', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Date of Activity', false, true, 35),
                createStyledCell('August 15, 2026', false, true, 65),
              ],
            }),
          ],
        }),

        // 2. Problem Statement
        createHeading('2. Problem Statement', HeadingLevel.HEADING_1),
        createParagraph('Problem Statement - 15: Design, implement, and deploy a cloud-native, serverless attendance management system that replaces manual roll calls and standalone fingerprint hardware with secure facial biometric verification, role-based portals for teachers and students, automated timetable scheduling synchronization, and proactive attendance shortage notifications.'),

        // 3. Objective
        createHeading('3. Objectives of the Application', HeadingLevel.HEADING_1),
        createBullet('Eliminate instructional lecture time loss and proxy attendance using Amazon Rekognition biometric computer vision.', '1.'),
        createBullet('Provide a 100% serverless multi-tenant web application on AWS with zero idle maintenance costs within Free Tier.', '2.'),
        createBullet('Automatically synchronize student course timetables with faculty master schedules for all enrolled subjects.', '3.'),
        createBullet('Deliver dynamic attendance analytics (75% threshold safety margin and recovery class predictor).', '4.'),
        createBullet('Automate daily shortage email alerts via Amazon SNS and Amazon EventBridge rules.', '5.'),
        createBullet('Automate end-to-end cloud infrastructure provisioning via Terraform (Infrastructure as Code).', '6.'),

        // 4. Syllabus Concepts Used
        createHeading('4. Syllabus Concepts Used (Cloud Strategy & Management)', HeadingLevel.HEADING_1),
        createBullet('Serverless Compute Architecture (AWS Lambda) for scalable, zero-server backend execution.', '•'),
        createBullet('Infrastructure as Code (IaC - Terraform) for automated, declarative cloud resource provisioning.', '•'),
        createBullet('Cloud Identity & Access Management (Amazon Cognito) for role-based authentication and JWT token validation.', '•'),
        createBullet('Managed NoSQL Database Design (Amazon DynamoDB) with partition keys, sort keys, and global secondary indexes.', '•'),
        createBullet('Cloud Object Storage & Security (Amazon S3) with CORS policies and public access blocks.', '•'),
        createBullet('Edge Caching & Content Delivery (Amazon CloudFront) with SSL/TLS HTTPS distribution.', '•'),
        createBullet('Cloud AI & Computer Vision Services (Amazon Rekognition) for facial vector comparison.', '•'),
        createBullet('Event-Driven Pub/Sub Notifications (Amazon SNS & EventBridge) for automated alerts.', '•'),
        createBullet('Cloud Cost Optimization & Governance strictly compliant with AWS Free Tier ($0.00/month).', '•'),

        // 5. Tools and Technologies Used
        createHeading('5. Tools and Technologies Used', HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createStyledCell('Category', true, false, 35),
                createStyledCell('Technology / Tool', true, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Vibe Coding Tool', false, false, 35),
                createStyledCell('Antigravity / Claude 3.7 Sonnet / Gemini 2.5 Flash', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Programming Languages', false, true, 35),
                createStyledCell('Python 3.12 (Lambda Backend), JavaScript ES6+ (React SPA)', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Frontend Framework', false, false, 35),
                createStyledCell('React 18, Vite, Chart.js, Lucide Icons, Glassmorphism CSS', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Backend & APIs', false, true, 35),
                createStyledCell('AWS Lambda, Amazon API Gateway (HTTP v2), Boto3 SDK', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Database', false, false, 35),
                createStyledCell('Amazon DynamoDB (On-Demand NoSQL Tables & GSIs)', false, false, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Cloud Platform', false, true, 35),
                createStyledCell('Amazon Web Services (AWS ap-south-1 Mumbai)', false, true, 65),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('Infrastructure as Code', false, false, 35),
                createStyledCell('HashiCorp Terraform v1.10+', false, false, 65),
              ],
            }),
          ],
        }),

        // 6. Application Design
        createHeading('6. Application Design & Architecture', HeadingLevel.HEADING_1),
        createParagraph('The system follows a 3-tier decoupled serverless architecture comprising Client Layer (React SPA), Edge/API Layer (CloudFront & API Gateway), Compute & AI Layer (Lambda & Rekognition), and Storage Layer (DynamoDB & S3).'),
        createBullet('Client Layer: Responsive React SPA hosted in S3 and delivered globally through CloudFront CDN with TLS 1.2+ encryption.', '1.'),
        createBullet('Security & Authentication: Amazon Cognito User Pools authenticates Faculty and Students, issuing signed JWT tokens.', '2.'),
        createBullet('Compute Layer: AWS Lambda microservices process REST API requests, invoke Rekognition CompareFaces, and execute attendance batch operations.', '3.'),
        createBullet('Database Layer: Amazon DynamoDB stores Students, Subjects, Timetables, and Attendance records with sub-10ms response times.', '4.'),
        createBullet('Notification Layer: Amazon SNS sends instantaneous SMS/Email shortage warnings, triggered by Lambda and EventBridge cron rules.', '5.'),

        // 7. Prompts Used
        createHeading('7. Prompts Used During Development', HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createStyledCell('S.No.', true, false, 10),
                createStyledCell('AI Tool', true, false, 20),
                createStyledCell('Prompt Used', true, false, 45),
                createStyledCell('Purpose', true, false, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('1', false, false, 10),
                createStyledCell('Antigravity', false, false, 20),
                createStyledCell('"Build serverless attendance system with Cognito, Lambda, API Gateway, DynamoDB, S3, and Terraform IaC."', false, false, 45),
                createStyledCell('Project scaffolding & IaC provisioning', false, false, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('2', false, true, 10),
                createStyledCell('Claude 3.7', false, true, 20),
                createStyledCell('"Integrate Amazon Rekognition CompareFaces with webcam capture to verify teacher presence before unlocking marking."', false, true, 45),
                createStyledCell('Biometric facial verification pipeline', false, true, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('3', false, false, 10),
                createStyledCell('Claude 3.7', false, false, 20),
                createStyledCell('"Implement mathematical logic for 75% attendance threshold: calculate safe margin and recovery classes needed."', false, false, 45),
                createStyledCell('Academic defaulter recovery analytics', false, false, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('4', false, true, 10),
                createStyledCell('Gemini 2.5', false, true, 20),
                createStyledCell('"Fix CORS preflight OPTIONS failure and AWS S3 ListBucket AccessDenied exception during face verification."', false, true, 45),
                createStyledCell('Cloud security & IAM policy debugging', false, true, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('5', false, false, 10),
                createStyledCell('Claude 3.7', false, false, 20),
                createStyledCell('"When teacher creates subject and timetable slots, auto-sync student timetable so it matches the teacher."', false, false, 45),
                createStyledCell('Automated timetable synchronization', false, false, 25),
              ],
            }),
            new TableRow({
              children: [
                createStyledCell('6', false, true, 10),
                createStyledCell('Antigravity', false, true, 20),
                createStyledCell('"Generate Word document with borders and 14-point rubrics report for Cloud Strategy Planning."', false, true, 45),
                createStyledCell('Academic report generation', false, true, 25),
              ],
            }),
          ],
        }),

        // 8. Application Screenshots
        createHeading('8. Application Modules & Functional Screenshots', HeadingLevel.HEADING_1),
        createBullet('Teacher Biometric Facial Verification (/attendance): Live camera capture verified against S3 master photo via Rekognition.', '1.'),
        createBullet('Subject Settings & Student Enrollment (/subject-settings): Subject configuration, threshold setting (75%), and multi-student enrollment.', '2.'),
        createBullet('Weekly Master Timetable (/timetable): Interactive Day Order (1-5) x Period (1-8) scheduling grid.', '3.'),
        createBullet('Student Attendance Roster & Analytics (/roster): Real-time percentage tracking, Present/Late/Absent counters, and CSV export.', '4.'),
        createBullet('Student Portal Dashboard (/): Today\'s classes, enrolled subject breakdown, attendance safety status, and shortage warning banners.', '5.'),

        // 9. GitHub Link
        createHeading('9. GitHub Repository Link', HeadingLevel.HEADING_1),
        createParagraph('GitHub Repository: https://github.com/Nishu9198/AttendCloud-AWS-Attendance-System'),
        createParagraph('Live Production HTTPS URL: https://d1yszng57r6fz7.cloudfront.net'),

        // 10. Video Demonstration Link
        createHeading('10. Video Demonstration Link', HeadingLevel.HEADING_1),
        createParagraph('Video Demonstration Link: https://youtu.be/your-video-link-here (Insert your submitted video demo URL with camera on and voiceover explanation).'),

        // 11. Blockers Faced
        createHeading('11. Blockers Faced & Cloud Resolutions', HeadingLevel.HEADING_1),
        createBullet('S3 AccessDenied on GetObject: Resolved by granting s3:ListBucket and s3:GetBucketLocation permissions in terraform/lambda.tf.', '•'),
        createBullet('CORS Preflight Failures: Resolved by adding a global OPTIONS 200 handler in backend/handlers/main.py and setting wildcard CORS headers in api_gateway.tf.', '•'),
        createBullet('Shared Timetable Across Roles: Resolved by partitioning DynamoDB slots by role/userId and dynamically filtering student schedules by enrolled subjects.', '•'),
        createBullet('First-Time Teacher Face Enrollment: Resolved by automatically registering the first verified facial capture as the master baseline profile in S3.', '•'),

        // 12. Experience of the Activity
        createHeading('12. Experience of the Vibe Coding Activity', HeadingLevel.HEADING_1),
        createParagraph('Using Vibe Coding tools (Antigravity with Claude 3.7 Sonnet and Gemini 2.5 Flash) accelerated the cloud deployment workflow significantly. It eliminated repetitive boilerplate, facilitated instant Terraform infrastructure synthesis, diagnosed complex IAM/CORS issues in real-time, and enabled full-stack production delivery within the allotted two class periods.'),

        // 13. Learning from the Activity
        createHeading('13. Learning Reflections', HeadingLevel.HEADING_1),
        createBullet('Cloud Concepts: Practical mastery of AWS Lambda microservices, DynamoDB NoSQL modeling, CloudFront CDN, and IAM least-privilege policies.', '•'),
        createBullet('Application Development: Connecting modern React SPAs with serverless backend APIs and cloud computer vision.', '•'),
        createBullet('AI-Assisted Coding: Structuring iterative, high-precision technical prompts to generate clean, maintainable architectures.', '•'),
        createBullet('Debugging & Diagnostics: Tracing distributed cloud issues across CloudWatch logs, API Gateway status codes, and IAM permission policies.', '•'),

        // 14. Conclusion
        createHeading('14. Conclusion', HeadingLevel.HEADING_1),
        createParagraph('AttendCloud successfully demonstrates an enterprise-grade, cost-effective ($0.00/month on AWS Free Tier), and 100% serverless attendance management platform. By combining Terraform IaC, Amazon Rekognition biometric AI, DynamoDB NoSQL, and automated student timetable synchronization, the project fulfills all academic and functional requirements of Problem Statement - 15.'),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputDocPath, buffer);
  console.log(`✅ Word Document successfully generated with page borders at: ${outputDocPath}`);
});
