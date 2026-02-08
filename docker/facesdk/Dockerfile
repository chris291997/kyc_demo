# Dockerfile for Regula Face SDK Web Service
# Uses the .deb package from Regula Downloads Repository
# Advanced: Liveness installation (Detection + Comparison + Liveness)

FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install required dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ca-certificates \
    libicu70 \
    libssl3 \
    procps \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set timezone
ENV TZ=UTC

# Set library path for Face SDK
ENV LD_LIBRARY_PATH=/opt/regula/face-rec-service/extBin/unix:$LD_LIBRARY_PATH

# Copy the downloaded .deb package
# Download from: https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/f/face-rec-service-cpu/
# Use: bash download-facesdk.sh
COPY face-rec-service-cpu_*.deb /tmp/

# Install the package dependencies first
RUN apt-get update && \
    apt-get install -y libgomp1 libx11-6 && \
    rm -rf /var/lib/apt/lists/*

# Create a dummy systemctl to satisfy post-install script
RUN echo '#!/bin/sh\nexit 0' > /usr/bin/systemctl && \
    chmod +x /usr/bin/systemctl

# Install the package
RUN dpkg -i /tmp/face-rec-service-cpu_*.deb || true && \
    rm /tmp/*.deb

# Remove dummy systemctl
RUN rm /usr/bin/systemctl

# Create expected directory structure and symlink libraries
# Face SDK looks for libs at extBin/unix_x64/cpu/ but they're at extBin/unix/
RUN mkdir -p /opt/regula/face-rec-service/extBin/unix_x64/cpu && \
    ln -s /opt/regula/face-rec-service/extBin/unix/* /opt/regula/face-rec-service/extBin/unix_x64/cpu/

# Create necessary directories
RUN mkdir -p /app/storage /app/config

# Copy configuration file
COPY config.yml /app/config.yml

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set working directory
WORKDIR /app

# Expose Face SDK port (actual port the regface binary uses)
EXPOSE 41101

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:41101/api/ping || exit 1

# Start Face SDK service via entrypoint script
# Binary is located at /opt/regula/face-rec-service/regface
ENV GUNICORN_CMD_ARGS="--bind 0.0.0.0:8080"
ENTRYPOINT ["/app/entrypoint.sh"]
