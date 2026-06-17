# 🌍 Voyager - AI Travel Planning Assistant

> **An intelligent travel companion powered by Google Gemini AI that helps you plan, organize, and optimize your perfect trip with real-time flight data, hotel recommendations, weather forecasts, and personalized day-by-day itineraries.**

**🚀 Live Demo**: [https://www.tiago-romero.com](https://www.tiago-romero.com) | **API**: [https://api.tiago-romero.com](https://api.tiago-romero.com)

[![Architecture](https://img.shields.io/badge/Architecture-Container--Based-blueviolet)](https://aws.amazon.com/ecs/)
[![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate%20%7C%20RDS%20%7C%20CloudFront-orange)](https://aws.amazon.com/)
[![Live](https://img.shields.io/badge/Live-tiago--romero.com-success)](https://www.tiago-romero.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/features/actions)

---

## ✨ Features

- 🤖 **Conversational AI Agent**: Powered by Gemini 2.5 Flash with function calling
- ✈️ **Real-Time Flight Search**: Live flight data via Google Flights (SerpAPI)
- 🏨 **Smart Hotel Recommendations**: Hotels with ratings, prices, and amenities via Google Hotels
- 🗓️ **Day-by-Day Itineraries**: Structured travel plans with activities and budgets
- 🌤️ **Weather Intelligence**: Historical and forecast data for your destinations
- 🎯 **Event Discovery**: Find local events, attractions, and experiences
- 💰 **Budget Planning**: Track costs across flights, hotels, and activities
- 🔐 **Secure Authentication**: AWS Cognito with passwordless magic links
- 📊 **Trip Management**: Save, organize, and export your travel plans
- 💬 **Streaming Responses**: Real-time chat with Server-Sent Events (SSE)

---

## 🏗️ Tech Stack

### Backend

| Component           | Technology                 | Purpose                          |
| ------------------- | -------------------------- | -------------------------------- |
| **Runtime**         | Python 3.12                | Core language                    |
| **Framework**       | FastAPI                    | Modern async web framework       |
| **AI Engine**       | Google Gemini 2.5 Flash    | Function calling & chat          |
| **APIs**            | SerpAPI, Open-Meteo        | Flights, hotels, weather, events |
| **Database**        | PostgreSQL 17              | Raw SQL (no ORM)                 |
| **Connection Pool** | psycopg2                   | Efficient DB connections         |
| **Deployment**      | Docker → ECR → ECS Fargate | Containerized service            |

### Frontend

| Component      | Technology              | Purpose                      |
| -------------- | ----------------------- | ---------------------------- |
| **Framework**  | React 19.2 + TypeScript | UI library                   |
| **Build Tool** | Vite 8                  | Fast dev & build             |
| **Styling**    | Tailwind CSS 3.4        | Utility-first CSS            |
| **State**      | Zustand 5               | Lightweight state management |
| **Routing**    | React Router 7          | Client-side routing          |
| **Deployment** | S3 + CloudFront         | Static hosting + CDN         |

### Infrastructure

| Component         | Technology                     | Purpose                       |
| ----------------- | ------------------------------ | ----------------------------- |
| **IaC**           | Terraform 1.5+                 | Infrastructure as code        |
| **Compute**       | ECS Fargate (0.25 vCPU, 512MB) | Containerized backend         |
| **Load Balancer** | Application Load Balancer      | HTTPS routing + health checks |
| **Database**      | RDS PostgreSQL (t4g.micro)     | Relational storage            |
| **Storage**       | S3                             | Frontend + exports            |
| **CDN**           | CloudFront + ACM               | Global CDN + SSL              |
| **DNS**           | Custom domain (Squarespace)    | tiago-romero.com              |
| **Auth**          | Cognito User Pools             | User management               |
| **Secrets**       | Secrets Manager                | API keys + DB credentials     |
| **Monitoring**    | CloudWatch + SNS               | Logs, metrics & alarms        |
| **CI/CD**         | GitHub Actions                 | Automated deployments         |
| **State**         | S3 + DynamoDB                  | Terraform remote state        |

**💰 Cost Optimization:**

- No NAT Gateway (~$30/month saved)
- ECS Fargate with minimal resources (0.25 vCPU)
- RDS t4g.micro ARM64 instance (burstable performance)
- CloudFront with ACM SSL certificates (free)
- **Total: ~$30/month (RDS: ~$15, ECS: ~$8, ALB: ~$7)**

---

## 📁 Project Structure

```
voyager/
├── backend/                    # Python FastAPI backend
│   ├── src/
│   │   ├── agent/             # 🤖 AI agent orchestration
│   │   │   ├── loop.py        # Gemini function calling loop
│   │   │   ├── tools.py       # Tool definitions & execution
│   │   │   └── prompts.py     # System prompts
│   │   ├── api/               # 🚪 FastAPI route handlers
│   │   │   ├── chat.py        # SSE streaming chat
│   │   │   ├── trips.py       # Trip CRUD operations
│   │   │   ├── itinerary.py   # Itinerary management
│   │   │   └── export.py      # PDF/JSON exports
│   │   ├── db/                # 🗄️ Database layer (raw SQL)
│   │   │   ├── postgres.py    # Connection pool + queries
│   │   │   └── memory_store.py # In-memory cache
│   │   ├── tools/             # 🔧 13 specialized tools
│   │   │   ├── flights.py     # SerpAPI flight search (Google Flights)
│   │   │   ├── hotels.py      # SerpAPI hotel search (Google Hotels)
│   │   │   ├── weather.py     # Open-Meteo weather
│   │   │   ├── events.py      # SerpAPI event search
│   │   │   ├── attractions.py # SerpAPI attractions
│   │   │   ├── itinerary.py   # Itinerary CRUD
│   │   │   ├── budget.py      # Budget calculations
│   │   │   ├── dates.py       # Date utilities
│   │   │   └── visa.py        # Visa requirements
│   │   ├── local/             # 🏠 Local development server
│   │   │   └── server.py      # Local development entry
│   │   ├── main.py            # FastAPI application
│   │   ├── config.py          # Environment config
│   │   ├── auth.py            # Cognito JWT validation
│   │   └── exceptions.py      # Error handling
│   ├── sql/                   # 📜 Database schema
│   │   ├── schema.sql         # Table definitions
│   │   ├── procedures.sql     # Stored procedures
│   │   └── migrate.py         # Migration script
│   ├── Dockerfile             # Container image for ECS Fargate
│   └── pyproject.toml         # Python dependencies (uv)
│
├── frontend/                   # ⚛️ React TypeScript frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── chat/          # Chat interface + sidebar
│   │   │   ├── dashboard/     # Trip dashboard + cards
│   │   │   ├── forms/         # Trip creation form
│   │   │   ├── layout/        # App layout + navigation
│   │   │   └── ui/            # Reusable UI primitives
│   │   ├── pages/             # Route pages
│   │   │   ├── Dashboard.tsx  # Trip list
│   │   │   ├── Library.tsx    # Saved trips
│   │   │   ├── Home.tsx       # Landing page
│   │   │   └── SignIn.tsx     # Authentication
│   │   ├── api/               # API client layer
│   │   │   └── client.ts      # Fetch wrapper + types
│   │   ├── store/             # Zustand state management
│   │   │   └── useStore.ts    # Global app state
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # TypeScript definitions
│   │   └── data/              # Static data (locations)
│   ├── public/                # Static assets
│   ├── index.html             # Entry HTML
│   ├── vite.config.ts         # Vite configuration
│   └── package.json           # Node dependencies
│
├── terraform/                  # 🏗️ Infrastructure as Code
│   ├── main.tf                # Provider configuration
│   ├── ecs.tf                 # ECS Fargate cluster + service
│   ├── alb.tf                 # Application Load Balancer
│   ├── dns.tf                 # ACM certificates
│   ├── rds.tf                 # PostgreSQL database
│   ├── s3.tf                  # S3 buckets (frontend + exports)
│   ├── cloudfront.tf          # CloudFront distribution
│   ├── cognito.tf             # User pool + client
│   ├── iam.tf                 # IAM roles + policies
│   ├── secrets.tf             # Secrets Manager
│   ├── cloudwatch.tf          # Log groups
│   ├── alarms.tf              # CloudWatch alarms
│   ├── ecr.tf                 # Container registry
│   ├── locals.tf              # Local variables
│   ├── variables.tf           # Input variables
│   ├── outputs.tf             # Output values
│   ├── terraform.tfvars       # Default values
│   ├── backend.hcl            # Remote state config
│   └── scripts/               # Helper scripts
│       ├── bootstrap.sh       # One-time backend setup
│       └── init-secrets.sh    # Populate secrets
│
├── .github/workflows/          # 🔄 CI/CD pipelines
│   ├── deploy.yml             # Main orchestrator
│   ├── infrastructure.yml     # Terraform + backend
│   ├── frontend.yml           # React build + S3
│   ├── destroy.yml            # Teardown workflow
│   ├── pr-checks.yml          # PR validation
│   └── README.md              # Workflow documentation
│
├── docs/                       # 📚 Documentation
│   ├── DEPLOYMENT.md          # Full deployment guide
│   └── AWS_DEPLOYMENT_FROM_ZERO.md
│
├── scripts/                    # 🛠️ Development scripts
│   ├── init-local.ps1         # Windows/PowerShell setup
│   └── init-wsl.sh            # WSL/Linux setup
│
├── docker-compose.yml         # Local development stack
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

**Required:**

- ✅ **Docker Desktop** (with WSL2 integration on Windows)
- ✅ **Node.js** 20+ and npm
- ✅ **Python** 3.12+
- ✅ **AWS Account** (for cloud deployment)
- ✅ **Terraform** 1.5+ (for infrastructure provisioning)

**API Keys** (get these first):

- 🔑 [**Gemini API Key**](https://aistudio.google.com/apikey) - Free tier available
- 🔑 [**SerpAPI Key**](https://serpapi.com/) - For flights, hotels, events, and attractions

---

### Local Development

#### Option 1: Automated Setup (Windows)

```powershell
# From PowerShell (run as administrator)
.\scripts\init-local.ps1
```

This script will:

1. Launch WSL2
2. Create `.env.local` with your API keys
3. Start Docker Compose (backend + frontend + PostgreSQL)
4. Open browser to http://localhost:5173

#### Option 2: Manual Setup

1. **Create `.env.local`** in project root:

```bash
# AI & APIs
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here

# Local development
LOCAL_USER_ID=00000000-0000-0000-0000-000000000001
DATABASE_URL=postgresql://voyager:voyager@postgres:5432/voyager

# Database (for docker-compose)
POSTGRES_USER=voyager
POSTGRES_PASSWORD=voyager
POSTGRES_DB=voyager
```

2. **Start services with Docker Compose**:

```bash
docker-compose up --build
```

3. **Access the application**:
   - 🌐 **Frontend**: http://localhost:5173
   - 🚪 **API**: http://localhost:4000
   - 🗄️ **PostgreSQL**: localhost:5432 (user: `voyager`, password: `voyager`, db: `voyager`)

4. **Verify setup**:

   ```bash
   # Check API health
   curl http://localhost:4000/health

   # Check database
   docker exec -it voyager-postgres psql -U voyager -d voyager -c "\dt"
   ```

---

### Cloud Deployment

**Full deployment guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

#### Quick Deploy Steps

**1. Configure AWS Credentials**

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)
```

**2. Bootstrap Terraform Backend** (one-time setup)

```bash
cd terraform
bash scripts/bootstrap.sh
# Creates S3 bucket + DynamoDB table for state management
```

**3. Initialize Secrets in AWS Secrets Manager**

```bash
# Populate API keys
bash scripts/init-secrets.sh

# Or manually:
aws secretsmanager create-secret \
  --name voyager-prod/gemini-api-key \
  --secret-string "your_gemini_key"

aws secretsmanager create-secret \
  --name voyager-prod/serpapi-api-key \
  --secret-string "your_serpapi_key"
```

**4. Deploy Infrastructure**

```bash
cd terraform
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
# Approve with 'yes' when prompted (~5-10 minutes)
```

**5. Get Your Application URLs**

```bash
terraform output alb_url          # Backend API
terraform output cloudfront_url   # Frontend CDN
terraform output app_url          # Custom domain (if configured)
# Example: https://api.tiago-romero.com, https://www.tiago-romero.com
```

**6. Configure Custom Domain** (Optional)

- Set `domain_name` in `terraform.tfvars` (e.g., `"tiago-romero.com"`)
- Run `terraform apply` to create ACM certificates
- Add CNAME validation records to your DNS provider
- Add final CNAME records: `api` → ALB, `www` → CloudFront

**6. Configure GitHub Actions** (Optional - for automated deployments)

1. Setup AWS OIDC authentication (see [.github/workflows/README.md](.github/workflows/README.md))
2. Add `AWS_ROLE_ARN` to GitHub Secrets
3. Push to `main` branch → automatic deployment! 🚀

**7. Deploy Backend to ECS** (Manual deployment)

```bash
# Build Docker image for linux/amd64
cd backend
docker build --platform linux/amd64 -t 298984097344.dkr.ecr.us-east-1.amazonaws.com/voyager-prod-lambda:ecs-latest -f Dockerfile .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 298984097344.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push 298984097344.dkr.ecr.us-east-1.amazonaws.com/voyager-prod-lambda:ecs-latest

# Force ECS to pull new image
aws ecs update-service --cluster voyager-prod-cluster --service voyager-prod-api --force-new-deployment
```

**8. Deploy Frontend to CloudFront**

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://voyager-prod-frontend-298984097344/ --delete
aws cloudfront create-invalidation --distribution-id <YOUR_DISTRIBUTION_ID> --paths "/*"
```

---

## 🔧 Development

---

## 🏛️ Architecture

### Infrastructure Diagram

```mermaid
graph TB
    subgraph "Client"
        User[👤 User Browser]
    end

    subgraph "Custom Domain"
        Domain[🌐 tiago-romero.com<br/>www.tiago-romero.com<br/>api.tiago-romero.com]
    end

    subgraph "AWS CloudFront + S3"
        CF[☁️ CloudFront CDN<br/>ACM SSL Certificate]
        S3Frontend[📦 S3 Bucket<br/>React SPA]
        CF --> S3Frontend
    end

    subgraph "AWS Application Load Balancer"
        ALB[⚖️ ALB<br/>HTTPS:443<br/>ACM SSL Certificate]
    end

    subgraph "AWS Cognito"
        Cognito[🔐 Cognito User Pool<br/>Magic Link Auth]
    end

    subgraph "AWS ECS Fargate"
        ECS[🐳 ECS Service<br/>FastAPI Container<br/>0.25 vCPU, 512MB<br/>Port 8000]
    end

    subgraph "AWS RDS"
        RDS[(🗄️ PostgreSQL 17<br/>db.t4g.micro ARM64<br/>20GB GP3 Storage)]
    end

    subgraph "AWS Secrets Manager"
        Secrets[🔑 Secrets Manager<br/>API Keys + DB Password]
    end

    subgraph "External APIs"
        Gemini[🤖 Google Gemini 2.5 Flash]
        SerpAPI[🔍 SerpAPI<br/>Flights, Hotels, Events]
        Weather[🌤️ Open-Meteo<br/>Weather Data]
    end

    subgraph "Monitoring"
        CW[📊 CloudWatch Logs + Alarms]
        SNS[📧 SNS Topic<br/>Email Alerts]
    end

    User -->|HTTPS| Domain
    Domain -->|www| CF
    Domain -->|api| ALB

    ALB -->|Health Check| ECS
    ALB -->|Forward| ECS

    ECS -->|JWT Validation| Cognito
    ECS -->|SQL Queries| RDS
    ECS -->|Get Secrets| Secrets
    ECS -->|AI Requests| Gemini
    ECS -->|Search Flights/Hotels/Events| SerpAPI
    ECS -->|Weather Forecast| Weather

    ECS -->|Logs| CW
    CW -->|Threshold Breach| SNS
    SNS -->|Email| User

    style CF fill:#FF9900
    style S3Frontend fill:#FF9900
    style ALB fill:#FF4F8B
    style ECS fill:#FF9900
    style RDS fill:#527FFF
    style Cognito fill:#DD344C
    style Secrets fill:#DD344C
    style CW fill:#FF4F8B
    style SNS fill:#FF4F8B
    style Gemini fill:#4285F4
    style SerpAPI fill:#805AD5
    style Weather fill:#48BB78
    style Domain fill:#00D9FF
```

### Request Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CF as ☁️ CloudFront
    participant ALB as ⚖️ ALB
    participant Auth as 🔐 Cognito
    participant ECS as 🐳 ECS Fargate
    participant DB as 🗄️ PostgreSQL
    participant AI as 🤖 Gemini AI
    participant Ext as 🌐 External APIs

    U->>CF: 1. Load React App (www.tiago-romero.com)
    CF-->>U: Return SPA

    U->>ALB: 2. POST /auth/magic-link (api.tiago-romero.com)
    ALB->>ECS: Forward request
    ECS->>Auth: Request code
    Auth-->>U: Send email with code

    U->>ALB: 3. GET /auth/verify?token=...
    ALB->>ECS: Forward request
    ECS->>Auth: Validate token
    Auth-->>ECS: JWT Token
    ECS-->>ALB: Return JWT
    ALB-->>U: Return JWT

    U->>ALB: 4. POST /trips/{id}/chat (JWT)
    ALB->>ECS: Forward with headers
    ECS->>Auth: Validate JWT
    Auth-->>ECS: User verified
    ECS->>DB: Save user message

    ECS->>AI: Send conversation + tools
    AI-->>ECS: Function calls (search_flights, etc.)

    loop For each tool
        Lambda->>Ext: Call API (SerpAPI, Open-Meteo, etc.)
        Ext-->>Lambda: Return data
        Lambda->>DB: Store results
    end

    Lambda->>AI: Send function results
    AI-->>ECS: Final response
    ECS->>DB: Save AI message
    ECS-->>ALB: Stream response (SSE)
    ALB-->>U: Stream response
```

### Design Rationale

**Why ECS Fargate over Lambda?**

The backend uses **Server-Sent Events (SSE)** for streaming AI chat responses, which requires persistent HTTP connections. ECS Fargate is better suited for this because:

- ✅ **No timeout limits**: Lambda has a 15-minute max, SSE connections can stay open indefinitely
- ✅ **Native HTTP/2 support**: ALB handles SSE streaming natively without workarounds
- ✅ **Stateful connections**: Fargate maintains connection state across streaming chunks
- ✅ **Simpler architecture**: No need for API Gateway buffering or Lambda response streaming hacks

**Cost Trade-off**: ECS (~$8/month) + ALB (~$7/month) vs Lambda (~$1-2/month). The improved developer experience and native SSE support justify the ~$13/month premium.

### AI Agent Architecture

The core intelligence comes from **Google Gemini 2.5 Flash** with **13 specialized tools**:

| Tool                      | Purpose                    | API        |
| ------------------------- | -------------------------- | ---------- |
| `search_flights`          | Find flights with prices   | SerpAPI    |
| `search_hotels`           | Find hotels with ratings   | SerpAPI    |
| `get_weather_forecast`    | Weather predictions        | Open-Meteo |
| `get_historical_weather`  | Past weather patterns      | Open-Meteo |
| `search_events`           | Local events & attractions | SerpAPI    |
| `search_attractions`      | Tourist spots & activities | SerpAPI    |
| `calculate_budget`        | Cost estimation            | Internal   |
| `save_itinerary`          | Store travel plan          | PostgreSQL |
| `get_itinerary`           | Retrieve saved plan        | PostgreSQL |
| `check_visa_requirements` | Visa rules                 | SerpAPI    |
| `calculate_travel_dates`  | Date calculations          | Internal   |
| `update_trip_status`      | Status management          | PostgreSQL |
| `create_day_plan`         | Daily schedule             | Internal   |

**Execution Model**: All tools run **synchronously** within the API Lambda (no distributed workers). Gemini decides which tools to call, Lambda executes them, and results flow back to generate the final response.

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE trips (
    trip_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT,
    status VARCHAR(50),
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    message_id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    role VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itineraries table
CREATE TABLE itineraries (
    itinerary_id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    version INTEGER,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

See [backend/sql/schema.sql](backend/sql/schema.sql) for complete schema with indexes and triggers.

## API Endpoints

- `POST /trips` - Create new trip
- `GET /trips` - List user's trips
- `GET /trips/{id}` - Get trip details
- `DELETE /trips/{id}` - Delete trip
- `POST /trips/{id}/chat` - Chat with agent (SSE stream)
- `GET /trips/{id}/messages` - Get messages (polling)
- `GET /trips/{id}/itinerary` - Get latest itinerary
- `GET /export/{id}` - Export trip as Markdown

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test` (frontend), `pytest` (backend)
5. Submit a pull request

All PRs run automated checks (lint, type check, build) via GitHub Actions.

## License

MIT License - see LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ using Gemini, SerpAPI, and AWS**
