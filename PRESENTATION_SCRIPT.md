# 🎙️ Video Demonstration & Presentation Script: Presently AI Attendance Platform

**Project Title:** Presently: An AWS Serverless AI Facial Recognition Attendance and Classroom Management Platform  
**Course & Code:** Cloud Strategy Planning and Management (21CSE463T)  
**Presenter / Student:** Sahil Moghaiz (Reg. No: `RA2311028010062`)  
**Faculty Guide / Supervisor:** Dr. S. Prabakeran (Professor, Department of Networking and Communication, SRMIST)  
**Live URL:** [https://d1yszng57r6fz7.cloudfront.net](https://d1yszng57r6fz7.cloudfront.net)

---

## ⏱️ Quick Summary Timing Guide (~8 to 10 Minutes Total)

| Section | Timeline | Screen Action |
| :--- | :--- | :--- |
| **1. Introduction & Cloud Strategy** | 0:00 – 1:15 | Welcome slide / Browser tab at login page |
| **2. Secure Faculty Authentication** | 1:15 – 2:00 | Login screen with AWS Cognito SRP |
| **3. Faculty Dashboard Overview** | 2:00 – 2:45 | Dashboard with analytics & today's schedule |
| **4. Master Weekly Timetable Grid** | 2:45 – 3:45 | 5 Day Orders × 11 Periods interactive matrix |
| **5. Student Roster & Enrollment** | 3:45 – 4:45 | Student cards, roll numbers, subject bindings |
| **6. Subject Criteria & Edit Windows** | 4:45 – 5:30 | Subject settings, thresholds, tamper-proof windows |
| **7. AI Face Recognition Session** | 5:30 – 7:15 | **The Core Demo!** Webcam scan + Rekognition |
| **8. Amazon SNS Notification Alerts** | 7:15 – 8:00 | In-app alert badge & 24h unmarked class trigger |
| **9. Profile Customization & Sign Out** | 8:00 – 8:45 | Display Name modal + Sign out |
| **10. Conclusion & Architectural Summary** | 8:45 – 9:30 | Architecture diagram & AWS Free Tier cost ($0.00) |

---

## 🎬 Step-by-Step Spoken Script & Screen Actions

---

### 📍 Segment 1: Introduction & Cloud Strategy (0:00 - 1:15)

**🖥️ What to show on screen:**
- Start with the clean web browser open at `https://d1yszng57r6fz7.cloudfront.net`.
- Show your face on webcam (if recording video) or your opening title slide.

**🗣️ What to say:**
> *"Hello everyone and welcome! My name is **Sahil Moghaiz**, Registration Number **RA2311028010062**, from the Department of Networking and Communication, SRM Institute of Science and Technology.*
>
> *Today, I am proud to present my project titled **'Presently: An AWS Serverless AI Facial Recognition Attendance and Classroom Management Platform for Higher Education'**, developed under the mentorship of **Dr. S. Prabakeran** for the course **Cloud Strategy Planning and Management (21CSE463T)**.*
>
> *In traditional universities, manual roll calls consume up to 15 minutes per lecture and are prone to proxy attendance. On the other hand, physical biometric fingerprint or RFID machines require expensive hardware, create doorway bottlenecks, and frequently break down.*
>
> *Our Cloud Strategy with **Presently** is to completely eliminate hardware costs by utilizing **AWS Serverless infrastructure** and browser-native computer vision. By combining **Amazon Rekognition**, **AWS Lambda**, **Amazon DynamoDB**, **Amazon Cognito**, and **Amazon CloudFront**, we achieve a proxy-proof, enterprise-scale attendance platform that operates at **zero server idle costs** on the **AWS Free Tier**!*
>
> *Let's jump into the live application walkthrough!"*

---

### 📍 Segment 2: Faculty Login & Cognito SRP Authentication (1:15 - 2:00)

**🖥️ What to show on screen:**
- Show the login card on `https://d1yszng57r6fz7.cloudfront.net`.
- Point out the clean faculty interface.
- Click **"Demo Login (Dr. Nishchal)"** or enter faculty email (`teacher@university.edu`) and password.
- Click **"Sign In to Faculty Portal"**.

**🗣️ What to say:**
> *"Here on the landing page, we have our dedicated Faculty Authentication Portal. Security is a primary cloud pillar, so user authentication is handled by **Amazon Cognito User Pools**.*
>
> *Cognito implements the **Secure Remote Password (SRP)** protocol, ensuring faculty passwords never travel in plain text across the network. Upon successful authentication, Cognito returns cryptographic **JSON Web Tokens (JWTs)**—including Identity and Access Tokens—which securely sign all downstream API Gateway requests.*
>
> *Let's click Sign In and enter the Faculty Dashboard."*

---

### 📍 Segment 3: Faculty Dashboard Overview (2:00 - 2:45)

**🖥️ What to show on screen:**
- You are now on the **Dashboard** (`/`).
- Point to the Top Stat Cards (Total Subjects, Total Students, Average Attendance Rate, Today's Classes).
- Point to the **"Today's Schedule & Period Timeline"** and the **"Weekly Attendance Trend Chart"**.

**🗣️ What to say:**
> *"Upon logging in, the faculty is greeted with the **Presently Faculty Dashboard**.*
>
> *In the top row, we see real-time institutional metrics pulled directly from **Amazon DynamoDB** via our **AWS Lambda** microservices. We can see our active subjects, enrolled student count, average department attendance, and today's upcoming lectures.*
>
> *Below, we have an interactive period timeline showing the active class order and a weekly attendance trend chart showing attendance health across our courses.*
>
> *Now, let's navigate to the Weekly Master Timetable."*

---

### 📍 Segment 4: Master Weekly Timetable Grid Matrix (2:45 - 3:45)

**🖥️ What to show on screen:**
- Click **"Timetable"** on the left sidebar (`/timetable`).
- Hover over the **5 Day Orders × 11 Periods** timetable grid.
- Click on any slot (e.g. Day 1, Period 2) to show the edit slot modal or subject assignment details (Room Number, Building, Subject).

**🗣️ What to say:**
> *"Universities operate on complex cyclical schedules. Presently features a comprehensive **Master Timetable Grid Matrix**, supporting **5 Day Orders and up to 11 academic periods per day**.*
>
> *Every grid cell binds a specific subject code, section, classroom number, and building location. All timetable configurations are persisted in our DynamoDB `attendance-system-timetable` table with sub-10 millisecond query performance.*
>
> *Faculty can easily reassign rooms, update schedules, or click directly on an active period to launch the biometric attendance session.*
>
> *Next, let's look at how students are managed in the Student Roster."*

---

### 📍 Segment 5: Student Roster & Dynamic Course Enrollment (3:45 - 4:45)

**🖥️ What to show on screen:**
- Click **"Student Roster"** on the left sidebar (`/roster`).
- Show the student cards with their names, roll numbers, emails, and enrolled subjects.
- Click **"+ Add Student"** button to briefly show the enrollment modal.
- Point out the attendance percentage badges (Green for `> 75%`, Red for `< 75%` shortage).

**🗣️ What to say:**
> *"In the **Student Roster** section, faculty have complete control over student profiles and course enrollments.*
>
> *Each student profile stores their official registration number, university email, department, and section. Crucially, students are dynamically enrolled into specific subjects—meaning teachers only track students registered for their respective courses.*
>
> *The system automatically computes the student's current attendance percentage and margin calculations in real time, alerting faculty if a student is nearing the mandatory 75% threshold.*
>
> *Let's check the Subject & Criteria Settings."*

---

### 📍 Segment 6: Subject Criteria & Tamper-Proof Edit Windows (4:45 - 5:30)

**🖥️ What to show on screen:**
- Click **"Subject Settings"** on the left sidebar (`/subject-settings`).
- Show the subject cards (e.g., *Cloud Computing CSC302J*, *Database Systems CS204*).
- Point out the **Attendance Threshold (e.g. 75%)** and **Edit Window Days (10 Days)** controls.

**🗣️ What to say:**
> *"In **Subject Settings**, institutions can enforce regulatory compliance policies.*
>
> *Here, faculty can customize the minimum attendance threshold percentage—such as 75% or 80%—as well as the **Edit Window** (set to 10 days).*
>
> *The Edit Window is a key governance feature: it prevents retroactive tampering or altering of attendance records after the designated grace period has elapsed, ensuring auditable integrity.*
>
> *Now, let's demonstrate the core highlight of Presently: the **AI Facial Recognition Attendance Session**!"*

---

### 📍 Segment 7: AI Facial Recognition Attendance Session (5:30 - 7:15)

**🖥️ What to show on screen:**
- Click **"Mark Attendance"** on the left sidebar (`/attendance`).
- Select a subject (e.g. *Cloud Computing CSC302J*), date, and period.
- **Step A (Teacher Check-in):** Click **"Camera Check-in"** at the top. The webcam opens. Click **"Verify Teacher Attendance"**. Show the verification confirmation unlocking student marking.
- **Step B (Student AI Face Match):** Click the camera icon next to any student (e.g. *Rahul Kumar*). The live webcam modal opens.
- Click **"Register Face Photo"** or **"Capture & Match Face"**.
- Watch the live scan verify against Amazon Rekognition and instantly mark the student **Present (P)** with confidence score!

**🗣️ What to say:**
> *"This is the heart of the Presently platform: the **AI Biometric Facial Verification Engine**.*
>
> *First, as a security safeguard, faculty perform a quick **Teacher Check-in Verification** using their webcam. This confirms the authorized instructor is physically present in the lecture room and unlocks student marking for the active period.*
>
> *Now, let's mark a student using computer vision! When I click the camera icon next to a student, our HTML5 video stream captures a high-resolution snapshot.*
>
> *When we capture the face, the image is base64-encoded and sent over HTTPS to our AWS API Gateway, triggering an AWS Lambda function.*
>
> *Lambda invokes **Amazon Rekognition** to detect face liveness and compares the facial geometry against the student's enrolled reference portrait in **Amazon S3**.*
>
> *If the match exceeds our **85% confidence similarity threshold**, the student is instantly marked **Present (P)** and the timestamped audit log is saved in DynamoDB.*
>
> *Notice that if a student is having their photo taken for the first time, our system features an automatic **1-Click Reference Registration** button, which enrolls their face into S3 in under 1 second without any manual configuration!*
>
> *This completely eliminates proxy attendance and takes less than 300 milliseconds per student!"*

---

### 📍 Segment 8: Automated 24-Hour Notifications via Amazon SNS (7:15 - 8:00)

**🖥️ What to show on screen:**
- Point to the notification bell icon in the top header.
- Click on it to show the notification badge dropdown.
- Point out the **"Unmarked Class Alert"** and mention the **Amazon SNS / EventBridge** integration.

**🗣️ What to say:**
> *"Another critical requirement in academic management is timely record-keeping.*
>
> *Presently integrates with **Amazon Simple Notification Service (SNS)** and **Amazon EventBridge**.*
>
> *EventBridge executes an automated daily cron job inspecting our timetable schedule. If any scheduled class remains unmarked after 24 hours, AWS Lambda automatically publishes an urgent alert payload to our Amazon SNS Topic (`attendance-system-attendance-reminders`).*
>
> *Faculty receive instant email notifications with direct links to complete the session, ensuring zero lost academic records."*

---

### 📍 Segment 9: Profile Customization & Secure Sign Out (8:00 - 8:45)

**🖥️ What to show on screen:**
- In the top navigation bar, click on the **Edit Profile / Name** icon next to the faculty name.
- Type a new display name (e.g. `Prof. Sahil Moghaiz`) and click **Save**. Notice the name updates instantly across the header and dashboard.
- Finally, click the **Logout / Sign Out** button on the bottom of the left sidebar.
- Show the browser returning securely to the Login landing page.

**🗣️ What to say:**
> *"Faculty can also personalize their account in real time using the **Edit Display Name** modal in the top header bar.*
>
> *When we update our profile, the local state and session sync instantly across the entire application.*
>
> *When faculty finish their session, clicking **Sign Out** immediately invalidates the active Cognito JWT session tokens and returns the browser safely to the authentication gateway."*

---

### 📍 Segment 10: Conclusion & Cloud Strategy Highlights (8:45 - 9:30)

**🖥️ What to show on screen:**
- Switch to the **AWS Architecture Diagram** (`docs/aws_architecture_diagram.png` or your report).
- Show the GitHub Repository link: `https://github.com/Nishu9198/Attendance-System-VibeCoding`.

**🗣️ What to say:**
> *"To conclude our presentation, let's review the core Cloud Strategy achievements of Presently:*
>
> *1. **Zero Infrastructure Idle Costs:** By deploying 100% serverless services—Lambda, DynamoDB on-demand, Cognito, and CloudFront—the system operates completely free under the AWS Free Tier for up to 50,000 students.*
> *2. **Hardware Elimination:** No physical RFID scanners or fingerprint terminals required—any standard laptop or tablet webcam serves as an AI biometric scanner.*
> *3. **Infrastructure as Code (IaC):** The entire AWS cloud environment is provisioned with Terraform, enabling 1-click automated deployments.*
>
> *All project code, Terraform scripts, and academic documentation are publicly available on GitHub at **`Nishu9198/Attendance-System-VibeCoding`**.*
>
> *I want to express my sincere thanks to my guide, **Dr. S. Prabakeran**, and the Department of Networking and Communication at SRM Institute of Science and Technology for their guidance.*
>
> *Thank you very much for your time, and I welcome any questions!"*

---

## 💡 Quick Tips for Your Video Recording:
1. **Resolution:** Record your screen at 1080p (1920×1080) in full-screen browser mode (`F11` or View ➔ Enter Full Screen).
2. **Webcam Light:** Ensure good lighting on your face so the camera capture demo in Step 7 shows a clear, bright picture.
3. **Pace:** Speak clearly at a natural, confident pace. You can pause between sections if needed and edit them together.
4. **Cloud Console (Optional Bonus):** If you want an extra 30 seconds of showcase, you can briefly tab into your AWS CloudFront or DynamoDB console to show the live resources in `ap-south-1`!
