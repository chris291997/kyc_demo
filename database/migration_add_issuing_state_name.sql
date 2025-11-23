-- Migration: Add issuing_state_name column to document_results table
-- Date: 2024
-- Description: Adds issuing_state_name field to store the full country name (e.g., "Philippines")
--              while issuing_country stores the code (e.g., "PHL")

-- Add the new column
ALTER TABLE document_results 
ADD COLUMN IF NOT EXISTS issuing_state_name VARCHAR(255);

-- Add a comment to document the column
COMMENT ON COLUMN document_results.issuing_state_name IS 'Full name of the issuing state/country (e.g., "Philippines"). The issuing_country field stores the code (e.g., "PHL").';

