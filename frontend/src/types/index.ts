// Verification Session Types
export interface VerificationSession {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
  document_verified: boolean;
  liveness_passed: boolean;
  face_matched: boolean;
  match_score: number | null;
  user_identifier?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Document Result Types
export interface DocumentResult {
  id: string;
  session_id: string;
  document_type: string | null;
  document_type_code: string | null;
  document_number: string | null;
  full_name: string | null;
  given_names: string | null;
  surname: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  issuing_country: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  face_image_path: string | null;
  document_image_path: string | null;
  authenticity_status: 'genuine' | 'fake' | 'unknown' | 'not_checked';
  authenticity_score: number | null;
  mrz_verified: boolean | null;
  barcode_verified: boolean | null;
  raw_response: any;
  created_at: string;
}

// Face Result Types
export interface FaceResult {
  id: string;
  session_id: string;
  liveness_status: 'genuine' | 'spoof' | 'unknown' | 'not_checked';
  liveness_score: number | null;
  liveness_confidence: number | null;
  match_status: 'matched' | 'not_matched' | 'unknown' | 'not_checked';
  match_score: number | null;
  similarity_score: number | null;
  face_quality_score: number | null;
  face_detected: boolean | null;
  face_count: number | null;
  selfie_image_path: string | null;
  authenticity_percentage: number | null;
  etalon_image_path: string | null;
  authenticity_image_path: string | null;
  raw_liveness_response: any;
  raw_match_response: any;
  created_at: string;
}

// Verification Report Types
export interface VerificationReport {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  verification_checks: {
    document_verified: boolean;
    liveness_passed: boolean;
    face_matched: boolean;
  };
  document_data: {
    full_name: string | null;
    given_names: string | null;
    surname: string | null;
    document_type: string | null;
    document_type_code: string | null;
    document_number: string | null;
    nationality: string | null;
    date_of_birth: string | null;
    expiry_date: string | null;
    issue_date: string | null;
    gender: string | null;
    issuing_country: string | null;
    issuing_authority: string | null;
    place_of_birth: string | null;
    address: string | null;
    personal_number: string | null;
    age: string | null;
    authenticity_status: string | null;
    authenticity_score: number | null;
    mrz_verified: boolean | null;
    barcode_verified: boolean | null;
    document_image_path: string | null;
    face_image_path: string | null;
  } | null;
  face_data: {
    liveness_status: string | null;
    liveness_score: number | string | null;
    liveness_confidence: number | string | null;
    liveness_transaction_id: string | null;
    liveness_tag: string | null;
    liveness_type: number | null;
    liveness_estimated_age: number | null;
    liveness_code: number | null;
    liveness_metadata: {
      elapsedTime?: number;
      serverTime?: string;
      ctx?: {
        userIp?: string;
      };
    } | null;
    liveness_images: string[] | null;
    match_status: string | null;
    match_score: number | string | null;
    similarity_score: number | string | null;
    selfie_image_path: string | null;
    document_face_image_path: string | null;
    etalon_image_path: string | null;
    authenticity_image_path: string | null;
  } | null;
  overall_match_score: number | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  session_id: string;
  document_result: DocumentResult;
}

export interface LivenessCheckResponse {
  success: boolean;
  session_id: string;
  liveness_result: {
    status: string;
    score: number;
    confidence: number;
  };
}

export interface FaceMatchResponse {
  success: boolean;
  session_id: string;
  match_result: {
    status: string;
    score: number;
    similarity: number;
  };
}

// Component Prop Types
export interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError?: (error: Error) => void;
}

export interface VerificationStatusProps {
  session: VerificationSession;
  documentResult?: DocumentResult;
  faceResult?: FaceResult;
}

// Verification Flow Step Type
export type VerificationStep = 
  | 'document-upload'
  | 'liveness-check'
  | 'face-match'
  | 'results';

// Verification Scenario Type
export type VerificationScenario = 
  | 'full' // Document + Face Match + Liveness
  | 'standard'; // Document + Face Match (no liveness)

export interface VerificationScenarioConfig {
  id: VerificationScenario;
  name: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
}

