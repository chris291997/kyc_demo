import React from 'react';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import type { VerificationReport } from '../types';

interface LivenessCardProps {
  faceData: VerificationReport['face_data'];
  isPassed: boolean | null | undefined; // null/undefined means not required
}

export const LivenessCard: React.FC<LivenessCardProps> = ({
  faceData,
  isPassed,
}) => {
  // Don't show card if liveness wasn't required (null/undefined)
  if (isPassed === null || isPassed === undefined) {
    return null;
  }

  if (!faceData) {
    return null;
  }

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
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl border-2 border-green-200 dark:border-green-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Liveness Status</p>
        <p className={`font-bold text-2xl mb-2 ${
          faceData.liveness_status === 'genuine'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {faceData.liveness_status?.toUpperCase() || 'N/A'}
        </p>
        {faceData.liveness_score !== null && faceData.liveness_score !== undefined && typeof faceData.liveness_score === 'number' && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Confidence Score</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {faceData.liveness_score.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  faceData.liveness_status === 'genuine'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-red-500 to-orange-600'
                }`}
                style={{
                  width: `${Math.min(faceData.liveness_score * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivenessCard;

