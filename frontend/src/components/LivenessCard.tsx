import React from 'react';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import type { VerificationReport } from '../types';
import ImageMagnifier from './ImageMagnifier';

interface LivenessCardProps {
  faceData: VerificationReport['face_data'];
  isPassed: boolean | null | undefined; // null/undefined means not required
}

// Helper function to map liveness code to human-readable text
const getLivenessCodeText = (code: number | string | null | undefined): string => {
  if (code === null || code === undefined) return 'N/A';
  const numCode = typeof code === 'string' ? parseInt(code) : code;
  
  switch (numCode) {
    case 0:
      return 'Genuine (Live Person)';
    case 247:
      return 'Spoof Detected';
    default:
      return `Code ${numCode}`;
  }
};

// Helper function to map liveness type to human-readable text
const getLivenessTypeText = (type: number | string | null | undefined): string => {
  if (type === null || type === undefined) return 'N/A';
  const numType = typeof type === 'string' ? parseInt(type) : type;
  
  switch (numType) {
    case 0:
      return 'Active Liveness';
    case 1:
      return 'Passive Liveness';
    default:
      return `Type ${numType}`;
  }
};

export const LivenessCard: React.FC<LivenessCardProps> = ({
  faceData,
  isPassed,
}) => {
  // Don't show card if liveness wasn't performed
  // Check if liveness_status exists (means liveness was performed)
  if (!faceData || (faceData.liveness_status === null || faceData.liveness_status === undefined || faceData.liveness_status === 'not_checked')) {
    return null;
  }

  // isPassed can be false (liveness failed) or true (liveness passed)
  // null/undefined means liveness wasn't performed, which we already checked above

  return (
    <div className={`card animate-fade-in ${
      isPassed
        ? 'bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800'
        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isPassed
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <Shield className={`w-6 h-6 ${
            isPassed
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Liveness Detection</h3>
          <div className="flex items-center gap-2 mt-1">
            {isPassed ? (
              <span className="status-badge success flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Genuine
              </span>
            ) : (
              <span className="status-badge error flex items-center text-sm">
                <XCircle className="w-4 h-4 mr-1" />
                Failed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Liveness Details */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Liveness Information Grid */}
        <div className="flex-1 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {faceData.liveness_score !== null && faceData.liveness_score !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Liveness Score</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {typeof faceData.liveness_score === 'string' 
                    ? parseFloat(faceData.liveness_score).toFixed(2) 
                    : faceData.liveness_score.toFixed(2)}
                </p>
              </div>
            )}

            {faceData.liveness_confidence !== null && faceData.liveness_confidence !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Confidence</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {typeof faceData.liveness_confidence === 'string' 
                    ? parseFloat(faceData.liveness_confidence).toFixed(2) 
                    : faceData.liveness_confidence.toFixed(2)}
                </p>
              </div>
            )}

            {faceData.liveness_code !== null && faceData.liveness_code !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Liveness Code</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getLivenessCodeText(faceData.liveness_code)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  Code: {faceData.liveness_code}
                </p>
              </div>
            )}

            {faceData.liveness_estimated_age !== null && faceData.liveness_estimated_age !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Age</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {faceData.liveness_estimated_age} years
                </p>
              </div>
            )}

            {faceData.liveness_type !== null && faceData.liveness_type !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Liveness Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getLivenessTypeText(faceData.liveness_type)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  Type: {faceData.liveness_type}
                </p>
              </div>
            )}

            {faceData.liveness_tag && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Liveness Tag</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono text-xs break-all">
                  {faceData.liveness_tag}
                </p>
              </div>
            )}
          </div>

          {faceData.liveness_transaction_id && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
              <p className="font-semibold text-gray-900 dark:text-white font-mono text-xs break-all">
                {faceData.liveness_transaction_id}
              </p>
            </div>
          )}

          {/* Metadata */}
          {faceData.liveness_metadata && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
              <details>
                <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
                  Additional Metadata
                </summary>
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto p-2 bg-white dark:bg-gray-900 rounded mt-2">
                  {JSON.stringify(faceData.liveness_metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Right Side - Liveness Images with Magnifier - Responsive cropped portrait */}
        {faceData.liveness_images && Array.isArray(faceData.liveness_images) && faceData.liveness_images.length > 0 && (
          <div className="flex flex-col gap-3 items-center lg:items-start">
            {faceData.liveness_images.slice(0, 3).map((image, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="relative w-40 h-52 sm:w-44 sm:h-56 md:w-48 md:h-60 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <ImageMagnifier
                    src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                    alt={`Liveness Frame ${index + 1}`}
                    className="w-full h-full"
                    objectFit="cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        faceData.liveness_status === 'genuine'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {faceData.liveness_status?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {faceData.liveness_images.length > 3 && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                +{faceData.liveness_images.length - 3} more frame{faceData.liveness_images.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivenessCard;

