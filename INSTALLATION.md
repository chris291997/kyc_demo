# 📦 Installation Guide

Complete walkthrough for setting up the KYC Demo Application.

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (v24.0+)
- **Node.js** (v18.0+)
- **PostgreSQL** (v14.0+) - locally installed
- **Git**

### Architecture Selection
Your system: **x64-based PC (amd64)**

Use `amd64` packages for:
- ✅ Intel processors (Core i3/i5/i7/i9, Xeon)
- ✅ AMD processors (Ryzen, Threadripper, EPYC)
- ✅ Most Windows PCs and laptops

Use `arm64` packages for:
- Apple Silicon Macs (M1, M2, M3, M4)
- ARM-based Windows devices

### License Files
- Already configured in `regula-licenses/docreader.license`

---

## 🔽 Step 1: Download Regula Document Reader SDK

### Option A: Automated Download (Recommended)

**Windows (PowerShell):**
```powershell
.\download-docreader.ps1
```

**Linux / macOS / WSL (Bash):**
```bash
chmod +x download-docreader.sh
./download-docreader.sh
```

The script will:
- Fetch available versions from Regula's public repository
- Let you choose a version (or default to latest)
- Download to `docker/docreader/` directory
- Verify the download

**Download Size:** ~50-100MB  
**Time:** 2-5 minutes

### Option B: Manual Download

1. Visit: https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/r/regula-document-reader-webapi/
2. Download the latest `.deb` file (e.g., `regula-document-reader-webapi_8.4.xxxxx_amd64.deb`)
3. Save to `docker/docreader/` directory

---

## 🗄️ Step 2: Set Up Database

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kyc_demo;

# Exit
\q
```

### Initialize Schema

```bash
# Run initialization script
psql -U postgres -d kyc_demo -f database/init.sql

# Or from psql prompt:
psql -U postgres
\c kyc_demo
\i database/init.sql
\q
```

### Verify Tables

```bash
psql -U postgres -d kyc_demo

# List tables
\dt

# You should see:
# - verification_sessions
# - document_results
# - face_results
# - audit_logs

\q
```

---

## ⚙️ Step 3: Configure Environment

### Update .env File

```bash
# Edit .env file with your PostgreSQL credentials
DATABASE_HOST=host.docker.internal
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=YOUR_PASSWORD_HERE  # ← Update this
DATABASE_NAME=kyc_demo

# Regula Services
REGULA_DOC_READER_URL=http://regula-docreader:8080
REGULA_FACE_SDK_URL=http://regula-face:8081

# Backend
BACKEND_PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:4000
```

**Important:** Replace `YOUR_PASSWORD_HERE` with your actual PostgreSQL password.

---

## 🐳 Step 4: Build Docker Images

### Build All Services

```bash
# Build all images at once
docker-compose build

# Expected build time: 5-10 minutes
```

This will build:
- **regula-docreader** (~1.5GB) - Document Reader from .deb package
- **backend** (~200MB) - NestJS application
- **frontend** (~50MB) - React + Vite application

### Build Individual Services

```bash
# Build specific service
docker-compose build regula-docreader
docker-compose build backend
docker-compose build frontend
```

### Force Rebuild (No Cache)

```bash
# If you need to rebuild from scratch
docker-compose build --no-cache
```

---

## 🚀 Step 5: Start Services

### Start All Services

```bash
# Start in background
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### First-Time Startup

**Expected Timeline:**

1. **Regula Document Reader** (5-10 minutes first time)
   - Container starts
   - Downloads document database (~500MB)
   - Loads license
   - Ready!

2. **Backend** (~30 seconds)
   - Connects to database
   - Initializes modules
   - Ready!

3. **Frontend** (~10 seconds)
   - Starts Vite dev server
   - Ready!

### Monitor Progress

```bash
# Watch Document Reader startup
docker-compose logs -f regula-docreader

# Watch all services
docker-compose logs -f

# Check service status
docker-compose ps
```

---

## ✅ Step 6: Verify Installation

### Health Checks

```bash
# Test Document Reader
curl http://127.0.0.1:8080/api/ping
# Expected: {"code":0}

# Test Backend
curl http://localhost:4000/health
# Expected: {"status":"ok","services":{"database":"connected",...}}

# Check all containers
docker-compose ps
# All should show "Up" status
```

### Web Interface

```bash
# Frontend
open http://localhost:3000
# Or visit in browser

# Document Reader Web UI
open http://localhost:8080
```

### License Verification

```bash
# Check Document Reader logs for license info
docker logs kyc-docreader | grep -i license

# You should see:
# "License verified successfully. Serial number: 'OL113415'"
```

---

