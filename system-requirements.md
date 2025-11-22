# System Requirements - Regula KYC Demo Application

## Overview

This document outlines the complete requirements for building a KYC demo application integrating Regula's Document Reader SDK and Face SDK capabilities, including document validation, face liveness check, and face matching.

## Technology Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL (locally installed)
- **Containerization**: Docker & Docker Compose
- **Regula SDKs**: Document Reader SDK & Face SDK (Docker containers)

---

## Infrastructure Components

### 1. Regula Services (Docker)

#### Document Reader SDK Web Service
- **Minimum Requirements**: 1 CPU, 3.5 GB RAM per worker
- **Docker Image**: `regulaforensics/docreader:latest`
- **Port**: 8080
- **Required**: License file
- **Purpose**: Validate identity documents, extract data, verify authenticity

#### Face SDK Web Service
- **Minimum Requirements**: 1 CPU, 4.5 GB RAM per worker (CPU mode)
- **GPU Support**: Optional (3.5 GB GPU Memory additional) - provides 8-25x performance boost
- **Docker Image**: `regulaforensics/facesdk:latest`
- **Port**: 8081
- **Required**: License file
- **Purpose**: Face liveness detection, face matching/comparison

### 2. Application Stack

#### Backend (NestJS)
- **Memory**: ~512 MB RAM
- **Port**: 4000
- **Purpose**: REST API, orchestration, business logic

#### Frontend (React + Vite)
- **Deployment**: Build artifacts served via Nginx or Vite dev server
- **Port**: 3000
- **Purpose**: User interface for document upload, camera capture, results display

#### Database (PostgreSQL)
- **Installation**: Existing local installation
- **Port**: 5432
- **Purpose**: Store verification sessions, results, metadata

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│          React + TypeScript + Vite (Port 3000)              │
│  - Document upload UI                                       │
│  - Camera capture for liveness                              │
│  - Face match interface                                     │
│  - Results visualization                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                          │
│                      Port 4000                               │
│  - REST API endpoints                                       │
│  - Regula SDK integration                                   │
│  - Business logic & validation                              │
│  - Session management                                       │
└─────┬──────────────┬──────────────┬────────────────────────┘
      │              │              │
      │              │              │ PostgreSQL connection
      │              │              ▼
      │              │         ┌─────────────────┐
      │              │         │   PostgreSQL    │
      │              │         │  (Local Install)│
      │              │         │   Port 5432     │
      │              │         └─────────────────┘
      │              │
      │ HTTP         │ HTTP
      ▼              ▼
┌──────────────┐  ┌──────────────────┐
│  Document    │  │    Face SDK      │
│  Reader SDK  │  │   Web Service    │
│ Port 8080    │  │   Port 8081      │
│  (Docker)    │  │    (Docker)      │
└──────────────┘  └──────────────────┘
```

---

## Required Licenses & Credentials

You will need from Regula Forensics:

1. **Document Reader SDK License File**
2. **Face SDK License File**
3. **Docker Registry Credentials** (to pull official images)

Contact: [Regula Forensics](https://regulaforensics.com/)

---

## Backend (NestJS) Specifications

### Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── document/
│   │   │   ├── document.controller.ts   # Upload & validate documents
│   │   │   ├── document.service.ts      # Communicate with Regula Document Reader
│   │   │   └── document.dto.ts
│   │   ├── face/
│   │   │   ├── face.controller.ts       # Liveness & match endpoints
│   │   │   ├── face.service.ts          # Communicate with Regula Face SDK
│   │   │   └── face.dto.ts
│   │   ├── verification/
│   │   │   ├── verification.controller.ts
│   │   │   ├── verification.service.ts  # Orchestrate full KYC flow
│   │   │   └── verification.entity.ts
│   │   └── storage/
│   │       └── storage.service.ts       # Handle file uploads (images)
│   ├── config/
│   │   └── regula.config.ts             # Regula SDK endpoints
│   └── database/
│       └── typeorm.config.ts
├── uploads/                              # Temporary file storage
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Key Dependencies

```json
{
  "@nestjs/common": "^10.x",
  "@nestjs/core": "^10.x",
  "@nestjs/platform-express": "^10.x",
  "@nestjs/typeorm": "^10.x",
  "@nestjs/config": "^3.x",
  "typeorm": "^0.3.x",
  "pg": "^8.x",
  "axios": "^1.x",
  "multer": "^1.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "uuid": "^9.x"
}
```

### Core Functionalities

#### 1. Document Module
- **POST** `/api/document/upload` - Upload document image
- **POST** `/api/document/process` - Process document with Regula Document Reader
- **GET** `/api/document/:sessionId` - Get document verification results

#### 2. Face Module
- **POST** `/api/face/liveness` - Perform liveness check
- **POST** `/api/face/match` - Match selfie with document face
- **GET** `/api/face/:sessionId` - Get face verification results

#### 3. Verification Module
- **POST** `/api/verification/session` - Create new verification session
- **GET** `/api/verification/:sessionId` - Get complete verification status
- **GET** `/api/verification/:sessionId/report` - Generate verification report

---

## Frontend (React + TypeScript) Specifications

### Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── DocumentUpload.tsx       # Step 1: Upload ID document
│   │   ├── LivenessCheck.tsx        # Step 2: Face liveness verification
│   │   ├── FaceMatch.tsx            # Step 3: Match face with document
│   │   └── Results.tsx              # Display verification results
│   ├── components/
│   │   ├── CameraCapture.tsx        # Webcam integration
│   │   ├── DocumentPreview.tsx
│   │   ├── UploadZone.tsx
│   │   ├── VerificationStatus.tsx
│   │   └── ProgressSteps.tsx
│   ├── services/
│   │   └── api.ts                   # Axios client for backend
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── useDocumentUpload.ts
│   │   └── useVerification.ts
│   ├── types/
│   │   └── regula.types.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── Dockerfile
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Key Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "axios": "^1.x",
  "react-webcam": "^7.x",
  "@tanstack/react-query": "^5.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x"
}
```

