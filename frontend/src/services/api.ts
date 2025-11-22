import axios, { AxiosError } from 'axios';
import type {
  VerificationSession,
  DocumentResult,
  FaceResult,
  VerificationReport,
  DocumentProcessResponse,
  LivenessCheckResponse,
  FaceMatchResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for Cyantech processing
});

// Error handler
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // Server responded with error
    throw new Error(
      (error.response.data as any)?.message || 'Server error occurred'
    );
  } else if (error.request) {
    // Request made but no response
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// ============ Verification Session APIs ============

export const createVerificationSession = async (
  userIdentifier?: string
): Promise<VerificationSession> => {
  try {
    const response = await api.post('/verification', {
      user_identifier: userIdentifier,
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getVerificationSession = async (
  sessionId: string
): Promise<VerificationSession> => {
  try {
    const response = await api.get(`/verification/${sessionId}`);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getVerificationReport = async (
  sessionId: string
): Promise<VerificationReport> => {
  try {
    const response = await api.get(`/verification/${sessionId}/report`);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getAllVerifications = async (): Promise<VerificationSession[]> => {
  try {
    const response = await api.get('/verification');
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getVerificationStatistics = async () => {
  try {
    const response = await api.get('/verification/statistics');
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

// ============ Document Processing APIs ============

export const processDocument = async (
  sessionId: string,
  file: File
): Promise<DocumentProcessResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sessionId', sessionId);

    const response = await api.post('/document/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getDocumentResult = async (
  sessionId: string
): Promise<DocumentResult> => {
  try {
    const response = await api.get(`/document/${sessionId}`);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

// ============ Face Processing APIs ============

export const checkLiveness = async (
  sessionId: string,
  file: File
): Promise<LivenessCheckResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sessionId', sessionId);

    const response = await api.post('/face/liveness', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const checkLivenessFromBase64 = async (
  sessionId: string,
  imageBase64: string,
  livenessResult?: any
): Promise<LivenessCheckResponse> => {
  try {
    const response = await api.post('/face/liveness', {
      sessionId,
      imageBase64,
      livenessResult,
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const matchFacesWithDocument = async (
  sessionId: string,
  selfieFile: File
): Promise<FaceMatchResponse> => {
  try {
    const formData = new FormData();
    formData.append('selfie', selfieFile);
    formData.append('sessionId', sessionId);

    const response = await api.post('/face/match-with-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const matchFacesFromBase64 = async (
  sessionId: string,
  base64Image: string
): Promise<FaceMatchResponse> => {
  try {
    // Convert base64 to blob then to file
    const blob = await fetch(base64Image).then((r) => r.blob());
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

    return await matchFacesWithDocument(sessionId, file);
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const uploadVerificationImages = async (
  sessionId: string,
  documentFile: File,
  faceFile: File,
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('images', documentFile);
    formData.append('images', faceFile);
    formData.append('documentIndex', '0');
    formData.append('faceIndex', '1');

    const response = await api.post(`/verification/${sessionId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const getFaceResult = async (
  sessionId: string
): Promise<FaceResult> => {
  try {
    const response = await api.get(`/face/${sessionId}`);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

// ============ Health Check API ============

export const checkHealth = async () => {
  try {
    const response = await api.get('/health', {
      baseURL: API_URL, // Use root URL for health check
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export default api;

