# Regula Document Reader SDK - Docker Setup

This directory contains the Docker setup for the Regula Document Reader SDK.

## 📋 Prerequisites

1. Download the `.deb` package using one of the provided scripts:
   - **Linux/macOS/WSL**: `./download-docreader.sh`
   - **Windows (PowerShell)**: `.\download-docreader.ps1`

2. Place your license file at: `regula-licenses/docreader.license`

## 📦 Package Download

The scripts will help you download the correct package from:
```
https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/r/regula-document-reader-webapi/
```

### Manual Download

If the scripts don't work, you can manually download:

1. Visit the URL above
2. Download a file like: `regula-document-reader-webapi_X.Y.Z_amd64.deb`
3. Place it in this directory (`docker/docreader/`)

## 🏗️ Building the Docker Image

```bash
# From project root
docker-compose build regula-docreader
```

## 🚀 Starting the Service

```bash
# Start just the Document Reader service
docker-compose up -d regula-docreader

# View logs
docker-compose logs -f regula-docreader
```

## 🔍 Testing

```bash
# Health check
curl http://localhost:8080/api/ping

# Should return: {"code":0}
```

## 🐛 Troubleshooting

### Issue: Binary not found

If you see an error like:
```
document-reader-webapi: no such file or directory
```

**Solution**: The .deb package structure may have changed. Check the build logs:

```bash
docker-compose build regula-docreader --no-cache
```

Look for the "Installed files" section in the output to see where the binary was installed.

### Issue: License error

Make sure your license file is at:
```
regula-licenses/docreader.license
```

And is mounted correctly in `docker-compose.yml`:
```yaml
volumes:
  - ./regula-licenses/docreader.license:/app/extBin/unix_x64/regula.license
```

### Issue: Database not loading

The database is mounted at:
```yaml
volumes:
  - ./regula-db:/app/extBin/unix_x64/db
```

The service will download the database on first run if it's not present.

## 📚 Package Information

The Regula Document Reader WebAPI package contains:
- Binary executable: `document-reader-webapi`
- Dependencies: libicu70, libssl3
- Default installation paths (may vary by version):
  - `/opt/regula/document-reader-webapi/`
  - `/usr/bin/document-reader-webapi`
  - `/usr/local/bin/document-reader-webapi`

## 🔧 Advanced Configuration

### Environment Variables

You can customize the service using environment variables in `docker-compose.yml`:

```yaml
environment:
  - workers=2  # Number of worker processes
  - DOCREADER_LICENSE_PATH=/app/extBin/unix_x64/regula.license
  - DOCREADER_DB_PATH=/app/extBin/unix_x64/db
```

### Workers

The `workers` parameter controls parallelism:
- `workers=1`: Single worker (default, ~1-2 req/sec)
- `workers=2-4`: Multiple workers for higher throughput
- Each worker is single-threaded

### Memory

Adjust memory limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Adjust based on your needs
```

## 📖 Additional Resources

- [Official Regula Documentation](https://support.regulaforensics.com/)
- [API Reference](https://api.regulaforensics.com/document-reader)
- Project documentation:
  - `REGULA_INSTALLATION_ALTERNATIVES.md` - Different installation methods
  - `system-requirements.md` - System architecture details

## ⚠️ Important Notes

1. **License Required**: The service will not start without a valid license
2. **First Run**: Database download may take 5-10 minutes on first start
3. **Resources**: Each worker needs ~1-2GB RAM
4. **Version**: Use a stable version from the repository (avoid beta/test builds)

## 🆘 Need Help?

1. Check the logs: `docker-compose logs regula-docreader`
2. Rebuild without cache: `docker-compose build regula-docreader --no-cache`
3. Verify the package: `dpkg -c docker/docreader/regula-document-reader-webapi_*.deb`
4. Check package contents: Look for files under `/opt/regula/` or `/usr/bin/`

## 📝 File Structure

```
docker/docreader/
├── Dockerfile                           # Docker image definition
├── README.md                            # This file
└── regula-document-reader-webapi_*.deb # Downloaded package
```