### User Flow

1. **Document Upload** - User uploads government-issued ID (passport, driver's license, etc.)
2. **Document Processing** - Backend validates document authenticity and extracts data
3. **Liveness Check** - User performs live face capture via webcam
4. **Face Matching** - System compares selfie with document photo
5. **Results Display** - Show verification status, extracted data, confidence scores

---

## Database Schema (PostgreSQL)

### Tables

#### 1. verification_sessions

```sql
CREATE TABLE verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, failed
  document_verified BOOLEAN DEFAULT FALSE,
  liveness_passed BOOLEAN DEFAULT FALSE,
  face_matched BOOLEAN DEFAULT FALSE,
  match_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_status ON verification_sessions(status);
CREATE INDEX idx_verification_created ON verification_sessions(created_at DESC);
```

#### 2. document_results

```sql
CREATE TABLE document_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES verification_sessions(id) ON DELETE CASCADE,
  document_type VARCHAR(100),
  document_number VARCHAR(100),
  full_name VARCHAR(255),
  date_of_birth DATE,
  expiry_date DATE,
  nationality VARCHAR(3),
  issuing_country VARCHAR(3),
  face_image_path VARCHAR(500),
  document_image_path VARCHAR(500),
  authenticity_status VARCHAR(50),
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_session ON document_results(session_id);
```

#### 3. face_results

```sql
CREATE TABLE face_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES verification_sessions(id) ON DELETE CASCADE,
  liveness_status VARCHAR(50), -- genuine, spoof, unknown
  liveness_score DECIMAL(5,2),
  match_status VARCHAR(50), -- matched, not_matched, unknown
  match_score DECIMAL(5,2),
  selfie_image_path VARCHAR(500),
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_face_session ON face_results(session_id);
```

---

## Environment Variables

### Backend (.env)

```env
# Database Configuration
DATABASE_HOST=host.docker.internal  # Access host machine from Docker
DATABASE_PORT=5432
DATABASE_USER=your_postgres_user
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=kyc_demo

# Regula Services
REGULA_DOC_READER_URL=http://regula-docreader:8080
REGULA_FACE_SDK_URL=http://regula-face:8081

# Storage
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Server Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Security (Optional)
JWT_SECRET=your-secret-key-here
SESSION_TIMEOUT=3600  # 1 hour in seconds
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:4000
VITE_MAX_FILE_SIZE=10485760
VITE_SUPPORTED_FORMATS=image/jpeg,image/png,image/jpg
```

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  regula-docreader:
    image: regulaforensics/docreader:latest
    container_name: kyc-docreader
    ports:
      - "8080:8080"
    volumes:
      - ./regula-licenses/docreader.license:/app/extBin/unix_x64/regula.license:ro
      - ./regula-db:/app/extBin/unix_x64/db
    environment:
      - workers=2
      - REGULA.License.License=/app/extBin/unix_x64/regula.license
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    
  regula-face:
    image: regulaforensics/facesdk:latest
    container_name: kyc-facesdk
    ports:
      - "8081:8080"
    volumes:
      - ./regula-licenses/facesdk.license:/app/facesdk.license:ro
      - ./face-storage:/app/storage
    environment:
      - workers=2
      - license.file=/app/facesdk.license
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kyc-backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_HOST=host.docker.internal
      - DATABASE_PORT=5432
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - REGULA_DOC_READER_URL=http://regula-docreader:8080
      - REGULA_FACE_SDK_URL=http://regula-face:8081
      - PORT=4000
      - NODE_ENV=development
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - ./backend/src:/app/src
      - ./backend/uploads:/app/uploads
      - /app/node_modules
    depends_on:
      regula-docreader:
        condition: service_healthy
      regula-face:
        condition: service_healthy
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: kyc-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:4000
    volumes:
      - ./frontend/src:/app/src
      - /app/node_modules
    depends_on:
      - backend
    restart: unless-stopped

networks:
  default:
    name: kyc-network
```

---

## Performance Considerations

### Document Reader SDK

| Instance Type | CPU/RAM | Workers | Throughput |
|--------------|---------|---------|------------|
| Basic | 1 CPU / 3.5GB | 1 | Low |
| Recommended | 2 CPU / 8GB | 2 | Medium |
| High-Load | 4 CPU / 16GB | 4 | High |

### Face SDK

**CPU Mode:**

| Instance Type | CPU/RAM | Workers | RPS (Match) |
|--------------|---------|---------|-------------|
| c5.xlarge | 4 CPU / 8GB | 2 | 1.1 |
| c7a.2xlarge | 8 CPU / 16GB | 2 | 2.0 |

**GPU Mode (Recommended for Production):**

| Instance Type | GPU Memory | Workers | RPS (Match) |
|--------------|------------|---------|-------------|
| g4dn.xlarge | 16GB | 5 | 17.1 |
| g5.xlarge | 24GB | 7 | 27.6 |

**Note**: GPU provides 8-25x performance improvement over CPU for face operations.

### Scaling Formula

```
Worker count = target throughput × latency

Example: 15 requests/sec × 0.8 sec latency = 12 workers needed
```

---

## Security Requirements

### 1. API Security
- CORS configuration for frontend origin
- Rate limiting on endpoints
- Input validation and sanitization
- File type and size validation

### 2. Data Protection
- Encrypt sensitive data at rest (optional for demo)
- Use HTTPS in production
- Secure license file storage
- Clean up uploaded files after processing

### 3. Access Control
- Session-based or JWT authentication (optional for demo)
- Unique session IDs for verification flows
- Timeout inactive sessions

---

## Development Prerequisites

### Required Software

1. **Docker Desktop** (v24.0+)
2. **Node.js** (v18.0+ or v20.0+)
3. **PostgreSQL** (v14.0+) - locally installed
4. **Git**
5. **Code Editor** (VS Code recommended)

### Required Access

1. **Regula Forensics Account** with SDK licenses
2. **Docker Registry Access** for pulling Regula images

---

## Hardware Requirements

### Development Machine

- **CPU**: 4 cores minimum (8 cores recommended)
- **RAM**: 16 GB minimum (32 GB recommended)
- **Storage**: 10 GB free space
- **OS**: Windows 10/11, macOS, or Linux

### Docker Resources

Configure Docker Desktop with:
- **CPUs**: 4
- **Memory**: 8 GB
- **Swap**: 2 GB
- **Disk Image**: 60 GB

---

## API Endpoints Summary

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/document/upload` | Upload document image |
| POST | `/api/document/process` | Process with Regula |
| GET | `/api/document/:sessionId` | Get results |

### Face Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/face/liveness` | Liveness check |
| POST | `/api/face/match` | Face matching |
| GET | `/api/face/:sessionId` | Get results |

### Verification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/session` | Create session |
| GET | `/api/verification/:sessionId` | Get status |
| GET | `/api/verification/:sessionId/report` | Get report |

---

## Testing Strategy

### Unit Tests
- Service layer logic
- Utility functions
- Data transformations

### Integration Tests
- API endpoint testing
- Regula SDK integration
- Database operations

### E2E Tests
- Complete verification flow
- UI interactions
- Error scenarios

---

## Monitoring & Logging

### Backend Logging
- Request/response logging
- Regula SDK API calls
- Error tracking
- Performance metrics

### Health Checks
- Database connectivity
- Regula services availability
- Disk space monitoring
- Memory usage

---

## References

### Official Documentation

1. **Document Reader SDK**
   - [High-Load Installation Guide](https://docs.regulaforensics.com/develop/doc-reader-sdk/web-service/administration/performance-optimization/constructing-installation/)
   - [Web Service Documentation](https://docs.regulaforensics.com/develop/doc-reader-sdk/web-service/)

2. **Face SDK**
   - [Performance Guide](https://docs.regulaforensics.com/develop/face-sdk/web-service/administration/performance-guide/constructing-installation/)
   - [Performance Results](https://docs.regulaforensics.com/develop/face-sdk/web-service/administration/performance-guide/reference-numbers/)
   - [Web Service Documentation](https://docs.regulaforensics.com/develop/face-sdk/web-service/)

3. **Regula Forensics**
   - [Main Website](https://regulaforensics.com/)
   - [Developer Portal](https://docs.regulaforensics.com/)

---

## Next Steps

After reviewing this document:

1. **Obtain Regula licenses** and Docker registry credentials
2. **Set up local PostgreSQL** database and create schema
3. **Configure Docker environment** and verify resources
4. **Implement backend** (NestJS) with Regula integration
5. **Build frontend** (React + TypeScript) with camera support
6. **Test complete flow** and optimize performance
7. **Deploy** to production environment (optional)

---

**Document Version**: 1.0  
**Last Updated**: November 21, 2025  
**Author**: KYC Demo Project Team

