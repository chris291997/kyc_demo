# KYC Demo - Quick Start Script for Windows PowerShell
# This script helps you get started quickly

Write-Host "🚀 KYC Demo Application - Quick Start" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file. Please update DATABASE_PASSWORD" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found. Please check repository." -ForegroundColor Red
        exit 1
    }
}

# Check if PostgreSQL is accessible
Write-Host ""
Write-Host "📦 Checking PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure PostgreSQL is running locally" -ForegroundColor Yellow

# Prompt user
$continue = Read-Host "Have you set up the PostgreSQL database? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host ""
    Write-Host "📚 To set up the database:" -ForegroundColor Yellow
    Write-Host "1. Connect to PostgreSQL: psql -U postgres" -ForegroundColor White
    Write-Host "2. Create database: CREATE DATABASE kyc_demo;" -ForegroundColor White
    Write-Host "3. Run init script: \i database/init.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 0
}

# Start Docker services
Write-Host ""
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
Write-Host "This may take 5-15 minutes on first run (downloading Regula databases)" -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker services started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

# Wait a bit for services to initialize
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

$services = @{
    "Frontend" = "http://localhost:3000"
    "Backend API" = "http://localhost:4000/health"
    "Document Reader" = "http://localhost:8080/api/ping"
    "Face SDK" = "http://localhost:8081/api/ping"
}

foreach ($service in $services.GetEnumerator()) {
    try {
        $response = Invoke-WebRequest -Uri $service.Value -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $($service.Key): $($service.Value)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($service.Key): Not ready yet (this is normal on first start)" -ForegroundColor Yellow
    }
}

# Display final instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend API:     http://localhost:4000" -ForegroundColor White
Write-Host "📄 Document Reader: http://localhost:8080" -ForegroundColor White
Write-Host "👤 Face SDK:        http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "🛑 Stop services:   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: Regula services may take 5-15 minutes to fully initialize" -ForegroundColor Yellow
Write-Host "Check status with: docker-compose logs -f regula-docreader" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 For more help, see SETUP.md" -ForegroundColor Cyan

