import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Download,
  Shield,
  Loader2,
  Home,
  RefreshCw,
} from 'lucide-react';
import { getVerificationReport } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', sessionId],
    queryFn: () => getVerificationReport(sessionId!),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading verification results...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Results Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Could not load verification results for this session.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary inline-flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const allChecksPassed =
    report.verification_checks.document_verified &&
    report.verification_checks.liveness_passed &&
    report.verification_checks.face_matched;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Verification Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Session: <span className="font-mono text-sm">{sessionId}</span>
          </p>
        </div>

        {/* Overall Status Card */}
        <div
          className={`card mb-8 animate-scale-in ${
            allChecksPassed
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-2 border-green-300 dark:border-green-700'
              : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border-2 border-red-300 dark:border-red-700'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mr-6 ${
                allChecksPassed 
                  ? 'bg-green-500 dark:bg-green-600' 
                  : 'bg-red-500 dark:bg-red-600'
              }`}>
                {allChecksPassed ? (
                  <CheckCircle className="w-12 h-12 text-white" />
                ) : (
                  <XCircle className="w-12 h-12 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {allChecksPassed
                    ? '✓ Verification Successful'
                    : '✗ Verification Failed'}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {allChecksPassed
                    ? 'All checks passed successfully'
                    : 'Some verification checks failed'}
                </p>
              </div>
            </div>
            <button className="btn-primary flex items-center whitespace-nowrap">
              <Download className="w-5 h-5 mr-2" />
              Download Report
            </button>
          </div>
        </div>

        {/* Verification Checks */}
        <div className="card mb-8 animate-fade-in">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
            <FileText className="w-7 h-7 mr-3 text-blue-600 dark:text-blue-400" />
            Verification Checks
          </h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-5 rounded-xl transition-all ${
              report.verification_checks.document_verified
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700'
            }`}>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">Document Authentication</span>
              {report.verification_checks.document_verified ? (
                <span className="status-badge success flex items-center text-base">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verified
                </span>
              ) : (
                <span className="status-badge error flex items-center text-base">
                  <XCircle className="w-5 h-5 mr-2" />
                  Failed
                </span>
              )}
            </div>
            
            <div className={`flex items-center justify-between p-5 rounded-xl transition-all ${
              report.verification_checks.face_matched
                ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700'
            }`}>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">Face Matching</span>
              {report.verification_checks.face_matched ? (
                <span className="status-badge success flex items-center text-base">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Matched ({report.overall_match_score?.toFixed(1) || 'N/A'}%)
                </span>
              ) : (
                <span className="status-badge error flex items-center text-base">
                  <XCircle className="w-5 h-5 mr-2" />
                  Not Matched
                </span>
              )}
            </div>

            <div className={`flex items-center justify-between p-5 rounded-xl transition-all ${
              report.verification_checks.liveness_passed
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700'
            }`}>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">Liveness Detection</span>
              {report.verification_checks.liveness_passed ? (
                <span className="status-badge success flex items-center text-base">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Genuine
                </span>
              ) : (
                <span className="status-badge error flex items-center text-base">
                  <XCircle className="w-5 h-5 mr-2" />
                  Failed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Document Information */}
        {report.document_data && (
          <div className="card mb-8 animate-fade-in">
            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <CreditCard className="w-7 h-7 mr-3 text-purple-600 dark:text-purple-400" />
              Document Information
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {report.document_data.full_name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Number</p>
                  <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                    {report.document_data.document_number || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Document Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {report.document_data.document_type || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nationality</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {report.document_data.nationality || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {report.document_data.date_of_birth
                      ? new Date(report.document_data.date_of_birth).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expiry Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {report.document_data.expiry_date
                      ? new Date(report.document_data.expiry_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Authenticity Score */}
            {report.document_data.authenticity_status && (
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Authenticity Status</span>
                  <span
                    className={`status-badge text-base ${
                      report.document_data.authenticity_status === 'genuine'
                        ? 'success'
                        : 'error'
                    }`}
                  >
                    {report.document_data.authenticity_status.toUpperCase()}
                  </span>
                </div>
                {report.document_data.authenticity_score && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Confidence Score</span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.document_data.authenticity_score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          report.document_data.authenticity_status === 'genuine'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-red-500 to-orange-600'
                        }`}
                        style={{
                          width: `${report.document_data.authenticity_score}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Face Verification */}
        {report.face_data && (
          <div className="card mb-8 animate-fade-in">
            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <User className="w-7 h-7 mr-3 text-green-600 dark:text-green-400" />
              Face Verification
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Liveness Status</p>
                <p className="font-bold text-2xl text-gray-900 dark:text-white mb-2">
                  {report.face_data.liveness_status?.toUpperCase() || 'N/A'}
                </p>
                {report.face_data.liveness_score && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score: <span className="font-semibold">{report.face_data.liveness_score.toFixed(2)}</span>
                  </p>
                )}
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Match Status</p>
                <p className="font-bold text-2xl text-gray-900 dark:text-white mb-2">
                  {report.face_data.match_status?.toUpperCase() || 'N/A'}
                </p>
                {report.face_data.similarity_score && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Similarity: <span className="font-semibold">{report.face_data.similarity_score.toFixed(2)}%</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Start New Verification
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
