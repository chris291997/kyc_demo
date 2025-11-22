#!/bin/bash

# Generate SSL certificates for Face SDK Liveness
# Liveness requires HTTPS for security

echo "=================================================="
echo "   Generate SSL Certificates for Face SDK"
echo "=================================================="
echo ""

# Create certificates directory
CERT_DIR="./docker/facesdk/certs"
mkdir -p "$CERT_DIR"

echo "📜 Generating self-signed SSL certificate..."
echo ""

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=US/ST=State/L=City/O=KYC Demo/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificates generated successfully!"
    echo ""
    echo "📍 Certificates saved to:"
    echo "   - Private Key: $CERT_DIR/privkey.pem"
    echo "   - Certificate: $CERT_DIR/fullchain.pem"
    echo ""
    echo "⚠️  NOTE: These are self-signed certificates for DEVELOPMENT only!"
    echo "   For production, use certificates from a trusted Certificate Authority."
    echo ""
else
    echo ""
    echo "❌ Failed to generate certificates!"
    echo ""
    echo "Make sure OpenSSL is installed:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  macOS: brew install openssl"
    echo ""
    exit 1
fi

