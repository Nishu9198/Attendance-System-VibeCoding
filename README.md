# AttendCloud - Cloud-Based Student Attendance System

A full-stack serverless attendance management system built on **AWS Free Tier** services, provisioned with **Terraform** (Infrastructure as Code).

## 🏗️ Architecture

| Component | Technology |
|:---|:---|
| **Frontend** | React + Vite (SPA) |
| **Authentication** | AWS Cognito |
| **API Layer** | AWS API Gateway (HTTP API) |
| **Backend** | AWS Lambda (Python 3.12) |
| **Database** | Amazon DynamoDB |
| **Storage** | Amazon S3 |
| **Infrastructure** | Terraform |

## 🚀 Features

- **Authentication**: Email-based sign-up/sign-in with AWS Cognito
- **Dashboard**: Real-time attendance analytics with charts
- **Student Management**: Full CRUD operations
- **Course Management**: Create courses and enroll students
- **Attendance Marking**: Toggle-based marking with webcam photo capture
- **Reports**: Per-course analytics, attendance rates, CSV export
- **Cloud Storage**: Student photos stored in S3
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Premium glassmorphism UI

## 📁 Project Structure

```
├── terraform/          # AWS Infrastructure as Code
│   ├── main.tf         # Provider configuration
│   ├── cognito.tf      # Authentication
│   ├── dynamodb.tf     # Database tables
│   ├── lambda.tf       # Serverless functions
│   ├── api_gateway.tf  # REST API
│   ├── s3.tf           # Storage buckets
│   └── outputs.tf      # Output values
├── backend/            # Lambda function code (Python)
│   └── handlers/       # API route handlers
├── frontend/           # React SPA
│   └── src/
│       ├── components/ # UI components
│       ├── services/   # API & Auth services
│       └── context/    # React context
└── scripts/            # Deploy & destroy scripts
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Terraform
- AWS CLI (configured with credentials)

### Local Development (Mock Mode)
```bash
cd frontend
npm install
npm run dev
```
The app runs in **mock mode** with sample data — no AWS credentials needed!

### Deploy to AWS
```bash
# Configure AWS credentials
aws configure

# Deploy everything
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Tear Down
```bash
chmod +x scripts/destroy.sh
./scripts/destroy.sh
```

## ☁️ AWS Free Tier Services

| Service | Type | Monthly Limit |
|:---|:---|:---|
| Lambda | Always Free | 1M requests |
| DynamoDB | Always Free | 25 GB + 25 RCU/WCU |
| Cognito | Always Free | 50,000 MAUs |
| S3 | 12-Month Free | 5 GB storage |
| API Gateway | 12-Month Free | 1M API calls |

## 👨‍💻 Tools & Technologies Used

- **Vibe Coding Tool**: Cursor AI / Claude
- **Programming Languages**: JavaScript (React), Python (Lambda)
- **Frontend**: React + Vite, Chart.js, Lucide Icons
- **Backend**: AWS Lambda, Python 3.12, boto3
- **Database**: Amazon DynamoDB (NoSQL)
- **Cloud Platform**: Amazon Web Services (AWS)
- **IaC**: Terraform by HashiCorp
