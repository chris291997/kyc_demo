# 🐛 Troubleshooting Guide

Common issues and solutions for the KYC Demo Application.

## 📋 Quick Diagnostics

### Check Service Status

```bash
# Check all containers
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f regula-docreader
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks

```bash
# Document Reader
curl http://127.0.0.1:8080/api/ping
# Expected: {"code":0}

# Backend
curl http://localhost:4000/health
# Expected: {"status":"ok"}

# Frontend
curl http://localhost:3000
# Expected: HTML response
```

---

## 🔧 Common Issues

### 1. "Package not found" During Docker Build

**Symptom:**
```
ERROR: COPY failed: no source files were specified
```

**Solution:**
```bash
# Check if .deb file exists
ls docker/docreader/*.deb

# If missing, download it
.\download-docreader.ps1  # Windows
./download-docreader.sh   # Linux/macOS/WSL
```

---

### 2. "License not found" or "License invalid"

**Symptom:**
```
No license supplied, starting without license
```

**Solution:**

The license is now base64-encoded in `docker/docreader/config.yml`. Verify:

```bash
# Check license file exists
ls regula-licenses/docreader.license

# Check config file
cat docker/docreader/config.yml

# Rebuild if needed
docker-compose build regula-docreader
docker-compose up -d regula-docreader
```

---

### 3. "Port already in use"

**Symptom:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8080: bind: address already in use
```

**Solution:**

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Linux / macOS:**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9

# Or change port in docker-compose.yml
```

---

### 4. "Cannot connect to PostgreSQL"

**Symptom:**
```
ECONNREFUSED 127.0.0.1:5432
Unable to connect to the database
```

**Solution:**

```bash
# Check if PostgreSQL is running
# Windows
Get-Service postgresql*

# Mac
brew services list

# Linux
systemctl status postgresql

# Verify connection manually
psql -U postgres -d kyc_demo

# Check .env file has correct credentials
cat .env | grep DATABASE

# For Docker on Windows/Mac, use:
DATABASE_HOST=host.docker.internal
```

---

### 5. "npm ci" Error

**Symptom:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Solution:**

This should already be fixed. Verify `package-lock.json` exists:

```bash
ls backend/package-lock.json
ls frontend/package-lock.json

# If missing, regenerate:
cd backend && npm install
cd frontend && npm install
```

---

### 6. "Document Reader binary not found"

**Symptom:**
```
exec: "/opt/regula/document-reader-webapi/bin/document-reader-webapi": no such file or directory
```

**Solution:**

This should already be fixed in the Dockerfile. If you still see this:

```bash
# Rebuild with no cache
docker-compose build --no-cache regula-docreader

# Check the logs
docker-compose logs regula-docreader

# Verify binary exists in container
docker exec kyc-docreader find / -name "regdocreader" 2>/dev/null
```

---

### 7. "Service keeps restarting"

**Symptom:**
```
Container exits immediately after starting
Constant restart loop
```

**Solution:**

```bash
# Check logs for error message
docker logs kyc-docreader

# Common causes:
# - License issue → Check license file
# - Port conflict → Check if port is free
# - Memory issue → Increase Docker memory
# - Binary not found → Rebuild image

# Clean restart
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

### 8. "Out of memory" or "Docker slow"

**Symptom:**
```
Service starts but runs very slowly
Container OOM killed
```

**Solution:**

**Increase Docker Resources:**

1. Open Docker Desktop
2. Go to **Settings** → **Resources**
3. Adjust:
   - **Memory**: Minimum 8GB (recommended: 12GB)
   - **CPUs**: Minimum 2 (recommended: 4)
   - **Swap**: 2GB
   - **Disk**: 20GB+

**Verify:**
```bash
docker info | grep Memory
```

---

### 9. "Database connection timeout"

**Symptom:**
```
TimeoutError: Connection timeout
```

**Solution:**

```bash
# Increase timeout in docker-compose.yml
healthcheck:
  timeout: 30s  # Increase this

# Or wait longer for database to start
docker-compose up -d postgres
sleep 10
docker-compose up -d backend
```

---

### 10. "Frontend shows connection error"

**Symptom:**
```
ERR_CONNECTION_REFUSED
Network Error
```

**Solution:**

```bash
# Check backend is running
curl http://localhost:4000/health

# Check CORS settings in backend
# File: backend/src/main.ts
# Should have:
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true
});

# Verify .env has correct API URL
cat frontend/.env
# Should have:
VITE_API_URL=http://localhost:4000
```

---

### 11. "Camera not working in frontend"

**Symptom:**
```
NotAllowedError: Permission denied
Camera not found
```

**Solution:**

- **Permissions**: Check browser camera permissions
- **HTTPS**: Camera requires HTTPS in production (use localhost for dev)
- **Browser**: Use Chrome/Edge (best support)
- **Multiple tabs**: Close other tabs using camera

**Test camera:**
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
```

---

### 12. "File upload fails"

**Symptom:**
```
413 Payload Too Large
File size exceeds limit
```

**Solution:**

```bash
# Increase limits in backend/src/main.ts
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

# Check nginx limits (if using nginx)
client_max_body_size 50M;
```

---

### 13. "Docker build fails"

**Symptom:**
```
ERROR [internal] load metadata for docker.io/library/ubuntu:22.04
```

**Solution:**

```bash
# Check Docker daemon is running
docker ps

# Check internet connection
ping docker.io

# Try pulling base image manually
docker pull ubuntu:22.04

# Clear Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

---

### 14. "Regula service returns error 500"

**Symptom:**
```
Internal Server Error
Status: 500
```

**Solution:**

```bash
# Check Document Reader logs
docker logs kyc-docreader

# Common causes:
# - Invalid image format → Use JPG/PNG
# - Image too large → Compress image
# - License issue → Check license is valid
# - Database not loaded → Wait for initial download

# Test with simple request
curl -X POST http://127.0.0.1:8080/api/process \
  -F "image=@test-document.jpg"
```

---

### 15. "Windows line ending issues"

**Symptom:**
```
$'\r': command not found
/bin/bash^M: bad interpreter
```

**Solution:**

```bash
# Convert line endings
dos2unix download-docreader.sh

# Or using sed
sed -i 's/\r$//' download-docreader.sh

# Configure git
git config core.autocrlf input
```

---

## 🔍 Advanced Debugging

### Inspect Running Container

```bash
# Access container shell
docker exec -it kyc-docreader /bin/bash

# Inside container, check:
ls -la /opt/regula/document-reader-webapi/
cat /opt/regula/document-reader-webapi/config.yml
ps aux | grep regdocreader
```

### Check Network Connectivity

```bash
# Test internal network
docker exec kyc-backend ping regula-docreader

# Check DNS resolution
docker exec kyc-backend nslookup regula-docreader
```

### View Detailed Logs

```bash
# All logs with timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs --tail=100

# Specific service, no follow
docker logs kyc-docreader
```

---

## 🧹 Clean Slate (Nuclear Option)

If nothing else works:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose rm -f
docker rmi $(docker images -q kyc-*)

# Clean Docker system
docker system prune -a --volumes

# Rebuild from scratch
.\download-docreader.ps1  # Re-download package
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 System Requirements Check

### Verify You Meet Requirements

```bash
# Docker version
docker --version
# Minimum: 24.0.0

# Docker Compose version
docker-compose --version
# Minimum: 2.0.0

# Available disk space
df -h
# Minimum: 10GB free

# Available memory
free -h  # Linux
# Minimum: 8GB RAM available
```

---

## 🆘 Still Having Issues?

### Collect Debug Information

```bash
# Create debug report
echo "=== Docker Info ===" > debug.txt
docker info >> debug.txt
echo "\n=== Docker Compose Config ===" >> debug.txt
docker-compose config >> debug.txt
echo "\n=== Service Status ===" >> debug.txt
docker-compose ps >> debug.txt
echo "\n=== Logs ===" >> debug.txt
docker-compose logs --tail=100 >> debug.txt
```

### Where to Get Help

1. **Documentation**:
   - [INSTALLATION.md](./INSTALLATION.md) - Complete installation guide
   - [QUICK_START.md](./QUICK_START.md) - Quick reference
   - [README.md](./README.md) - Project overview
   - [LIVENESS_GUIDE.md](./LIVENESS_GUIDE.md) - Liveness detection guide

2. **Regula Support**:
   - Email: support@regulaforensics.com
   - Reference: License OL113415
   - Include: Debug report, error logs, steps to reproduce

3. **Docker Specific**:
   - [Docker Documentation](https://docs.docker.com/)
   - [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## ✅ Verification Checklist

After resolving issues, verify:

- [ ] `docker-compose ps` shows all services "Up"
- [ ] `curl http://127.0.0.1:8080/api/ping` returns `{"code":0}`
- [ ] `curl http://localhost:4000/health` returns success
- [ ] http://localhost:3000 loads in browser
- [ ] Can upload and process a test document
- [ ] Results are stored in database
- [ ] No errors in logs: `docker-compose logs`

---

**Last Updated**: November 21, 2025  
**Covers**: All known issues as of v1.0.0  
**Status**: ✅ Comprehensive

