#!/bin/bash

# Shell Script to Download Regula Document Reader SDK Package
# Works on Linux, macOS, and WSL (Windows Subsystem for Linux)

set -e

echo "========================================"
echo "Regula Document Reader SDK - Downloader"
echo "========================================"
echo ""

REPO_URL="https://downloads.regulaforensics.com/repo/ubuntu/pool/stable/r/regula-document-reader-webapi/"
TARGET_DIR="docker/docreader"

echo "📦 Repository: $REPO_URL"
echo "📁 Target Directory: $TARGET_DIR"
echo ""

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Directory $TARGET_DIR not found!"
    echo "Creating directory..."
    mkdir -p "$TARGET_DIR"
fi

# Check if wget or curl is available
if command -v wget &> /dev/null; then
    DOWNLOAD_CMD="wget"
elif command -v curl &> /dev/null; then
    DOWNLOAD_CMD="curl"
else
    echo "❌ Error: Neither wget nor curl is installed!"
    echo "Please install wget or curl and try again."
    exit 1
fi

echo "🌐 Fetching available versions from repository..."
echo ""

# Fetch the repository page and extract .deb files
if [ "$DOWNLOAD_CMD" = "wget" ]; then
    PAGE_CONTENT=$(wget -q -O - "$REPO_URL")
else
    PAGE_CONTENT=$(curl -s "$REPO_URL")
fi

# Extract .deb file names
DEB_FILES=$(echo "$PAGE_CONTENT" | grep -oP 'href="\K[^"]*\.deb' | sort -V)

if [ -z "$DEB_FILES" ]; then
    echo "❌ No .deb packages found in repository"
    echo ""
    echo "Please visit the repository manually:"
    echo "$REPO_URL"
    exit 1
fi

# Display available versions
echo "📋 Available versions:"
echo ""

index=1
declare -a files_array
while IFS= read -r file; do
    files_array+=("$file")
    echo "  [$index] $file"
    ((index++))
done <<< "$DEB_FILES"

total_files=${#files_array[@]}

echo ""
echo -n "Select a version to download (1-$total_files) or press Enter for latest: "
read selection

if [ -z "$selection" ]; then
    # Get last (latest) file
    selected_file="${files_array[$((total_files-1))]}"
    echo "Using latest version: $selected_file"
elif [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "$total_files" ]; then
    selected_file="${files_array[$((selection-1))]}"
else
    echo "❌ Invalid selection!"
    exit 1
fi

download_url="${REPO_URL}${selected_file}"
output_path="${TARGET_DIR}/${selected_file}"

echo ""
echo "⬇️  Downloading: $selected_file"
echo "📥 From: $download_url"
echo "💾 To: $output_path"
echo ""

# Download with progress
if [ "$DOWNLOAD_CMD" = "wget" ]; then
    wget -O "$output_path" "$download_url"
else
    curl -L -o "$output_path" "$download_url" --progress-bar
fi

if [ -f "$output_path" ]; then
    file_size=$(du -h "$output_path" | cut -f1)
    echo ""
    echo "✅ Download complete!"
    echo "📦 Package: $selected_file"
    echo "💾 Size: $file_size"
    echo "📁 Location: $output_path"
    echo ""
    echo "========================================"
    echo "🎉 Next Steps:"
    echo "========================================"
    echo ""
    echo "1. Build the Docker image:"
    echo "   docker-compose build regula-docreader"
    echo ""
    echo "2. Start the service:"
    echo "   docker-compose up -d regula-docreader"
    echo ""
    echo "3. Test the service:"
    echo "   curl http://localhost:8080/api/ping"
    echo ""
    echo "📚 For more details, see:"
    echo "   docker/docreader/README.md"
    echo "   REGULA_INSTALLATION_ALTERNATIVES.md"
    echo ""
else
    echo ""
    echo "❌ Download failed!"
    exit 1
fi

