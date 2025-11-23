# KYC Demo Application with Regula Integration

A complete Know Your Customer (KYC) verification system integrating Regula Forensics' Document Reader SDK and Face SDK for identity document validation, face liveness detection, and face matching.

## 🚀 Quick Start

```bash
# 1. Download Document Reader SDK
.\download-docreader.ps1  # Windows
./download-docreader.sh   # Linux/macOS/WSL

# 2. Set up database
psql -U postgres
CREATE DATABASE kyc_demo;
\i database/init.sql
\q

# 3. Configure environment
# Edit .env with your PostgreSQL password

# 4. Build and start
docker-compose up -d --build

# 5. Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

**⏱️ Setup Time: ~15-20 minutes**

---

## 🎯 Features

### ✅ Fully Functional
- **Document Verification**: Validate government-issued IDs (passports, licenses, national IDs)
- **Data Extraction**: Automatically extract name, DOB, document number, nationality, etc.
- **Authenticity Validation**: Check MRZ, barcodes, security features
- **Face Liveness Detection**: Real-time spoof detection and liveness verification
- **Face Matching**: Compare document photo with live selfie
- **Modern UI**: Elegant, responsive interface with light/dark theme
- **Database Storage**: PostgreSQL with comprehensive migrations
- **REST API**: Complete NestJS backend
- **Image Display**: Document and liveness frames displayed in results

---

## 📋 Prerequisites

- **Docker Desktop** (v24.0+)
- **PostgreSQL** (v14.0+) - locally installed
- **Node.js** (v18.0+)
- **Regula License**: Already configured in `regula-licenses/`

---

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React + Vite (Port 3000)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │  NestJS + TypeORM (Port 4000)
└──┬────┬────┬┘
   │    │    │
   │    │    └─────────► PostgreSQL (Port 5432)
   │    │
   ▼    ▼
┌──────┐ ┌────────┐
│ Doc  │ │  Face  │
│Reader│ │  SDK   │
└──────┘ └────────┘
(8080)   (8081)
```

---

## 📚 Documentation

📖 **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation guide

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - Fast 3-step setup guide
- **[INSTALLATION.md](./INSTALLATION.md)** - Complete installation walkthrough

### Integration & Setup
- **[REGULA_SDK_INTEGRATION.md](./REGULA_SDK_INTEGRATION.md)** - Regula SDK integration guide
- **[FACE_SDK_SETUP.md](./FACE_SDK_SETUP.md)** - Face SDK specific setup instructions
- **[MIGRATIONS_SETUP.md](./MIGRATIONS_SETUP.md)** - Database migrations guide

### Liveness Detection
- **[LIVENESS_GUIDE.md](./LIVENESS_GUIDE.md)** - Complete liveness detection guide
- **[LIVENESS_SPOOF_DETECTION.md](./LIVENESS_SPOOF_DETECTION.md)** - Understanding spoof detection
- **[ARCHITECTURE_DECISION_LIVENESS.md](./ARCHITECTURE_DECISION_LIVENESS.md)** - Liveness architecture decisions

### Support & Reference
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[system-requirements.md](./system-requirements.md)** - Technical specifications
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

---

## 🔧 Development

### Running Locally

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

## 📊 API Endpoints

### Verification
- `POST /api/verification` - Create verification session
- `GET /api/verification/:id` - Get session status

### Document Processing
- `POST /api/document/process` - Upload and process document
- `GET /api/document/:sessionId` - Get document results

### Face Processing
- `POST /api/face/liveness` - Check face liveness
- `POST /api/face/match-with-document` - Match faces

### Health
- `GET /health` - System health check

---

## 🛡️ Security

- ✅ Input validation on all endpoints
- ✅ File type and size validation
- ✅ CORS configuration
- ✅ Parameterized database queries
- ⚠️ **Production**: Enable HTTPS, authentication, rate limiting

---

## 🐛 Troubleshooting

See **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for common issues.

### Quick Fixes

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:8080 | xargs kill -9
```

**Database connection failed:**
```bash
# Verify PostgreSQL is running
# Update .env with correct credentials
```

**License error:**
```bash
# Verify license file exists
ls regula-licenses/docreader.license
```

---

## 🚀 Performance

- **Document Processing**: 2-5 seconds per document
- **Workers**: Configurable (default: 2)
- **Memory**: ~4GB total (all services)

---

## 🔗 Resources

- [Regula Document Reader Docs](https://docs.regulaforensics.com/develop/doc-reader-sdk/web-service/)
- [Regula Face SDK Docs](https://docs.regulaforensics.com/develop/face-sdk/web-service/)
- [Regula Downloads](https://downloads.regulaforensics.com/repo/ubuntu/)
- [NestJS Docs](https://docs.nestjs.com/)
- [React Docs](https://react.dev/)

---

## 📝 Project Structure

```
KYC-DEMO/
├── backend/                 # NestJS backend
├── frontend/               # React + Vite frontend
├── database/               # SQL initialization
├── regula-licenses/        # Regula license files
├── docker/                 # Docker configurations
│   ├── docreader/         # Document Reader setup
│   └── facesdk/           # Face SDK setup
├── docker-compose.yml     # Service orchestration
└── .env                   # Environment variables
```

---

## 🤝 Support

- **Installation Issues**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Regula Support**: support@regulaforensics.com
- **Documentation**: All guides in this repository

---

## 📄 License

MIT License

---

**Version**: 2.0.0  
**Last Updated**: November 22, 2025  
**Status**: Production Ready ✅

### Recent Updates
- ✅ Complete UI/UX redesign with light/dark theme
- ✅ Liveness detection fully integrated and working
- ✅ Face matching with document photos
- ✅ Comprehensive liveness data display
- ✅ Document images shown in results
- ✅ Database migrations configured
- ✅ All services operational
