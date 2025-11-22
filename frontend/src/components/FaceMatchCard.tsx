import React from 'react';
import { CheckCircle, XCircle, User } from 'lucide-react';
import type { VerificationReport } from '../types';
import { API_URL } from '../services/api';

interface FaceMatchCardProps {
  faceData: VerificationReport['face_data'];
  documentData?: VerificationReport['document_data'] | null;
  isMatched: boolean;
  matchScore?: number | null;
}

export const FaceMatchCard: React.FC<FaceMatchCardProps> = ({
  faceData,
  documentData,
  isMatched,
  matchScore,
}) => {
  // Show card even if no data, but with a message
  if (!faceData) {
    return (
      <div className="card animate-fade-in bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Face Match Results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No face matching data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine colors based on match status - green for matched, red for not matched
  const isMatchedStatus = faceData.match_status === 'matched' || faceData.match_status === 'match' || isMatched;
  
  // Helper to convert string/number to number
  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  
  const displayScore = toNumber(matchScore) ?? toNumber(faceData.match_score);

  // Build image URLs - images are served from /uploads/ prefix (not /api/uploads/)
  // The API_URL already includes /api, so we need to remove it for static files
  const baseUrl = API_URL.replace('/api', '');
  
  // Helper to convert file path to URL
  const pathToUrl = (filePath: string | null): string | null => {
    if (!filePath) return null;
    // If path already starts with /uploads/, use it directly
    if (filePath.startsWith('/uploads/')) {
      return `${baseUrl}${filePath}`;
    }
    // Otherwise, extract the relative path from uploads directory
    // Path format: ./uploads/subfolder/sessionId/filename or uploads/subfolder/sessionId/filename
    const relativePath = filePath.replace(/^\.\/uploads\//, '/uploads/').replace(/^uploads\//, '/uploads/');
    return `${baseUrl}${relativePath}`;
  };
  
  // Use the uploaded images from /verification/{id}/images endpoint
  // Match VerificationFlow.tsx mapping exactly:
  // - authenticity_image_path = DOCUMENT (face from document) - line 757-777
  // - selfie_image_path = SELFIE (uploaded portrait) - preferred
  // - etalon_image_path = SELFIE (fallback) - line 779-797
  // Document Photo priority:
  // 1. document_data.face_image_path (face extracted from document - preferred, but missing in response)
  // 2. face_data.authenticity_image_path (matches VerificationFlow "DOCUMENT" label)
  const documentFaceImageUrl = pathToUrl(
    documentData?.face_image_path || 
    faceData?.document_face_image_path || 
    faceData?.authenticity_image_path || 
    null
  );
  
  // Selfie Photo priority:
  // 1. face_data.selfie_image_path (uploaded selfie/portrait - preferred)
  // 2. face_data.etalon_image_path (fallback - matches VerificationFlow "SELFIE" label)
  const selfieImageUrl = pathToUrl(
    faceData.selfie_image_path || 
    faceData?.etalon_image_path || 
    null
  );

  return (
    <div className={`card animate-fade-in ${
      isMatchedStatus
        ? 'bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isMatchedStatus
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          <User className={`w-6 h-6 ${
            isMatchedStatus
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Face Match Results</h3>
          <div className="flex items-center gap-2 mt-1">
            {isMatchedStatus ? (
              <span className="status-badge success flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Matched {displayScore !== null ? `(${displayScore.toFixed(1)}%)` : ''}
              </span>
            ) : (
              <span className="status-badge error flex items-center text-sm">
                <XCircle className="w-4 h-4 mr-1" />
                Not Matched
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview Images - Show uploaded images from /verification/{id}/images endpoint */}
      {(documentFaceImageUrl || selfieImageUrl) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {documentFaceImageUrl && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium text-center">Document Photo</p>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img 
                  src={documentFaceImageUrl} 
                  alt="Document Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
          {selfieImageUrl && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium text-center">Selfie Photo</p>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img 
                  src={selfieImageUrl} 
                  alt="Selfie Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default FaceMatchCard;

