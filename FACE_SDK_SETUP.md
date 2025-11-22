# Face SDK Setup Guide

Complete guide to set up Regula Face SDK with **Advanced: Liveness** for your KYC Demo.

## 📋 Prerequisites

✅ Face SDK license file: `regula-licenses/facesdk.license`  
✅ Docker and Docker Compose installed  
✅ Git Bash or WSL for running bash scripts  
✅ 5-15 minutes for download (1.1GB package)

## 🚀 Quick Start

### Step 1: Download Face SDK Package

Run the interactive download script:

```bash
bash download-facesdk.sh
```

**What it does:**
- Shows all available Face SDK versions
- Lets you select (or press Enter for latest)
- Downloads with progress bar and ETA
- Saves to: `docker/facesdk/face-rec-service-cpu_*.deb`

**Download time:** 5-15 minutes depending on your internet speed.

### Step 2: Build Docker Images

Once download completes, build all services:

```bash
# Build Face SDK
docker-compose build regula-face

# Optionally rebuild backend/frontend if needed
docker-compose build backend frontend
```

### Step 3: Start Services in Order

Face SDK requires database and storage to be running first:

```bash
# 1. Start PostgreSQL and MinIO Storage
docker-compose up -d postgres storage

# 2. Wait 10 seconds for them to initialize
# (Optional: Check status with: docker-compose ps)

# 3. Start Face SDK
docker-compose up -d regula-face

# 4. Start backend and frontend
docker-compose up -d backend frontend
```

### Step 4: Verify Everything Works

```bash
# Check all services are running
docker-compose ps

# Test Face SDK
curl http://localhost:8081/api/ping

# Check Face SDK logs
docker logs kyc-facesdk

# Test backend
curl http://127.0.0.1:4000/api/verification
```

## 🎯 What You Get

### Face SDK Features

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Face Detection** | `POST /api/detect` | Detect faces in images |
| **Face Comparison** | `POST /api/match` | Compare two face images (1:1) |
| **Liveness Check** | `POST /api/liveness` | Verify if face is from live person |

### Architecture

```
┌──────────────────────────────────────────────┐
│           Your KYC Demo Application          │
├──────────────────────────────────────────────┤
│                                              │
│  Frontend (React)  →  Backend (NestJS)      │
│  Port: 3000            Port: 4000           │
│                           ↓                  │
│                    ┌──────┴──────┐          │
│                    │             │          │
│             ┌──────▼──────┐  ┌──▼─────┐   │
│             │   Document  │  │  Face  │   │
│             │   Reader    │  │  SDK   │   │
│             │  Port:8080  │  │Port:8081│  │
│             └─────────────┘  └────┬────┘   │
│                                   │         │
│                          ┌────────┴────┐    │
│                          │             │    │
│                      ┌───▼───┐   ┌────▼──┐ │
│                      │ MinIO │   │Postgre││ │
│                      │Storage│   │  SQL  ││ │
│                      └───────┘   └───────┘ │
└──────────────────────────────────────────────┘
```

## 📦 Services Overview

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| **Frontend** | 3000 | ✅ Running | React UI |
| **Backend** | 4000 | ✅ Running | NestJS API |
| **Document Reader** | 8080 | ✅ Running | Document validation |
| **Face SDK** | 8081 | 🔄 Setup | Face recognition + liveness |
| **PostgreSQL** | 5432 | ✅ Running | Database |
| **MinIO Storage** | 9000, 9001 | 🆕 New | Liveness video storage |

## 🔧 Configuration

### Face SDK Config (`docker/facesdk/config.yml`)

```yaml
license:
  url: file:///app/facesdk.license

storage:
  endpoint: http://storage:9000
  bucket: face-liveness

database:
  host: postgres
  name: kyc_demo

processing:
  workers: 2
  timeout: 30

liveness:
  enabled: true
```

### Environment Variables (`.env`)

Already configured for you:
```env
REGULA_FACE_SDK_URL=http://regula-face:8080
DATABASE_HOST=postgres
VITE_API_URL=http://127.0.0.1:4000
```

## 🧪 Testing

### Test Face SDK Directly

```bash
# Health check
curl http://localhost:8081/api/ping

# Should return: {"status":"ok"}
```

### Test via Your Application

1. **Open Frontend:**
   ```
   http://127.0.0.1:3000
   ```

2. **Start Verification:**
   - Upload a document (passport, ID, etc.)
   - Take a selfie or upload face photo
   - System will:
     - Validate document (Document Reader)
     - Extract face from document
     - Match with selfie (Face SDK)
     - Check liveness (Face SDK)

3. **View Results:**
   - Document validation status
   - Face match score
   - Liveness confidence

## ⚠️ Troubleshooting

### Face SDK Won't Start

**Check logs:**
```bash
docker logs kyc-facesdk --tail 50
```

**Common issues:**

1. **License not found:**
   ```bash
   # Verify license exists
   ls -la regula-licenses/facesdk.license
   ```

2. **Storage not ready:**
   ```bash
   # Check MinIO
   docker logs kyc-storage
   curl http://localhost:9000/minio/health/live
   ```

3. **Binary path wrong:**
   - Face SDK binary location may vary
   - Check `docker/facesdk/Dockerfile` CMD line
   - May need to find actual path:
     ```bash
     docker run -it --rm kyc-facesdk:local find / -name "*face*" -type f 2>/dev/null
     ```

4. **Port conflict:**
   ```bash
   # Check if port 8081 is in use
   netstat -ano | findstr :8081
   ```

### Download Issues

**Script won't run:**
```bash
# Make sure Git Bash or WSL is installed
# Try: wsl bash download-facesdk.sh
```

**Download too slow:**
- Select an older, smaller version (e.g., version 6.4 is 960MB vs 1.1GB)
- The script lets you choose the version

**Download interrupted:**
- Just run the script again
- It will restart from beginning

## 📚 Additional Resources

### Documentation
- [Face SDK Web Service](https://docs.regulaforensics.com/develop/face-sdk/web-service/)
- [Installation Guide](https://docs.regulaforensics.com/develop/face-sdk/web-service/installation/)
- [API Reference](https://docs.regulaforensics.com/develop/face-sdk/web-service/development/)

### Your Project Files
- `docker/facesdk/README.md` - Detailed Face SDK setup
- `docker/facesdk/Dockerfile` - Docker build configuration
- `docker/facesdk/config.yml` - Face SDK configuration
- `download-facesdk.sh` - Download script

## 🎉 Next Steps

Once Face SDK is running:

1. **✅ Download complete** (Step 1)
2. **Build & start services** (Steps 2-3)
3. **Test integration** (Step 4)
4. **Use your KYC app!** → http://127.0.0.1:3000

## 💡 Tips

- **First time setup:** Download takes longest (5-15 min)
- **Subsequent starts:** Just `docker-compose up -d` (~30 seconds)
- **Storage service:** MinIO console at http://localhost:9001 (minioadmin/minioadmin)
- **Logs are your friend:** Use `docker logs <container-name>` to debug

## 🆘 Need Help?

1. **Check logs:** `docker logs kyc-facesdk`
2. **Check README:** `docker/facesdk/README.md`
3. **Regula Support:** https://support.regulaforensics.com/
4. **Main docs:** `README.md` and `TROUBLESHOOTING.md`

---

**Current Status:** ✅ Ready to download Face SDK package!

Run: `bash download-facesdk.sh` to get started! 🚀

