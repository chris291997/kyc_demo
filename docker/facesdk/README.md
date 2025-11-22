# Regula Face SDK Docker Setup

## Overview

This directory contains the Docker setup for Regula Face SDK Web Service with **Advanced: Liveness** capabilities.

### Features Included
✅ **Face Detection** - Detect and locate faces in images  
✅ **Face Comparison (1:1 Match)** - Compare two face images  
✅ **Liveness Assessment** - Verify if the face is from a live person (requires HTTPS)

## Installation

### Step 1: Download Face SDK Package

Run the download script to get the Face SDK package (~1.1GB):

```bash
bash download-facesdk.sh
```

The script will:
- Show all available versions
- Let you select a version (or use latest)
- Download with progress tracking
- Save to: `docker/facesdk/face-rec-service-cpu_*.deb`

### Step 2: Verify Files

Make sure you have these files:
```
docker/facesdk/
├── Dockerfile
├── config.yml
├── face-rec-service-cpu_*.deb  ← Downloaded package
└── README.md (this file)
```

### Step 3: Build Docker Image

```bash
docker-compose build regula-face
```

### Step 4: Start Required Services

Face SDK Liveness requires additional services:

```bash
# Start database and storage first
docker-compose up -d postgres storage

# Wait for them to be healthy, then start Face SDK
docker-compose up -d regula-face
```

### Step 5: Verify It's Working

```bash
# Check if service is running
curl http://localhost:8081/api/ping

# Check logs
docker logs kyc-facesdk
```

## Configuration

The `config.yml` file contains Face SDK configuration including:
- License file path
- Storage settings (MinIO for liveness videos)
- Database settings (PostgreSQL)
- Processing settings (workers, timeout)
- Liveness settings

## Architecture

```
┌─────────────────┐
│  Face SDK API   │
│   Port: 8081    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    │         │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐
│License│ │MinIO│  │PostgreSQL│
└───────┘ └─────┘  └─────────┘
```

## API Endpoints

### Health Check
```bash
GET http://localhost:8081/api/ping
```

### Face Detection
```bash
POST http://localhost:8081/api/detect
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```

### Face Comparison (1:1)
```bash
POST http://localhost:8081/api/match
Content-Type: application/json

{
  "images": [
    "base64_encoded_image1",
    "base64_encoded_image2"
  ]
}
```

### Liveness Assessment
```bash
POST http://localhost:8081/api/liveness
Content-Type: application/json

{
  "video": "base64_encoded_video",
  "metadata": {}
}
```

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker logs kyc-facesdk --tail 50
```

**Common issues:**
1. **License not found** - Ensure `facesdk.license` exists in `regula-licenses/`
2. **Binary not found** - The binary path in Dockerfile may need adjustment
3. **Port conflict** - Port 8081 might be in use
4. **Storage not ready** - Wait for MinIO to be healthy first

### Find Binary Path

If the service fails to start, find the correct binary path:

```bash
# Enter the container
docker run -it --rm kyc-facesdk:local bash

# Find the Face SDK binary
find / -name "*face*" -type f 2>/dev/null | grep -i bin
```

Update the `CMD` line in Dockerfile with the correct path.

### Check Dependencies

```bash
# Verify storage is running
docker ps | grep storage
curl http://localhost:9000/minio/health/live

# Verify database is running
docker ps | grep postgres
docker exec kyc-postgres pg_isready -U postgres
```

## SSL/HTTPS for Liveness

⚠️ **Important:** Liveness features require HTTPS in production.

For development, the current setup uses HTTP. For production:

1. Generate SSL certificates (or use Let's Encrypt)
2. Configure nginx or a reverse proxy with HTTPS
3. Update Face SDK config to use HTTPS URLs

See: `generate-ssl-certificates.sh` for development certificates.

## Resources

- **Face SDK Documentation:** https://docs.regulaforensics.com/develop/face-sdk/web-service/
- **Installation Guide:** https://docs.regulaforensics.com/develop/face-sdk/web-service/installation/
- **API Reference:** https://docs.regulaforensics.com/develop/face-sdk/web-service/development/

## Package Information

- **Repository:** https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/f/face-rec-service-cpu/
- **Type:** CPU-based processing
- **Size:** ~1.1GB (latest version)
- **License:** Required (place in `regula-licenses/facesdk.license`)

## Next Steps

After Face SDK is running:

1. **Test Detection:**
   ```bash
   # From backend, call Face SDK
   curl -X POST http://localhost:8081/api/detect \
     -H "Content-Type: application/json" \
     -d '{"image": "base64_image_here"}'
   ```

2. **Integrate with Backend:**
   - Backend is already configured to use `http://regula-face:8080`
   - Face matching endpoint: `/api/face/match-with-document`
   - Liveness endpoint: `/api/face/liveness`

3. **Test via Frontend:**
   - Open http://127.0.0.1:3000
   - Upload document and selfie
   - Verify face matching works

## Support

- **Issues:** Check logs first: `docker logs kyc-facesdk`
- **Regula Support:** https://support.regulaforensics.com/
- **Documentation:** https://docs.regulaforensics.com/

---

**Status:** Ready for download → build → deploy 🚀
