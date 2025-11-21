# Fuse Finance - Document Processing MVP

> AI-powered document classification and data extraction system for loan origination workflows with intelligent confidence scoring and adaptive learning.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PNPM** ([Install](https://pnpm.io/installation)) or npm/yarn
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd challenge-fuse

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key
```

### Configuration

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
```

### Database Setup

```bash
# Initialize the database with schema and migrations
pnpm db:migrate
```

### Run the Application

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What You Get

This MVP provides a complete document processing pipeline:

| Feature | Description |
|---------|-------------|
| **Document Classification** | Auto-detect document types using GPT-4o Vision (Bank Statements, Government IDs, W-9, COI, Articles of Incorporation) |
| **Data Extraction** | Extract structured JSON data matching type-specific schemas with field-level confidence scores |
| **Confidence Scoring** | Multi-level confidence (classification + extraction + field-level) with configurable thresholds |
| **Human-in-the-Loop** | Review and correct low-confidence documents through an intuitive UI |
| **Analytics Dashboard** | Real-time metrics: accuracy, precision, recall, latency, costs, confidence distributions |
| **Learning Loop** | System learns from corrections and improves future predictions |

### Supported Document Types

- Bank Statements (Checking)
- Government IDs (Driver License/Passport)
- W-9 Forms (US Tax)
- Certificates of Insurance (COI)
- Articles/Certificate of Incorporation
- Unknown/Invalid documents

---

## Tech Stack

**Frontend**
- Next.js 16.0 (App Router) + React 18.3
- TypeScript 5
- Tailwind CSS 4.0
- Radix UI Components
- Recharts (Analytics)
- react-pdf (PDF Viewer)

**Backend**
- Next.js API Routes
- SQLite 3 (better-sqlite3)
- OpenAI GPT-4o Vision
- Pino Logger (with PII masking)

**Development**
- Jest + React Testing Library
- ESLint + TypeScript ESLint
- Husky + lint-staged

---

## Available Scripts

```bash
# Development
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm lint             # Run ESLint

# Database
pnpm db:migrate       # Run database migrations
pnpm db:reset         # Reset database (⚠️ WARNING: deletes all data)
```

---

## Project Structure

```
challenge-fuse/
├── app/                          # Next.js App Router
│   ├── api/                      # REST API routes
│   │   ├── documents/            # Document upload, process, correct
│   │   ├── metrics/              # Analytics endpoints
│   │   └── settings/             # Configuration endpoints
│   ├── page.tsx                  # Home page
│   ├── dashboard/                # Analytics dashboard
│   ├── documents/                # Document list & viewer
│   ├── settings/                 # Configuration UI
│   └── upload/                   # Upload interface
│
├── backend/
│   ├── application/              # Use Cases (ProcessDocument, CorrectDocument, etc.)
│   ├── domain/                   # Business Logic (Entities, Value Objects, Services)
│   │   ├── entities/             # Document, Extraction, Correction
│   │   ├── schemas/              # JSON schemas per document type
│   │   └── services/             # Confidence calculation & calibration
│   └── infrastructure/           # External Services & Persistence
│       ├── external-services/    # OpenAI integration
│       ├── persistence/          # SQLite repositories
│       ├── logger/               # Pino with PII masking
│       └── di/                   # Dependency injection container
│
├── frontend/
│   ├── components/ui/            # Reusable UI components
│   ├── features/                 # Feature modules (upload, documents, dashboard, settings)
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utility libraries
│
├── data/                         # Data directory (auto-created)
│   ├── uploads/                  # Uploaded PDFs
│   ├── database.db               # SQLite database
│   └── corrections.jsonl         # Corrections log
│
├── scripts/                      # Database scripts
└── tests/                        # Test files
```

---

## API Reference

### Documents

#### Upload Document
```http
POST /api/documents
Content-Type: multipart/form-data

Body:
  file: <PDF file>

Response: 201 Created
{
  "id": "uuid",
  "filename": "document.pdf",
  "status": "uploaded"
}
```

#### Process Document
```http
POST /api/documents/:id/process

Response: 200 OK
{
  "id": "uuid",
  "type": "bank-statement",
  "classificationConfidence": 0.95,
  "status": "approved",
  "extractedFields": { ... }
}
```

#### Get Document
```http
GET /api/documents/:id

Response: 200 OK
{
  "id": "uuid",
  "filename": "document.pdf",
  "type": "bank-statement",
  "status": "approved",
  "classificationConfidence": 0.95,
  "extractionConfidence": 0.88,
  "extractedFields": { ... }
}
```

#### Submit Corrections
```http
POST /api/documents/:id/correct
Content-Type: application/json

Body:
{
  "correctedType": "bank-statement",
  "correctedFields": {
    "account_holder_name": "John Doe",
    "account_number_masked": "****1234"
  }
}

Response: 200 OK
{
  "message": "Corrections saved successfully"
}
```

### Metrics

#### Get Metrics
```http
GET /api/metrics

Response: 200 OK
{
  "classification": {
    "accuracy": 0.92,
    "byType": { ... }
  },
  "extraction": {
    "overallConfidence": 0.87
  },
  "operations": {
    "avgLatency": 2.5,
    "p95Latency": 4.2
  }
}
```

### Settings

#### Get Settings
```http
GET /api/settings

Response: 200 OK
{
  "thresholds": {
    "bank-statement": 0.80,
    "government-id": 0.85
  },
  "maxFileSize": 10485760
}
```

#### Update Thresholds
```http
PUT /api/settings/thresholds
Content-Type: application/json

Body:
{
  "thresholds": {
    "bank-statement": 0.80,
    "government-id": 0.85
  }
}

Response: 200 OK
```

---

## Usage Guide

### 1. Upload Documents

Navigate to **Upload** page → Drag & drop PDF files or click to browse

### 2. Automatic Processing

Documents are automatically:
- Classified into one of 6 supported types
- Extracted according to type-specific schema
- Scored for confidence at multiple levels
- Routed to auto-approve or review queue

### 3. Review & Correct

Low-confidence documents appear in the review queue:
1. Click on a document to open the viewer
2. Review predicted type and extracted fields
3. Check confidence indicators (color-coded)
4. Edit fields or change document type
5. Click "Save Corrections"

### 4. Monitor Performance

Navigate to **Dashboard** to view:
- Classification accuracy per document type
- Confidence score distributions
- Processing latency (p50/p95)
- Estimated costs per document
- Learning loop impact

### 5. Configure Thresholds

Navigate to **Settings** to adjust confidence thresholds:
- Lower threshold = more auto-approvals (faster, higher risk)
- Higher threshold = more reviews (slower, higher accuracy)

---

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Linting & Type Checking

```bash
# Run ESLint
pnpm lint

# Type check (runs automatically in lint-staged)
tsc --noEmit
```

### Pre-commit Hooks

Husky automatically runs on commit:
- ESLint with auto-fix
- TypeScript type checking

---

## Architecture

### Clean Architecture (3-Layer Design)

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  Upload | Viewer | Dashboard | ...  │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│     Application Layer (Use Cases)   │
│  ProcessDocument | CorrectDocument  │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│    Domain Layer (Business Logic)    │
│  Entities | Services | Schemas      │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  Infrastructure (External Services) │
│  OpenAI | SQLite | File Storage     │
└─────────────────────────────────────┘
```

### Data Flow

```
PDF Upload → Classification (GPT-4o Vision)
                    ▼
            Extraction (GPT-4o)
                    ▼
            Schema Validation
                    ▼
            Confidence Check
                    ▼
        ┌───────────┴───────────┐
        ▼                       ▼
  Auto-Approve          Review Queue
  (high confidence)     (low confidence)
                              ▼
                        Human Correction
                              ▼
                        Learning Loop Update
                              ▼
                        Metrics Recalculation
```

### Design Patterns

- **Clean Architecture**: Clear separation of concerns across layers
- **Repository Pattern**: Abstract data access
- **Dependency Injection**: Centralized service wiring
- **Domain-Driven Design**: Rich domain entities with business logic
- **Use Case Pattern**: Application layer orchestrates business logic

---

## Document Schemas

### Bank Statement (Checking)
```json
{
  "account_holder_name": "string",
  "account_number_masked": "string",
  "statement_start_date": "YYYY-MM-DD",
  "statement_end_date": "YYYY-MM-DD",
  "starting_balance": "number",
  "ending_balance": "number"
}
```

### Government ID (Driver License or Passport)
```json
{
  "full_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "id_number": "string",
  "address": "string",
  "expiration_date": "YYYY-MM-DD"
}
```

### W-9 (US Tax Form)
```json
{
  "legal_name": "string",
  "ein_or_ssn": "string",
  "business_address": "string",
  "tax_classification": "string",
  "signature_present": "boolean"
}
```

### Certificate of Insurance (COI)
```json
{
  "insured_name": "string",
  "policy_number": "string",
  "policy_effective_date": "YYYY-MM-DD",
  "policy_expiration_date": "YYYY-MM-DD",
  "coverage_types": ["string"]
}
```

### Articles/Certificate of Incorporation
```json
{
  "entity_legal_name": "string",
  "state": "string",
  "file_number": "string",
  "filing_date": "YYYY-MM-DD"
}
```

---

## Confidence Scoring

### Classification Confidence
- Source: GPT-4o Vision analysis
- Range: [0, 1]
- Default threshold: 0.70-0.90 (configurable)

### Extraction Confidence
- Base confidence from LLM
- Calibrated using schema validation
- Formula: `base × schema_score × critical_fields_score`

### Field-Level Confidence
- Individual confidence per extracted field
- Considers: OCR quality, format validation, value plausibility
- Used for UI highlighting of uncertain fields

---

## Learning Loop

The system continuously improves through corrections:

1. **Correction Storage**
   - Persisted to SQLite `corrections` table
   - Logged to `corrections.jsonl` for analysis

2. **Example Retrieval**
   - Retrieve past corrections for document type
   - Select recent examples as few-shot context

3. **Prompt Enhancement**
   - Append corrected examples to prompts
   - Guide model with domain-specific corrections

4. **Validation Rules**
   - Derive regex patterns from corrections
   - Validate against historical patterns

5. **Measurable Impact**
   - Track accuracy improvements
   - Monitor confidence score changes
   - Display learning metrics in dashboard

---

## Troubleshooting

### Database Issues

**Problem**: Database file not found
```bash
# Solution: Run migrations
pnpm db:migrate
```

**Problem**: Database locked
```bash
# Solution: Reset database (⚠️ deletes all data)
pnpm db:reset
pnpm db:migrate
```

### OpenAI API Issues

**Problem**: API key not configured
```bash
# Solution: Check .env.local file
echo $OPENAI_API_KEY  # Should output your key
```

**Problem**: Rate limit errors
- Wait a few minutes and retry
- Consider upgrading OpenAI plan

### Upload Issues

**Problem**: File too large
- Max size: 10MB (configurable in settings)
- Compress PDF before upload

**Problem**: Unsupported file type
- Only PDF files are supported

---

## Security & Privacy

### PII Masking
Sensitive data is automatically masked in logs:
- API keys: `sk-...` → `sk-****...`
- Account numbers: `1234567890` → `****7890`
- SSNs/EINs: `123-45-6789` → `***-**-6789`

### Best Practices
- Never commit `.env.local` to version control
- Rotate API keys regularly
- Use `.env.example` as template
- Review logs before sharing

---

## Known Limitations

1. **Single-threaded Processing**: Documents processed sequentially
2. **Local Storage**: Files stored locally (not cloud-ready)
3. **SQLite Concurrency**: Limited for high-volume scenarios
4. **No Document Versioning**: Single version per document
5. **Basic OCR**: Relies on OpenAI Vision only
6. **Manual Schema Updates**: Adding types requires code changes

---

## Scaling Beyond MVP (Phase 2)

### Reliability
- **Database Migration**: Move from SQLite to PostgreSQL for production workloads
  - Better concurrency handling (thousands of concurrent writes)
  - Advanced indexing for faster queries
  - Replication for high availability
- **Error Handling**: Implement circuit breakers for OpenAI API calls
  - Prevent cascade failures when external services are down
  - Graceful degradation with cached responses
- **Monitoring**: Add comprehensive error tracking (Sentry/DataDog)
  - Real-time alerting for failures
  - Distributed tracing for debugging

### Throughput
- **Background Processing**: Implement job queue (Bull/BullMQ with Redis)
  - Process documents asynchronously
  - Handle 100+ concurrent uploads
  - Retry failed jobs with exponential backoff
- **Horizontal Scaling**: Containerize with Docker + Kubernetes
  - Auto-scale based on queue depth
  - Load balancing across multiple instances
- **Caching**: Add Redis for frequently accessed data
  - Cache document classifications
  - Cache extraction results for duplicate documents

### Cost Optimization
- **Smart Routing**: Only use GPT-4o Vision when necessary
  - Use cheaper models for simple documents
  - Cache similar document extractions
- **Batch Processing**: Group OpenAI API calls to reduce costs
  - Process multiple pages in single requests
  - Combine classification + extraction when possible
- **Storage**: Move to S3/GCS for file storage
  - Lifecycle policies to archive old documents
  - CloudFront/CDN for faster access

### Guardrails
- **Rate Limiting**: Protect against abuse and runaway costs
  - Per-user upload limits
  - API rate limiting (req/min, req/hour)
- **Input Validation**: Stricter file validation
  - Virus scanning for uploads
  - Content-type verification beyond extension
  - Maximum page count limits
- **Security**: Enhanced authentication & authorization
  - Role-based access control (RBAC)
  - Audit logging for all operations
  - Data encryption at rest and in transit
- **Cost Monitoring**: Real-time cost tracking and alerts
  - Daily/monthly budget alerts
  - Automatic throttling when approaching limits

---

## License

Proprietary - Fuse Finance Case Study

---

**Built with**: Next.js 16 • React 18 • TypeScript 5 • OpenAI GPT-4o Vision • SQLite • Tailwind CSS

**Architecture**: Clean Architecture with Domain-Driven Design principles