# Database Migrations Setup

## Overview
The database schema is properly configured with migrations that will run automatically when the containers start fresh.

## Migrations Applied

### 1. FixDatabaseSchema1732267000000
**Purpose:** Fixes column lengths and status constraints

**Changes:**
- Drops dependent views (complete_verifications, recent_verifications, successful_verifications)
- Updates `document_results` table:
  - Changes `nationality` column from VARCHAR(3) to VARCHAR(50)
  - Changes `issuing_country` column from VARCHAR(3) to VARCHAR(50)
- Updates `verification_sessions` table:
  - Adds additional status values to check constraint: `awaiting_face_match`, `document_verified`, `face_verified`

### 2. AddAdditionalDocumentFields1763795071929
**Purpose:** Adds additional fields to document_results table

**Changes:**
- Adds `place_of_birth` (VARCHAR 255)
- Adds `address` (VARCHAR 255)
- Adds `personal_number` (VARCHAR 50)
- Adds `age` (VARCHAR 50)

### 3. AddAuthenticityFieldsToFaceResults1763806000000
**Purpose:** Adds authenticity fields to face_results table

**Changes:**
- Adds `authenticity_percentage` (NUMERIC 5,2)
- Adds `etalon_image_path` (VARCHAR 500)
- Adds `authenticity_image_path` (VARCHAR 500)

## How to Use

### Starting Fresh
To start with a completely fresh database:
```powershell
docker-compose down -v
docker-compose up -d
```

The migrations will run automatically when the backend container starts.

### Running Migrations Manually
If you need to run migrations manually:
```powershell
docker-compose exec backend npm run migration:run
```

### Creating New Migrations
To create a new migration:
```powershell
docker-compose exec backend npm run migration:create -- src/migrations/YourMigrationName
```

### Reverting Migrations
To revert the last migration:
```powershell
docker-compose exec backend npm run migration:revert
```

## Database Schema

### verification_sessions
- Status values: `pending`, `in_progress`, `completed`, `failed`, `expired`, `awaiting_face_match`, `document_verified`, `face_verified`

### document_results
- All text fields properly sized (VARCHAR 50 for nationality/issuing_country)
- Additional fields: place_of_birth, address, personal_number, age

### face_results
- Includes authenticity fields for face comparison
- Fields: authenticity_percentage, etalon_image_path, authenticity_image_path

## Important Notes

1. **TypeORM Synchronize is DISABLED** - Schema changes must be done through migrations
2. **Views are dropped before schema changes** - The FixDatabaseSchema migration handles this automatically
3. **All migrations are idempotent** - They use `IF EXISTS` and `IF NOT EXISTS` clauses where appropriate

## Testing

After starting fresh, verify the setup:

1. Check migrations ran:
```powershell
docker-compose exec postgres psql -U postgres -d kyc_demo -c "SELECT * FROM migrations ORDER BY timestamp;"
```

2. Verify document_results table:
```powershell
docker-compose exec postgres psql -U postgres -d kyc_demo -c "\d document_results"
```

3. Verify face_results table:
```powershell
docker-compose exec postgres psql -U postgres -d kyc_demo -c "\d face_results"
```

4. Check backend is running:
```powershell
docker-compose logs backend --tail=10
```

## Troubleshooting

If you encounter issues:

1. **Clear everything and start fresh:**
   ```powershell
   docker-compose down -v
   docker-compose up -d --build
   ```

2. **Check migration status:**
   ```powershell
   docker-compose exec backend npm run migration:run
   ```

3. **View backend logs:**
   ```powershell
   docker-compose logs backend
   ```

4. **Check database connection:**
   ```powershell
   docker-compose exec postgres psql -U postgres -d kyc_demo -c "SELECT version();"
   ```