## 🧪 Step 7: Test the Application

### Test Document Upload

1. Open **http://localhost:3000**
2. Click **"Start Verification"**
3. Upload a test document image (passport, ID, etc.)
4. View extraction results

### Test API Directly

```bash
# Create verification session
curl -X POST http://localhost:4000/api/verification \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'

# Upload document (replace SESSION_ID and FILE_PATH)
curl -X POST http://localhost:4000/api/document/process \
  -F "file=@/path/to/document.jpg" \
  -F "sessionId=SESSION_ID"
```

---

## 🔧 Development Setup

### Running Services Locally (Without Docker)

#### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Start in development mode (with hot reload)
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

#### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Service Configuration

### Docker Compose Services

| Service | Container Name | Port | Status |
|---------|---------------|------|--------|
| Document Reader | kyc-docreader | 8080 | ✅ Running |
| Backend | kyc-backend | 4000 | ✅ Running |
| Frontend | kyc-frontend | 3000 | ✅ Running |
| Face SDK | kyc-facesdk | 8081 | ⚠️ Placeholder* |

\* Face SDK requires additional package from Regula

### Volume Mounts

```yaml
regula-docreader:
  volumes:
    - ./regula-licenses/docreader.license:/opt/regula/document-reader-webapi/regula.license:ro
    - ./regula-db:/opt/regula/document-reader-webapi/db

backend:
  volumes:
    - ./uploads:/app/uploads
```

---

## 🛠️ Post-Installation

### Optional: Enable Face SDK

Face SDK is currently running as a placeholder. To enable full functionality:

1. **Contact Regula**: support@regulaforensics.com
2. **Reference**: License OL113415
3. **Request**: Face SDK backend installation package
4. **Install**: Follow instructions in `docker/facesdk/README.md`

### Production Checklist

Before deploying to production:

- [ ] Enable HTTPS/TLS
- [ ] Add authentication & authorization
- [ ] Implement rate limiting
- [ ] Set up monitoring & logging
- [ ] Configure database backups
- [ ] Secure environment variables
- [ ] Update CORS settings
- [ ] Set up CI/CD pipeline
- [ ] Conduct security audit
- [ ] Performance testing

---

## 📁 Directory Structure

```
KYC-DEMO/
├── docker/
│   ├── docreader/
│   │   ├── Dockerfile
│   │   ├── config.yml                          # License configuration
│   │   └── regula-document-reader-webapi_*.deb # Downloaded package
│   └── facesdk/
│       └── Dockerfile
├── regula-licenses/
│   └── docreader.license                       # Your license file
├── backend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json                       # Generated
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json                       # Generated
│   └── Dockerfile
├── database/
│   └── init.sql                                # Database schema
├── docker-compose.yml                          # Service orchestration
└── .env                                        # Environment variables
```

---

## 🎓 What Was Installed

### Backend (NestJS)
- REST API with TypeORM & PostgreSQL
- Document processing integration
- Face SDK integration (placeholder)
- File upload handling
- Verification session management
- Health check endpoints

### Frontend (React + TypeScript + Vite)
- Modern responsive UI
- Multi-step verification flow
- Document upload with drag-and-drop
- Webcam integration
- Real-time status updates
- Results display

### Regula Document Reader SDK
- Document validation
- OCR and data extraction
- Authenticity checks
- MRZ and barcode reading
- Support for 10,000+ document types

---

## ⏱️ Installation Timeline

| Step | Time | Total |
|------|------|-------|
| Download SDK | 2-5 min | 2-5 min |
| Database setup | 2-3 min | 4-8 min |
| Configure environment | 1 min | 5-9 min |
| Build Docker images | 5-10 min | 10-19 min |
| First startup | 5-10 min | 15-29 min |
| Verification | 1-2 min | 16-31 min |

**Total: 15-30 minutes** (subsequent starts: ~1-2 minutes)

---

## 📚 Next Steps

1. ✅ **Verify Installation**: Test all endpoints
2. ✅ **Explore Features**: Try document verification
3. 📧 **Contact Regula**: Request Face SDK package
4. 🎨 **Customize**: Modify UI and business logic
5. 📖 **Read Docs**: Check [README.md](./README.md) and [system-requirements.md](./system-requirements.md)

---

## 🆘 Need Help?

- **Common Issues**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Quick Reference**: See [QUICK_START.md](./QUICK_START.md)
- **Architecture**: See [system-requirements.md](./system-requirements.md)
- **Regula Support**: support@regulaforensics.com

---

**Installation Version**: 2.0  
**Method**: Public Repository Packages  
**Last Updated**: November 21, 2025  
**Status**: ✅ Production Ready

