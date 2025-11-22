# Dockerfile for Regula Document Reader SDK
# Uses the .deb package from Regula Downloads Repository

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
    && rm -rf /var/lib/apt/lists/*

# Copy the downloaded .deb package
# Download from: https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/r/regula-document-reader-webapi/
COPY regula-document-reader-webapi_*.deb /tmp/

# Install the package
RUN dpkg -i /tmp/regula-document-reader-webapi_*.deb || true && \
    apt-get update && \
    apt-get install -f -y && \
    rm /tmp/*.deb && \
    rm -rf /var/lib/apt/lists/*

# Make regdocreader executable
RUN chmod +x /opt/regula/document-reader-webapi/regdocreader

# Copy configuration file
COPY config.yml /opt/regula/document-reader-webapi/config.yml

# Expose port
EXPOSE 8080

# Set working directory
WORKDIR /opt/regula/document-reader-webapi

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/api/ping || exit 1

# Start the service using the binary executable
CMD ["/opt/regula/document-reader-webapi/regdocreader", "--port", "8080"]

