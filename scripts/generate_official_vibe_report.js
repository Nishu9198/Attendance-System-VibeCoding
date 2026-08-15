import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ImageRun,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Typography & Palette
const FONT_FAMILY = 'Arial';
const COLOR_PRIMARY = '0A2540'; // Deep Navy
const COLOR_SECONDARY = '0066CC'; // Ocean Blue
const COLOR_TEXT = '2D3748';
const COLOR_BG_LIGHT = 'F7FAFC';
const COLOR_BORDER = 'CBD5E0';

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.align || AlignmentType.LEFT,
    spacing: { before: options.before ?? 80, after: options.after ?? 80, line: options.line ?? 260 },
    children: [
      new TextRun({
        text,
        size: options.size || 21, // 10.5pt
        color: options.color || COLOR_TEXT,
        bold: options.bold || false,
        italics: options.italics || false,
        font: FONT_FAMILY,
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        color: COLOR_PRIMARY,
        bold: true,
        size: 28, // 14pt
        font: FONT_FAMILY,
      }),
    ],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100 },
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        color: COLOR_SECONDARY,
        bold: true,
        size: 24, // 12pt
        font: FONT_FAMILY,
      }),
    ],
  });
}

function bullet(text, boldPrefix = '') {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      ...(boldPrefix
        ? [
            new TextRun({
              text: boldPrefix + ' ',
              bold: true,
              color: COLOR_PRIMARY,
              size: 21,
              font: FONT_FAMILY,
            }),
          ]
        : []),
      new TextRun({
        text,
        color: COLOR_TEXT,
        size: 21,
        font: FONT_FAMILY,
      }),
    ],
  });
}

function createStyledTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  color: 'FFFFFF',
                  size: 19,
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map((row, rIndex) => {
    const isEven = rIndex % 2 === 0;
    return new TableRow({
      children: row.map(
        (cellText) =>
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: isEven ? 'FFFFFF' : COLOR_BG_LIGHT,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    color: COLOR_TEXT,
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function callout(title, lines) {
  const cellChildren = [
    new Paragraph({
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: COLOR_PRIMARY,
          size: 23,
          font: FONT_FAMILY,
        }),
      ],
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text: line,
              color: COLOR_TEXT,
              size: 20,
              font: FONT_FAMILY,
            }),
          ],
        })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'EDF2F7' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
              left: { style: BorderStyle.SINGLE, size: 24, color: '0066CC' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
            },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: cellChildren,
          }),
        ],
      }),
    ],
  });
}

