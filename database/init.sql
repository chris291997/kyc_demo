-- KYC Demo Application - Database Initialization Script
-- PostgreSQL Schema for Regula Integration

-- Create database (run separately if needed)
-- CREATE DATABASE kyc_demo;

-- Connect to the database
\c kyc_demo;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: verification_sessions
-- Purpose: Track complete KYC verification sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  document_verified BOOLEAN DEFAULT FALSE,
  liveness_passed BOOLEAN DEFAULT FALSE,
  face_matched BOOLEAN DEFAULT FALSE,
  match_score DECIMAL(5,2),
  user_identifier VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'expired'))
);

-- Indexes for verification_sessions
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_verification_created ON verification_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_sessions(user_identifier);

-- =====================================================
-- Table: document_results
-- Purpose: Store document verification results
-- =====================================================
CREATE TABLE IF NOT EXISTS document_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES verification_sessions(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(100),
  document_type_code VARCHAR(50),
  document_name VARCHAR(255),
  document_number VARCHAR(100),
  
  -- Personal Information
  full_name VARCHAR(255),
  given_names VARCHAR(255),
  surname VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(20),
  nationality VARCHAR(3),
  
  -- Document Details
  issuing_country VARCHAR(3),
  issuing_state_name VARCHAR(255),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  
  -- Images
  face_image_path VARCHAR(500),
  document_image_path VARCHAR(500),
  
  -- Verification Status
  authenticity_status VARCHAR(50),
  authenticity_score DECIMAL(5,2),
  mrz_verified BOOLEAN,
  barcode_verified BOOLEAN,
  
  -- Raw Data
  raw_response JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_authenticity_status CHECK (authenticity_status IN ('genuine', 'fake', 'unknown', 'not_checked'))
);

-- Indexes for document_results
CREATE INDEX IF NOT EXISTS idx_document_session ON document_results(session_id);
CREATE INDEX IF NOT EXISTS idx_document_number ON document_results(document_number);
CREATE INDEX IF NOT EXISTS idx_document_created ON document_results(created_at DESC);

-- =====================================================
-- Table: face_results
-- Purpose: Store face verification and matching results
-- =====================================================
CREATE TABLE IF NOT EXISTS face_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES verification_sessions(id) ON DELETE CASCADE,
  
  -- Liveness Detection
  liveness_status VARCHAR(50),
  liveness_score DECIMAL(5,2),
  liveness_confidence DECIMAL(5,2),
  
  -- Face Matching
  match_status VARCHAR(50),
  match_score DECIMAL(5,2),
  similarity_score DECIMAL(5,2),
  
  -- Face Quality Metrics
  face_quality_score DECIMAL(5,2),
  face_detected BOOLEAN,
  face_count INTEGER,
  
  -- Images
  selfie_image_path VARCHAR(500),
  
  -- Raw Data
  raw_liveness_response JSONB,
  raw_match_response JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_liveness_status CHECK (liveness_status IN ('genuine', 'spoof', 'unknown', 'not_checked')),
  CONSTRAINT chk_match_status CHECK (match_status IN ('matched', 'not_matched', 'unknown', 'not_checked'))
);

-- Indexes for face_results
CREATE INDEX IF NOT EXISTS idx_face_session ON face_results(session_id);
CREATE INDEX IF NOT EXISTS idx_face_created ON face_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_liveness ON face_results(liveness_status);

-- =====================================================
-- Table: audit_logs
-- Purpose: Track all operations for compliance
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES verification_sessions(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  user_identifier VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_data JSONB,
  response_data JSONB,
  status VARCHAR(50),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_identifier);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verification_sessions_updated_at 
  BEFORE UPDATE ON verification_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Views: Convenient data access
-- =====================================================

-- Complete verification view
CREATE OR REPLACE VIEW complete_verifications AS
SELECT 
  vs.id,
  vs.status,
  vs.document_verified,
  vs.liveness_passed,
  vs.face_matched,
  vs.match_score,
  vs.created_at,
  vs.updated_at,
  dr.full_name,
  dr.document_type,
  dr.document_number,
  dr.nationality,
  dr.authenticity_status,
  fr.liveness_status,
  fr.match_status,
  fr.similarity_score
FROM verification_sessions vs
LEFT JOIN document_results dr ON vs.id = dr.session_id
LEFT JOIN face_results fr ON vs.id = fr.session_id;

-- Recent verifications view
CREATE OR REPLACE VIEW recent_verifications AS
SELECT * FROM complete_verifications
ORDER BY created_at DESC
LIMIT 100;

-- Successful verifications view
CREATE OR REPLACE VIEW successful_verifications AS
SELECT * FROM complete_verifications
WHERE status = 'completed' 
  AND document_verified = TRUE 
  AND liveness_passed = TRUE 
  AND face_matched = TRUE;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Insert a test session
-- INSERT INTO verification_sessions (id, status, user_identifier)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'pending', 'test-user');

-- =====================================================
-- Grants (if using specific user)
-- =====================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kyc_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kyc_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kyc_user;

-- =====================================================
-- Completion Message
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'KYC Demo database schema initialized successfully!';
    RAISE NOTICE 'Tables created: verification_sessions, document_results, face_results, audit_logs';
    RAISE NOTICE 'Views created: complete_verifications, recent_verifications, successful_verifications';
END $$;

