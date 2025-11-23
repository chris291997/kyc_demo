-- Migration: Add document_name column to document_results table
-- Date: 2024
-- Description: Adds document_name field to store the full document name (e.g., "Philippines - ePassport (2016)")
--              The document_type field stores the type from dDescription (e.g., "Passport")

-- Add the new column
ALTER TABLE document_results 
ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);

-- Add a comment to document the column
COMMENT ON COLUMN document_results.document_name IS 'Full name of the document (e.g., "Philippines - ePassport (2016)"). Extracted from DocumentName field in Regula response.';

