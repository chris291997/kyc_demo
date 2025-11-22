# KYC Demo Backend

NestJS backend with Regula Document Reader SDK and Face SDK integration.

## Features

- 📄 **Document Processing**: Validate ID documents using Regula Document Reader SDK
- 👤 **Face Liveness**: Detect face liveness using Regula Face SDK
- 🔍 **Face Matching**: Match selfie with document photo
- 💾 **PostgreSQL Database**: Store verification results
- 🔐 **Validation**: Input validation with class-validator
- 📁 **File Storage**: Handle image uploads

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 14+
- Docker (for Regula services)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=kyc_demo

REGULA_DOC_READER_URL=http://localhost:8080
REGULA_FACE_SDK_URL=http://localhost:8081

PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### Development Mode

```bash
# Start with hot reload
npm run start:dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Mode

```bash
# Build and run with Docker Compose (from root directory)
docker-compose up backend
```

## API Endpoints

### Health Check

- `GET /health` - Check service health status

### Verification

- `POST /api/verification` - Create verification session
- `GET /api/verification` - Get all verifications
- `GET /api/verification/:id` - Get verification by ID
- `GET /api/verification/:id/report` - Get verification report
- `GET /api/verification/statistics` - Get statistics
- `PATCH /api/verification/:id` - Update verification
- `DELETE /api/verification/:id` - Delete verification

### Document Processing

- `POST /api/document/process` - Process document with Regula
- `GET /api/document/:sessionId` - Get document results
- `GET /api/document/:sessionId/face-image` - Get extracted face image

### Face Processing

- `POST /api/face/liveness` - Check face liveness
- `POST /api/face/match` - Match two face images
- `POST /api/face/match-with-document` - Match selfie with document face
- `GET /api/face/:sessionId` - Get face results

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── document/         # Document processing module
│   │   ├── face/            # Face processing module
│   │   ├── verification/    # Verification session module
│   │   └── storage/         # File storage module
│   ├── config/              # Configuration files
│   ├── main.ts              # Application entry point
│   └── app.module.ts        # Root module
├── uploads/                 # File uploads directory
├── Dockerfile
└── package.json
```

## Database Schema

The application uses TypeORM with PostgreSQL. Run migrations:

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/InitialSchema

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Technologies

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Relational database
- **Axios** - HTTP client for Regula APIs
- **Multer** - File upload handling
- **class-validator** - Validation decorators

## License

MIT

