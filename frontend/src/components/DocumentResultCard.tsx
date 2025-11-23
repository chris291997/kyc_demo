import React from 'react';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import type { VerificationReport } from '../types';
import ImageMagnifier from './ImageMagnifier';

interface DocumentResultCardProps {
  documentData: VerificationReport['document_data'];
  isVerified: boolean;
}

export const DocumentResultCard: React.FC<DocumentResultCardProps> = ({
  documentData,
  isVerified,
}) => {
  // Show card even if no data, but with a message
  if (!documentData) {
    return (
      <div className="card animate-fade-in bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Document Verification Results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No document data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card animate-fade-in ${
      isVerified
        ? 'bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800'
        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isVerified
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <FileText className={`w-6 h-6 ${
              isVerified
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Document Verification Results</h3>
            <div className="flex items-center gap-2 mt-1">
              {isVerified ? (
                <span className="status-badge success flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
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
        
        {/* Authenticity Status and Confidence Score - Right side of header */}
        {documentData.authenticity_status && (
          <div className="flex flex-col items-end gap-1.5 text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Authenticity:</span>
              <span className={`status-badge text-xs ${
                documentData.authenticity_status === 'genuine'
                  ? 'success'
                  : 'error'
              }`}>
                {documentData.authenticity_status.toUpperCase()}
              </span>
            </div>
            {documentData.authenticity_score !== null && documentData.authenticity_score !== undefined && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Confidence: </span>
                  <span className="font-semibold">
                    {typeof documentData.authenticity_score === 'number' 
                      ? documentData.authenticity_score.toFixed(1) 
                      : typeof documentData.authenticity_score === 'string'
                      ? parseFloat(documentData.authenticity_score).toFixed(1)
                      : documentData.authenticity_score}%
                  </span>
                </div>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      documentData.authenticity_status === 'genuine'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-red-500 to-orange-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        typeof documentData.authenticity_score === 'number' 
                          ? documentData.authenticity_score 
                          : typeof documentData.authenticity_score === 'string'
                          ? parseFloat(documentData.authenticity_score)
                          : 0,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Information Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Document Details */}
        <div className="flex-1">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {documentData.full_name && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.full_name}
                </p>
              </div>
            )}

            {documentData.given_names && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Given Names</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.given_names}
                </p>
              </div>
            )}

            {documentData.surname && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Surname</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.surname}
                </p>
              </div>
            )}

            {documentData.document_number && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Number</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                  {documentData.document_number}
                </p>
              </div>
            )}

            {documentData.document_type && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.document_type}
                </p>
              </div>
            )}

            {documentData.document_type_code && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Type Code</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                  {documentData.document_type_code}
                </p>
              </div>
            )}

            {documentData.nationality && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nationality</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.nationality}
                </p>
              </div>
            )}

            {documentData.date_of_birth && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(documentData.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}

            {documentData.expiry_date && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expiry Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(documentData.expiry_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {documentData.issue_date && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Issue Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(documentData.issue_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {documentData.gender && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.gender}
                </p>
              </div>
            )}

            {documentData.issuing_country && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Issuing Country</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.issuing_country}
                </p>
              </div>
            )}

            {documentData.issuing_authority && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Issuing Authority</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.issuing_authority}
                </p>
              </div>
            )}

            {documentData.place_of_birth && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Place of Birth</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.place_of_birth}
                </p>
              </div>
            )}

            {documentData.address && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.address}
                </p>
              </div>
            )}

            {documentData.personal_number && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Personal Number</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                  {documentData.personal_number}
                </p>
              </div>
            )}

            {documentData.age && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Age</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {documentData.age}
                </p>
              </div>
            )}
          </div>

          {/* Verification Checks */}
          {(documentData.mrz_verified !== null || documentData.barcode_verified !== null) && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Verification Checks</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {documentData.mrz_verified !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">MRZ Verified</span>
                    <span className={`status-badge text-sm ${documentData.mrz_verified ? 'success' : 'error'}`}>
                      {documentData.mrz_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                )}
                {documentData.barcode_verified !== null && documentData.barcode_verified && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Barcode Verified</span>
                    <span className="status-badge text-sm success">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Document Image with Magnifier */}
        {documentData.document_image_path && (
          <div className="lg:w-96">
            <div className="sticky top-24">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium text-center">Document Image</p>
              <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <ImageMagnifier
                  src={`${import.meta.env.VITE_API_URL}/${documentData.document_image_path}`}
                  alt="Document"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DocumentResultCard;