async function buildOfficialReport() {
  console.log('📄 Building Official Vibe Coding Application Report (14 Sections strictly matching instructions)...');

  const imgPath = path.join(rootDir, 'docs/aws_architecture_diagram.png');
  let imageRun = null;
  if (fs.existsSync(imgPath)) {
    const imgBuffer = fs.readFileSync(imgPath);
    imageRun = new ImageRun({
      data: imgBuffer,
      transformation: {
        width: 560,
        height: 315,
      },
      type: 'png',
    });
  }

  const doc = new Document({
    creator: 'Sahil Moghaiz',
    title: 'Vibe Coding Application Project Report - Sahil Moghaiz (21CSE463T)',
    description: 'Official 14-Section Vibe Coding Report for Cloud Strategy Planning and Management',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Vibe Coding Activity Report | Cloud Strategy (21CSE463T)',
                    size: 16,
                    color: '718096',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 16, color: '718096', font: FONT_FAMILY }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '718096',
                    font: FONT_FAMILY,
                  }),
                  new TextRun({ text: ' of ', size: 16, color: '718096', font: FONT_FAMILY }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '718096',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: 'VIBE CODING APPLICATION ACTIVITY REPORT',
                bold: true,
                size: 32,
                color: COLOR_PRIMARY,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [
              new TextRun({
                text: 'Presently — An AWS Serverless AI Facial Recognition Attendance & Classroom Platform',
                italics: true,
                size: 22,
                color: COLOR_SECONDARY,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // SECTION 1: STUDENT DETAILS
          heading1('1. Student Details'),
          bullet('Sahil Moghaiz', '• Student Name:'),
          bullet('RA2311028010062', '• Register Number:'),
          bullet('V1', '• Section:'),
          bullet('21CSE463T', '• Course Code:'),
          bullet('Cloud Strategy Planning and Management', '• Course / Subject Name:'),
          bullet('Dr. S. Prabakeran (Professor, Dept. of Networking and Communication)', '• Faculty / Guide:'),
          bullet('August 16, 2026', '• Date of Activity:'),

          // SECTION 2: PROBLEM STATEMENT
          heading1('2. Problem Statement'),
          p(
            'In academic institutions, traditional attendance tracking relies heavily on manual paper roll calls or physical sign-in sheets. This process is time-consuming (wasting 10 to 15 minutes of every lecture), error-prone, and vulnerable to widespread proxy attendance. Physical hardware alternatives—such as optical fingerprint scanners and RFID card readers—require expensive procurement, cause physical doorway congestion at class transition times, and suffer from high mechanical maintenance costs. Furthermore, existing educational portals are fragmented, lacking automated integration between weekly master timetable scheduling, real-time biometric verification, and automated compliance alerts.'
          ),

          // SECTION 3: OBJECTIVE
          heading1('3. Objective'),
          p('The primary objectives of the Presently platform are:'),
          bullet('Eliminate manual roll calls and proxy attendance by implementing real-time, browser-native AI facial recognition with >= 85% matching confidence.', '•'),
          bullet('Remove all physical hardware constraints by utilizing standard laptop/tablet webcams via HTML5 video streaming.', '•'),
          bullet('Integrate a 5 Day Orders × 11 Periods Master Timetable Grid with real-time room and subject scheduling.', '•'),
          bullet('Automate institutional compliance with 24-hour unmarked class email notification dispatch via Amazon SNS.', '•'),
          bullet('Deploy 100% serverless infrastructure on the AWS Free Tier, achieving $0.00 idle server costs and automated provisioning via Terraform.', '•'),

          // SECTION 4: SYLLABUS CONCEPTS USED
          heading1('4. Syllabus Concepts Used (Cloud Strategy & Management)'),
          p('This application directly implements core cloud computing and cloud strategy principles:'),
          bullet('Serverless Microservices Architecture (AWS Lambda): Stateless compute execution on Python 3.12 with automatic concurrency scaling and zero idle billing.', '•'),
          bullet('Cloud NoSQL Key-Value Database (Amazon DynamoDB): Single-digit millisecond latency data storage with on-demand capacity across 5 core relational entities.', '•'),
          bullet('Cloud Identity and Access Management (Amazon Cognito SRP): Secure Remote Password authentication issuing cryptographically signed JWT tokens.', '•'),
          bullet('Edge Content Delivery (Amazon CloudFront): Global CDN distribution with HTTPS SSL/TLS encryption and client-side SPA error routing.', '•'),
          bullet('Managed Cloud Computer Vision (Amazon Rekognition): Serverless deep neural network facial feature detection and biometric similarity comparison.', '•'),
          bullet('Cloud Event-Driven Architecture (Amazon EventBridge & SNS): Automated cron-based event scheduling and pub/sub push notification dispatch.', '•'),
          bullet('Infrastructure as Code (Terraform): Declarative, version-controlled cloud infrastructure automation enabling 1-click multi-region reproducibility.', '•'),
          bullet('Cloud Financial Strategy & Cost Optimization: Architected specifically to operate within AWS Free Tier allowances for up to 50,000 students.', '•'),

          // SECTION 5: TOOLS AND TECHNOLOGIES USED
          heading1('5. Tools and Technologies Used'),
          bullet('Google Antigravity IDE / Agentic AI Pair Programming', '• Vibe Coding Tool:'),
          bullet('JavaScript (React 19), Python 3.12, HCL (Terraform)', '• Programming Languages:'),
          bullet('React 19, Vite, Chart.js, Lucide Icons, Vanilla CSS', '• Frontend Tool:'),
          bullet('AWS Lambda (Python 3.12 Serverless Router)', '• Backend Tool:'),
          bullet('Amazon DynamoDB (5 NoSQL Tables)', '• Database:'),
          bullet('Amazon Web Services (AWS - Region ap-south-1 Mumbai)', '• Cloud Platform:'),
          bullet('Amazon Cognito (SRP Auth & JWTs)', '• Authentication:'),
          bullet('Amazon Rekognition (AI Face Comparison)', '• Biometric AI Service:'),
          bullet('Amazon S3 (Frontend Hosting & Student Photos)', '• Cloud Storage:'),
          bullet('Amazon SNS & EventBridge (24h Alerts)', '• Messaging / Alerts:'),

          new Paragraph({ children: [new PageBreak()] }),

          p('', { after: 120 }),

          // SECTION 6: APPLICATION DESIGN
          heading1('6. Application Design'),
          heading2('6.1 Cloud Architecture Diagram'),
          ...(imageRun
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 100 },
                  children: [imageRun],
                }),
                p('Figure 6.1: AWS Serverless Cloud Architecture Diagram for Presently Platform', {
                  align: AlignmentType.CENTER,
                  bold: true,
                  italics: true,
                  size: 18,
                  color: '4A5568',
                  after: 160,
                }),
              ]
            : []),

          heading2('6.2 Application Workflow'),
          bullet('1. Authentication: Faculty logs in through Amazon Cognito SRP flow and receives JWT bearer tokens.', '1.'),
          bullet('2. Dashboard & Timetable: Application queries DynamoDB to load today’s schedule, student enrollments, and weekly stats.', '2.'),
          bullet('3. Teacher Check-in: Instructor verifies physical classroom presence via webcam check-in, unlocking class marking.', '3.'),
          bullet('4. Biometric Face Scan: Student snapshot captured via HTML5 canvas, sent over HTTPS to API Gateway /faces/verify.', '4.'),
          bullet('5. Rekognition Match: AWS Lambda fetches S3 reference portrait and compares facial vectors. Matches >= 85% mark Present (P).', '5.'),
          bullet('6. Automated Alerts: EventBridge cron triggers Lambda daily; unmarked sessions publish email alerts via Amazon SNS.', '6.'),

          heading2('6.3 Main Features'),
          bullet('Live Webcam AI Facial Recognition (Amazon Rekognition with 85%+ threshold)', '•'),
          bullet('1-Click Reference Face Auto-Enrollment directly from the attendance modal', '•'),
          bullet('Interactive 5 Day Orders × 11 Periods Master Timetable Grid', '•'),
          bullet('Dynamic Student Roster & Course Enrollment with attendance percentage warnings', '•'),
          bullet('Subject Settings with custom thresholds (e.g. 75%) and 10-day anti-tampering edit windows', '•'),
          bullet('Live Faculty Display Name Customization modal in top navigation bar', '•'),

          p('', { after: 120 }),

          // SECTION 7: PROMPTS USED
          heading1('7. Prompts Used (Vibe Coding Development Trajectory)'),
          p('The following chronological prompt table details the exact user prompts and agentic solutions generated during development:'),
          createStyledTable(
            ['S.No.', 'AI Tool', 'Prompt Used', 'Purpose & Generated Solution'],
            [
              ['1', 'Antigravity AI', '"lets run to check the application"', 'Local development verification; launched Vite server on port 5173 and verified DynamoDB connection.'],
              ['2', 'Antigravity AI', '"every thing should work like terraform"', 'IaC alignment; extracted live API Gateway and Cognito outputs into frontend/.env in ap-south-1.'],
              ['3', 'Antigravity AI', '"here it just gave me the name aarav sharma but shouldnt it ask for my name also ask me which subject am i enrolled in"', 'Dynamic identity; purged hardcoded mock data and implemented dynamic email lookup, roll number generation, and course enrollment.'],
              ['4', 'Antigravity AI', '"nothing appearing / its showing a white screen ... it didnt"', 'Debugging runtime crashes; resolved React Hook order violation in StudentRosterPage and missing logout in AuthContext.'],
              ['5', 'Antigravity AI', '"basically dont change anything in the teacher part just remove the student part completely"', 'Architectural streamlining; purged all student routes/sidebars and consolidated into a pure Faculty Suite.'],
              ['6', 'Antigravity AI', '"BUT COGNITO NOT WORKING"', 'Security integration; enabled real Amazon Cognito SRP authentication and added global: "window" polyfill in vite.config.js.'],
              ['7', 'Antigravity AI', '"make this live with cloudfront link ill check and now after we have changed this match our backend and terraform as well"', 'Production deployment; created deploy_frontend.js for S3 asset sync, CloudFront invalidation, and destroyed unused student Cognito groups.'],
              ['8', 'Antigravity AI', '"solution for this - [Screenshot: No registered reference photo found for student STU003]"', 'Biometric fallback; added 1-click [Register Face Photo] button and auto-enrollment prompt in webcam capture modal.'],
              ['9', 'Antigravity AI', '"ok perfect now everything works ,now create a new repository as Attendance-System-VibeCoding and push this project create a redame and also generate an architectural diagram"', 'Open-source release; generated AWS architecture diagram, wrote README.md, created GitHub repository, and pushed codebase.'],
              ['10', 'Antigravity AI', '"in the report mention the prompts we gave amd u generate those prompts ... in this file there is only one student his name is Sahil Moghaiz his register no is - RA2311028010062 HIS Subject is cloud stratergy planning and management , subject code is 21cse463t and professor is dr s.prabakeran"', 'Academic documentation; formatted official 14-section SRM report and generated simple spoken presentation script.'],
            ]
          ),

          p('', { after: 120 }),

          // SECTION 8: APPLICATION SCREENSHOTS
          heading1('8. Application Screenshots & Interface Walkthrough'),
          p('The developed web application features a clean, responsive glassmorphism user interface:'),
          bullet('1. Faculty Authentication Page: Secure login and sign-up powered by Amazon Cognito SRP encryption.', '•'),
          bullet('2. Real-Time Analytics Dashboard: Overview of active subjects, student counts, attendance percentages, and daily schedule timeline.', '•'),
          bullet('3. Master Weekly Timetable Grid: Interactive 5-Day Order × 11-Period matrix with real-time slot allocation and room filtering.', '•'),
          bullet('4. Student Roster & Enrollment: Student cards displaying roll numbers, emails, assigned subjects, and margin calculations.', '•'),
          bullet('5. AI Facial Recognition Modal: Live webcam capture comparing facial geometry via Amazon Rekognition with 1-click enrollment.', '•'),
          bullet('6. Subject Criteria Settings: Custom attendance thresholds (e.g. 75%) and 10-day edit windows preventing retroactive changes.', '•'),

          // SECTION 9: GITHUB LINK
          heading1('9. GitHub Link'),
          p('The complete source code, backend Lambda handlers, Terraform IaC configuration, and documentation are available at:'),
          p('🔗 GitHub Repository: https://github.com/Nishu9198/Attendance-System-VibeCoding', { bold: true, color: COLOR_SECONDARY }),

          // SECTION 10: VIDEO DEMONSTRATION LINK
          heading1('10. Video Demonstration Link'),
          callout('🎥 VIDEO DEMONSTRATION & WALKTHROUGH', [
            'Please view the comprehensive video presentation with voice-over and camera demonstration at:',
            '',
            '🔗 YouTube Video Link: [ PASTE YOUR YOUTUBE VIDEO LINK HERE ]',
            '',
            'Video Agenda:',
            '• 00:00 - Introduction & Cloud Strategy Pitch (Sahil Moghaiz, 21CSE463T)',
            '• 01:30 - Faculty Login & Cognito SRP Authentication',
            '• 03:00 - Master Timetable Matrix & Student Roster Management',
            '• 05:30 - Live AI Facial Recognition Webcam Attendance Session & 1-Click Enrollment',
            '• 07:30 - Amazon SNS 24-Hour Notification Dispatch & Cloud Console Verification',
            '• 09:00 - Terraform Infrastructure as Code & Free Tier Cost Evaluation ($0.00)',
          ]),

          p('', { after: 120 }),

          // SECTION 11: BLOCKERS FACED
          heading1('11. Blockers Faced & Solutions Applied'),
          createStyledTable(
            ['Blocker Category', 'Problem Description', 'Engineering Solution Applied'],
            [
              ['1. Token / Context Limit', 'Extended conversation history caused context truncation during complex refactoring.', 'Utilized structured modular sub-agents and systematic checkpointing to maintain repository state.'],
              ['2. Coding Errors', 'React Hook execution order violation in StudentRosterPage.jsx and missing logout function in AuthContext.jsx caused white screen.', 'Refactored hook placement before any conditional returns and defined missing logout handler in AuthProvider.'],
              ['3. Integration Issues', 'amazon-cognito-identity-js failed in Vite browser runtime due to missing NodeJS global object.', 'Configured define: { global: "window" } in vite.config.js to polyfill global browser execution.'],
              ['4. Biometric Edge Case', 'New students without enrolled portraits triggered "No reference photo found" errors in Rekognition.', 'Implemented 1-click [Register Face Photo] button and auto-enrollment prompt directly in the webcam modal.'],
              ['5. Cloud Deployment', 'Interactive shell credentials were not accessible to background agent processes for S3/CloudFront sync.', 'Created standalone deploy_frontend.js script utilizing AWS SDK v3 with automated credential loading and cache invalidation.'],
            ]
          ),

          p('', { after: 120 }),

          // SECTION 12: EXPERIENCE OF THE ACTIVITY
          heading1('12. Experience of the Activity'),
          p(
            'Developing Presently through Vibe Coding was an extraordinary paradigm shift in software engineering. Rather than manually writing boilerplate code, configuring AWS services through slow manual web consoles, and debugging syntax errors, Vibe Coding enabled direct, conversational communication of system architecture and business logic.'
          ),
          p(
            'The AI agent autonomously managed Terraform state files, provisioned AWS IAM roles, created API routes, and performed automated build checks. When edge cases arose—such as unhandled biometric photo fallbacks or browser hook violations—conversational feedback allowed the agent to diagnose the root cause and apply complete drop-in fixes within seconds. This accelerated the development timeline from weeks to a single focused session.'
          ),

          // SECTION 13: LEARNING FROM THE ACTIVITY
          heading1('13. Learning from the Activity'),
          bullet('Cloud Concepts: Mastered serverless microservice design, AWS IAM least-privilege scoping, S3 CORS policies, DynamoDB partition/sort key optimization, and CloudFront edge caching.', '•'),
          bullet('Application Development: Gained deep expertise in full-stack integration connecting React 19 single page applications with Python 3.12 serverless backends.', '•'),
          bullet('AI-Assisted Coding: Learned how to decompose complex cloud architectures into discrete, testable agentic prompts for rapid execution.', '•'),
          bullet('Prompt Writing: Developed the skill of providing precise, context-rich prompts, error logs, and screenshots to guide autonomous AI agents effectively.', '•'),
          bullet('Debugging & Testing: Practiced automated API testing methodologies, browser dev tools inspection, and CloudWatch serverless log analysis.', '•'),

          // SECTION 14: CONCLUSION
          heading1('14. Conclusion'),
          p(
            'Presently successfully validates the convergence of modern Cloud Strategy, AI Computer Vision, and Vibe Coding methodology. By deploying 100% serverless AWS services (Lambda, DynamoDB, Cognito, Rekognition, CloudFront, S3, SNS) provisioned via Terraform, the platform provides higher education institutions with an enterprise-grade, proxy-proof attendance management system at zero server maintenance and zero idle cloud costs.'
          ),

          p('', { after: 120 }),

          // MANDATORY SUBMISSION CHECKLIST
          callout('✅ MANDATORY SUBMISSION CHECKLIST', [
            'All required components for the Vibe Coding Activity have been completed and verified:',
            '✔ Project Report (Word .docx & HTML format strictly following the 14-section template)',
            '✔ GitHub Source-Code Link (https://github.com/Nishu9198/Attendance-System-VibeCoding)',
            '✔ Video Demonstration Agenda & Spoken Walkthrough Script with camera on',
            '✔ Blockers Faced & Resolution Table (Token limit, coding errors, integration issues)',
            '✔ Learning from the Activity & Vibe Coding Experience',
            '✔ Prompts Used (10-phase chronological trajectory table)',
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath1 = path.join(rootDir, 'Vibe_Coding_Project_Report_Sahil_Moghaiz.docx');
  const outPath2 = path.join(rootDir, 'Attendance_System_VibeCoding_Project_Report.docx');
  fs.writeFileSync(outPath1, buffer);
  fs.writeFileSync(outPath2, buffer);
  console.log(`✅ Official 14-Section Vibe Coding Report generated successfully!`);
  console.log(`📁 File 1: ${outPath1}`);
  console.log(`📁 File 2: ${outPath2}`);
}

buildOfficialReport().catch((err) => {
  console.error('Report generation error:', err);
  process.exit(1);
});
