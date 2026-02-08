import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  Shield,
  Loader2,
  Home,
  RefreshCw,
} from 'lucide-react';
import { getVerificationReport } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import DocumentResultCard from '../components/DocumentResultCard';
import FaceMatchCard from '../components/FaceMatchCard';
import LivenessCard from '../components/LivenessCard';

function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, error: queryError } = useQuery({
    queryKey: ['report', sessionId],
    queryFn: () => getVerificationReport(sessionId!),
    enabled: !!sessionId,
    retry: 1,
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

  if (queryError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Error Loading Results</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {queryError instanceof Error ? queryError.message : 'Could not load verification results for this session.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Session ID: <span className="font-mono">{sessionId}</span>
          </p>
          <button onClick={() => navigate('/')} className="btn-primary inline-flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen">
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
      </div>
    );
  }

  // For standard scenario (no liveness), only check document and face match
  // For full scenario, check all three
  // Determine if liveness was actually performed by checking liveness_status
  // If liveness_status is null/undefined, liveness wasn't performed (standard scenario)
  // liveness_passed can be false even if liveness wasn't performed (due to default value)
  const livenessRequired = report.face_data?.liveness_status !== null && 
                           report.face_data?.liveness_status !== undefined;

  const allChecksPassed =
    report.verification_checks?.document_verified &&
    report.verification_checks?.face_matched &&
    (!livenessRequired || report.verification_checks?.liveness_passed);

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

        {/* Verification Result Cards */}
        <div className="space-y-6 mb-8">
          {/* Document Result Card */}
          {report.verification_checks && (
            <DocumentResultCard
              documentData={report.document_data || null}
              isVerified={report.verification_checks.document_verified || false}
            />
              )}

          {/* Face Match Card */}
          {report.verification_checks && (
            <FaceMatchCard
              faceData={report.face_data || null}
              documentData={report.document_data || null}
              isMatched={report.verification_checks.face_matched || false}
              matchScore={report.overall_match_score || null}
            />
          )}

          {/* Liveness Card (only shown if liveness was required) */}
          {report.verification_checks && livenessRequired && (
            <LivenessCard
              faceData={report.face_data || null}
              isPassed={report.verification_checks.liveness_passed}
            />
          )}

          {/* Fallback message if no data available */}
          {(!report.verification_checks || (!report.document_data && !report.face_data)) && (
            <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
              <div className="text-center py-8">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  No verification data available yet.
                </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please complete the verification process to see results.
                </p>
              </div>
            </div>
          )}
          </div>

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
