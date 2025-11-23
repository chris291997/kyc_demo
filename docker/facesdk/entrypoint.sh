#!/bin/bash
# Entrypoint script for Regula Face SDK
# This script ensures the service starts on the correct port

set -e

# Set the port configuration
export GUNICORN_CMD_ARGS="--bind 0.0.0.0:8080 --workers 1 --worker-class uvicorn.workers.UvicornWorker"

# Start the Face SDK service
exec /opt/regula/face-rec-service/regface

