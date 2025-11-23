# ⚡ Quick Start Guide

Get your KYC Demo running in 15 minutes!

## 📦 Prerequisites

- ✅ Docker Desktop installed and running
- ✅ PostgreSQL installed locally
- ✅ License file at `regula-licenses/docreader.license`

## 🚀 Setup (3 Steps)

### 1. Download Document Reader SDK

**Windows:**
```powershell
.\download-docreader.ps1
```

**Linux / macOS / WSL:**
```bash
chmod +x download-docreader.sh
./download-docreader.sh
```

### 2. Set Up Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and schema
CREATE DATABASE kyc_demo;
\i database/init.sql
\q
```

### 3. Start Services

```bash
# Update .env with your PostgreSQL password
# Then start:
docker-compose up -d --build

# Watch logs
docker-compose logs -f
```

**First-time startup takes 5-10 minutes** (Document Reader downloads database files)

### 4. Verify

```bash
# Test Document Reader
curl http://127.0.0.1:8080/api/ping
# Expected: {"code":0}

# Test Backend
curl http://localhost:4000/health
# Expected: {"status":"ok"}

# Open Frontend
# http://localhost:3000
```

---

## 🎮 Try It Now

1. Go to **http://localhost:3000**
2. Click **"Start Verification"**
3. Upload a document (passport, ID, driver's license)
4. View the results!

---

## 🔧 Common Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f regula-docreader
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Clean restart
docker-compose down -v
docker-compose up -d --build
```

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 4000 | http://localhost:4000 |
| Document Reader | 8080 | http://127.0.0.1:8080 |
| Face SDK | 8081 | http://localhost:8081 |
| PostgreSQL | 5432 | localhost:5432 |

---

## ⚠️ Common Issues

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

### "Cannot connect to PostgreSQL"
```bash
# Verify PostgreSQL is running
# Windows: Check Services
# Mac: brew services list
# Linux: systemctl status postgresql

# Update .env with correct password
```

### "License not found"
```bash
# Verify license exists
ls regula-licenses/docreader.license

# License is already base64-encoded in docker/docreader/config.yml
```

### "Service won't start"
```bash
# Check logs for specific errors
docker-compose logs [service-name]

# Common fixes:
docker-compose down -v
docker-compose up -d --build
```

---

## ✅ Success Checklist

You're ready when:

- [ ] Document Reader responds: `curl http://127.0.0.1:8080/api/ping`
- [ ] Backend responds: `curl http://localhost:4000/health`
- [ ] Frontend loads: http://localhost:3000
- [ ] Can create verification session
- [ ] Can upload and process document
- [ ] Results saved to database

---

## 📚 Next Steps

- **Detailed Setup**: See [INSTALLATION.md](./INSTALLATION.md)
- **Liveness Guide**: See [LIVENESS_GUIDE.md](./LIVENESS_GUIDE.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Architecture**: See [system-requirements.md](./system-requirements.md)
- **API Docs**: See [backend/README.md](./backend/README.md)

---

## 💡 Pro Tips

1. **First Run**: Be patient during database download (~5-10 minutes)
2. **Logs**: Keep `docker-compose logs -f` running to monitor progress
3. **Clean Start**: Use `docker-compose down -v` for a fresh slate
4. **Development**: Run backend/frontend locally for faster iteration
5. **Production**: Never commit `.env` with real credentials

---

**⏱️ Total Time: ~15-20 minutes**

Happy verifying! 🎊
