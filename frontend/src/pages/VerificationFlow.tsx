import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Upload,
  Camera,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Shield,
} from 'lucide-react';
import {
  getVerificationSession,
  checkLivenessFromBase64,
  matchFacesWithBase64,
  API_URL,
} from '../services/api';
import api from '../services/api';
import CyantechDocumentCapture from '../components/CyantechDocumentCapture';
import CyantechFaceCapture from '../components/CyantechFaceCapture';
import CyantechPortraitCapture from '../components/CyantechPortraitCapture';
import UploadZone from '../components/UploadZone';
import ThemeToggle from '../components/ThemeToggle';
import type { VerificationStep, VerificationScenario } from '../types';

function VerificationFlow() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get scenario from location state, default to 'full'
  const scenario: VerificationScenario = (location.state?.scenario as VerificationScenario) || 'full';
  const includesLiveness = scenario === 'full';

  const [currentStep, setCurrentStep] = useState<VerificationStep>('document-upload');
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [documentResult, setDocumentResult] = useState<any>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<any>(null);
  const [livenessResult, setLivenessResult] = useState<any>(null);
  
  // File states
  const [_documentFile, setDocumentFile] = useState<File | null>(null);
  const [_faceFile, setFaceFile] = useState<File | null>(null);
  
  // Preview states
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  
  // Camera toggle states
  const [showDocumentCamera, setShowDocumentCamera] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);

  // Query verification session
  const { data: _session, refetch } = useQuery({
    queryKey: ['verification', sessionId],
    queryFn: () => getVerificationSession(sessionId!),
    enabled: !!sessionId,
  });

  // Document upload mutation
  const documentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('documentIndex', '0');
      
      const response = await api.post(`/verification/${sessionId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      setDocumentResult(data.document_result);
      refetch();
      setCurrentStep('face-match');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Face upload mutation
  const faceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('faceIndex', '0');
      
      const response = await api.post(`/verification/${sessionId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      setFaceMatchResult(data.face_match_result);
      refetch();
      // Skip liveness if scenario is 'standard'
      if (includesLiveness) {
      setCurrentStep('liveness-check');
      } else {
        // Add a small delay to ensure data is saved before navigation
        setTimeout(() => {
          navigate(`/results/${sessionId}`);
        }, 500);
      }
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Liveness check mutation - sends complete liveness result from SDK
  const livenessMutation = useMutation({
    mutationFn: (data: { imageData: string; livenessResult: any }) => {
      return checkLivenessFromBase64(sessionId!, data.imageData, data.livenessResult);
    },
    onSuccess: (data) => {
      setLivenessResult(data);
      refetch().then(() => {
        setTimeout(() => {
      navigate(`/results/${sessionId}`);
        }, 1000);
      });
    },
    onError: (err: Error) => {
      console.error('Failed to save liveness result:', err);
      setError(`Failed to save liveness result: ${err.message}`);
    },
  });

  const handleDocumentUpload = (file: File) => {
    setDocumentFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    documentMutation.mutate(file);
  };

  const handleDocumentCameraCapture = (images: string[]) => {
    if (images && images.length > 0) {
      const base64Image = images[0];
      fetch(base64Image)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'document.jpg', { type: 'image/jpeg' });
          handleDocumentUpload(file);
          setShowDocumentCamera(false);
        })
        .catch(err => {
          console.error('Error converting image:', err);
          setError('Failed to process captured image');
        });
    }
  };

  const handleLivenessCapture = (imageData: string, livenessResult?: any) => {
    if (!livenessResult) {
      console.error('No liveness result received from SDK');
      setError('Liveness check completed but no result data. Please try again.');
      return;
    }
    
    setLivenessResult(livenessResult);
    livenessMutation.mutate({ imageData, livenessResult });
  };

  const handleFaceUpload = (file: File) => {
    setFaceFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFacePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    faceMutation.mutate(file);
  };

  const handleFaceCameraCapture = (images: string[]) => {
    console.log('📸 Face camera capture triggered with images:', images);
    
    if (!images || images.length === 0) {
      console.error('❌ No images received from SDK capture');
      setError('No image captured. Please try again.');
      return;
    }

      const base64Image = images[0];
    console.log('✅ Extracted base64 image, length:', base64Image?.length);
    
    // Set preview immediately
      setFacePreview(base64Image);
    setShowFaceCamera(false);
      
    // Convert base64 to File and submit for face matching (like upload)
    try {
      // Handle both data URL format (data:image/...) and plain base64
      let imageData = base64Image;
      if (!base64Image.startsWith('data:')) {
        imageData = `data:image/jpeg;base64,${base64Image}`;
      }
      
      fetch(imageData)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.statusText}`);
          }
          return res.blob();
        })
        .then(blob => {
          console.log('✅ Converted to blob, size:', blob.size);
          if (blob.size === 0) {
            throw new Error('Blob is empty');
          }
          const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
          setFaceFile(file);
          console.log('📤 Submitting face image for matching via upload endpoint...');
          faceMutation.mutate(file);
        })
        .catch(err => {
          console.error('❌ Error converting face image to File, trying base64 fallback:', err);
          // Fallback: try using base64 directly
          console.log('🔄 Attempting base64 direct submission...');
          const cleanBase64 = base64Image.includes(',') 
            ? base64Image.split(',')[1] 
            : base64Image;
          
          // Fallback: try using base64 directly via API
          matchFacesWithBase64(sessionId!, cleanBase64)
            .then(response => {
              console.log('✅ Face match successful via base64');
              setFaceMatchResult(response.match_result);
              refetch();
              // Skip liveness if scenario is 'standard'
              if (includesLiveness) {
                setCurrentStep('liveness-check');
              } else {
                // Add a small delay to ensure data is saved before navigation
                setTimeout(() => {
                  navigate(`/results/${sessionId}`);
                }, 500);
              }
              setError(null);
            })
            .catch(apiErr => {
              console.error('❌ Base64 submission also failed:', apiErr);
              setError(`Failed to process captured image: ${err.message}`);
            });
        });
    } catch (err) {
      console.error('❌ Error in handleFaceCameraCapture:', err);
      setError(`Failed to process captured image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const steps = includesLiveness 
    ? ['Upload Document', 'Face Matching', 'Liveness Check']
    : ['Upload Document', 'Face Matching'];
  const stepIndex = {
    'document-upload': 0,
    'face-match': 1,
    'liveness-check': includesLiveness ? 2 : 1,
    'results': includesLiveness ? 3 : 2,
  }[currentStep];

  const isLoading =
    documentMutation.isPending ||
    faceMutation.isPending ||
    livenessMutation.isPending;

  return (
    <div className="min-h-screen">
        {/* Header */}
      <header className="glass-effect sticky top-0 z-50 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header with Steps */}
        <div className="mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            Identity Verification
          </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Session: <span className="font-mono">{sessionId}</span>
                </p>
              </div>
            </div>
            
            {/* Compact Step Indicator */}
            <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-end">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index < stepIndex
                        ? 'bg-green-500 text-white'
                        : index === stepIndex
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index < stepIndex ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-medium transition-colors ${
                      index <= stepIndex 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-8 h-0.5 transition-colors ${
                      index < stepIndex ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl mb-8 animate-slide-down">
            <p className="font-semibold flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              Error
            </p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Main Content - Desktop: Side by Side, Mobile: Stacked */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Column - Step Cards */}
          <div className="flex-1 lg:w-2/3">
            <div className="card animate-fade-in mb-8 lg:mb-0">
          {currentStep === 'document-upload' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Capture Your Document</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Step 1 of {steps.length}</p>
                  </div>
                </div>
                {!showDocumentCamera && !documentPreview && (
                  <button
                    onClick={() => setShowDocumentCamera(true)}
                    className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all font-medium"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Use Camera
                  </button>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Use Cyantech's smart camera to capture your government-issued ID with automatic quality checks, 
                or upload an existing photo.
              </p>

              {documentPreview ? (
                <div className="space-y-4">
                  <div className="border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6 bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-4">📄 Document Preview</p>
                    <img 
                      src={documentPreview} 
                      alt="Document preview" 
                      className="max-w-full h-auto mx-auto rounded-lg shadow-xl"
                    />
                  </div>
                  {isLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Processing document...</span>
                    </div>
                  )}
                </div>
              ) : showDocumentCamera ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">
                      📸 Smart Document Capture Active
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Position your document within the frame. The camera will automatically capture when quality is optimal.
                    </p>
                  </div>
                  <CyantechDocumentCapture
                    onCapture={handleDocumentCameraCapture}
                    onClose={() => setShowDocumentCamera(false)}
                  />
                  <button
                    onClick={() => setShowDocumentCamera(false)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                  >
                    ← Back to file upload
                  </button>
                </div>
              ) : (
                <UploadZone
                  onFileSelect={handleDocumentUpload}
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                />
              )}
            </div>
          )}

          {currentStep === 'face-match' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-4">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Capture Your Face</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Step 2 of {steps.length}</p>
                  </div>
                </div>
                {!showFaceCamera && !facePreview && (
                  <button
                    onClick={() => setShowFaceCamera(true)}
                    className="flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all font-medium"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Use Camera
                  </button>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Take a clear selfie or upload a photo to match with your document photo.
              </p>

              {facePreview ? (
                <div className="space-y-4">
                  <div className="border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6 bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-4">👤 Face Preview</p>
                    <img 
                      src={facePreview} 
                      alt="Face preview" 
                      className="max-w-md mx-auto rounded-lg shadow-xl"
                    />
                  </div>
                  {isLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Matching faces...</span>
                    </div>
                  )}
                </div>
              ) : showFaceCamera ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <p className="text-sm text-purple-800 dark:text-purple-300 font-semibold mb-2">
                      📸 Portrait Capture Active
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Position your face in the center. The SDK will capture when face quality is optimal.
                    </p>
                  </div>
                  <CyantechPortraitCapture
                    onCapture={handleFaceCameraCapture}
                    onClose={() => setShowFaceCamera(false)}
                  />
                  <button
                    onClick={() => setShowFaceCamera(false)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                  >
                    ← Back to file upload
                  </button>
                </div>
              ) : (
                <UploadZone
                  onFileSelect={handleFaceUpload}
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                />
              )}
            </div>
          )}

          {currentStep === 'liveness-check' && includesLiveness && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-4">
                  <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liveness Check</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Final Step - Step {steps.length} of {steps.length}</p>
        </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
                <p className="text-sm text-green-800 dark:text-green-300 font-semibold mb-2">
                  🔒 Advanced Liveness Detection Active
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                  Cyantech Face SDK will verify you are physically present. Follow the on-screen instructions 
                  and make sure your face is well-lit and clearly visible.
                </p>
              </div>
              
              <CyantechFaceCapture
                onCapture={handleLivenessCapture}
                onClose={() => setError('Liveness check cancelled')}
              />
              
              {isLoading && (
                <div className="mt-8 flex items-center justify-center py-6">
                  <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin mr-3" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Verifying liveness...
                  </span>
                </div>
                )}
              </div>
          )}
            </div>
          </div>

          {/* Right Column - Results Cards */}
          {(documentResult || faceMatchResult || livenessResult) && (
            <div className="flex-1 lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-4 lg:space-y-4">
                {/* Document Results */}
          {documentResult && (
                  <div className="card bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">Document Processed</h3>
              </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {documentResult.full_name && (
                        <div className="col-span-1">
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Full Name:</span>
                          <p className="text-gray-900 dark:text-white text-sm font-bold mt-1">{documentResult.full_name}</p>
                  </div>
                )}
                {documentResult.given_names && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Given Names:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.given_names}</p>
                  </div>
                )}
                {documentResult.surname && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Surname:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.surname}</p>
                  </div>
                )}
                {documentResult.document_number && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Document Number:</span>
                          <p className="text-gray-900 dark:text-white font-mono text-xs mt-1">{documentResult.document_number}</p>
                  </div>
                )}
                {documentResult.document_type && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Document Type:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.document_type}</p>
                  </div>
                )}
                {documentResult.nationality && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Nationality:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.nationality}</p>
                        </div>
                      )}
                      {documentResult.date_of_birth && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Date of Birth:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">
                            {new Date(documentResult.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {documentResult.gender && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Gender:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.gender}</p>
                  </div>
                )}
                {documentResult.issuing_country && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Issuing Country:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.issuing_country}</p>
                  </div>
                )}
                {documentResult.age && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Age:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.age} years</p>
                  </div>
                )}
                {documentResult.issue_date && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Issue Date:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">
                            {new Date(documentResult.issue_date).toLocaleDateString()}
                          </p>
                  </div>
                )}
                {documentResult.expiry_date && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Expiry Date:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">
                            {new Date(documentResult.expiry_date).toLocaleDateString()}
                          </p>
                  </div>
                )}
                {documentResult.place_of_birth && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Place of Birth:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.place_of_birth}</p>
                  </div>
                )}
                {documentResult.personal_number && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Personal Number:</span>
                          <p className="text-gray-900 dark:text-white font-mono text-xs mt-1">{documentResult.personal_number}</p>
                  </div>
                )}
                {documentResult.address && (
                        <div className="col-span-1">
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Address:</span>
                          <p className="text-gray-900 dark:text-white text-xs mt-1">{documentResult.address}</p>
                  </div>
                )}
                </div>

                    {/* Authenticity Status */}
                    {documentResult.authenticity_status && (
                      <div className="mt-4 pt-4 border-t border-blue-300 dark:border-blue-800">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Authenticity:</span>
                  <div className="flex items-center gap-2 mt-1">
                          <p className={`font-bold text-sm ${
                      documentResult.authenticity_status === 'genuine' 
                              ? 'text-green-600 dark:text-green-400' 
                        : documentResult.authenticity_status === 'fake'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {documentResult.authenticity_status?.toUpperCase() || 'UNKNOWN'}
                    </p>
                    {documentResult.authenticity_score && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              ({documentResult.authenticity_score}%)
                      </span>
                    )}
                  </div>
                </div>
                    )}

                {/* MRZ and Barcode Verification */}
                {(documentResult.mrz_verified || documentResult.barcode_verified) && (
                  <div className="mt-4">
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Verification:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {documentResult.mrz_verified && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                          ✓ MRZ Verified
                        </span>
                      )}
                      {documentResult.barcode_verified && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                          ✓ Barcode Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

                {/* Face Match Results */}
          {faceMatchResult && (
                  <div className="card bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">Face Matched</h3>
              </div>
                    <div className="grid grid-cols-1 gap-3">
                <div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Match Status:</span>
                        <p className={`font-bold text-sm mt-1 ${
                    faceMatchResult.status === 'match' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                  }`}>
                    {faceMatchResult.status === 'match' ? '✓ MATCH' : '✗ NO MATCH'}
                  </p>
                </div>
                {faceMatchResult.match_score !== undefined && faceMatchResult.match_score !== null && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Match Score:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-900 dark:text-white font-bold text-sm">
                        {faceMatchResult.match_score.toFixed(1)}%
                      </p>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                                className={`h-2 rounded-full transition-all ${
                            faceMatchResult.match_score >= 75 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                              : faceMatchResult.match_score >= 50
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${Math.min(faceMatchResult.match_score, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Threshold: 75%
                    </p>
                  </div>
                )}
              </div>

              {/* Authenticity Images Preview */}
              {(faceMatchResult.etalon_image_path || faceMatchResult.authenticity_image_path) && (
                      <div className="mt-4 pt-4 border-t border-purple-300 dark:border-purple-800">
                        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-2">
                          📸 Comparison
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {faceMatchResult.authenticity_image_path && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">
                                DOCUMENT
                              </p>
                              <div className="relative group">
                        <img 
                                  src={`${API_URL}${faceMatchResult.authenticity_image_path.startsWith('/') ? '' : '/'}${faceMatchResult.authenticity_image_path}`}
                                  alt="Captured Selfie"
                                  className="w-full rounded-lg border border-purple-300 dark:border-purple-700 shadow-md object-cover aspect-square"
                          onError={(e) => {
                                    console.error('Failed to load authenticity image:', faceMatchResult.authenticity_image_path);
                            e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full aspect-square rounded-lg border border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20"><span class="text-xs text-gray-500 dark:text-gray-400">N/A</span></div>';
                                    }
                          }}
                        />
                              </div>
                      </div>
                    )}
                          {faceMatchResult.etalon_image_path && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">
                                SELFIE
                              </p>
                              <div className="relative group">
                                <img 
                                  src={`${API_URL}${faceMatchResult.etalon_image_path.startsWith('/') ? '' : '/'}${faceMatchResult.etalon_image_path}`}
                                  alt="Document Photo"
                                  className="w-full rounded-lg border border-purple-300 dark:border-purple-700 shadow-md object-cover aspect-square"
                          onError={(e) => {
                                    console.error('Failed to load etalon image:', faceMatchResult.etalon_image_path);
                            e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full aspect-square rounded-lg border border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20"><span class="text-xs text-gray-500 dark:text-gray-400">N/A</span></div>';
                                    }
                          }}
                        />
                              </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

                {/* Liveness Detection Results */}
          {livenessResult && (
                  <div className="card bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-300">Liveness Detection</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Liveness Status */}
                      {livenessResult.liveness_status && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Liveness Status:</span>
                          <p className={`font-bold text-sm mt-1 ${
                            livenessResult.liveness_status === 'genuine' 
                              ? 'text-green-600 dark:text-green-400' 
                              : livenessResult.liveness_status === 'spoof'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {livenessResult.liveness_status === 'genuine' ? '✓ LIVE PERSON' : 
                             livenessResult.liveness_status === 'spoof' ? '✗ SPOOF DETECTED' : 
                             '? UNKNOWN'}
                          </p>
                        </div>
                      )}

                      {/* Liveness Score */}
                      {livenessResult.liveness_score !== undefined && livenessResult.liveness_score !== null && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Liveness Score:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-900 dark:text-white font-bold text-sm">
                              {(livenessResult.liveness_score * 100).toFixed(1)}%
                            </p>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  livenessResult.liveness_score >= 0.75
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                    : livenessResult.liveness_score >= 0.5
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${Math.min(livenessResult.liveness_score * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Liveness Confidence */}
                      {livenessResult.liveness_confidence !== undefined && livenessResult.liveness_confidence !== null && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Confidence:</span>
                          <p className="text-gray-900 dark:text-white font-bold text-sm mt-1">
                            {(livenessResult.liveness_confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}

                      {/* Liveness Code */}
                      {livenessResult.liveness_code !== undefined && livenessResult.liveness_code !== null && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Result Code:</span>
                          <p className={`font-mono text-sm mt-1 ${
                            livenessResult.liveness_code === 0 
                              ? 'text-green-600 dark:text-green-400 font-bold' 
                              : 'text-red-600 dark:text-red-400 font-bold'
                          }`}>
                            {livenessResult.liveness_code} {livenessResult.liveness_code === 0 ? '(Success)' : '(Failed)'}
                          </p>
              </div>
                      )}

                      {/* Estimated Age */}
                      {livenessResult.liveness_estimated_age !== undefined && livenessResult.liveness_estimated_age !== null && (
                <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Estimated Age:</span>
                          <p className="text-gray-900 dark:text-white font-semibold text-sm mt-1">
                            {livenessResult.liveness_estimated_age} years
                          </p>
                </div>
                      )}

                      {/* Transaction ID */}
                      {livenessResult.liveness_transaction_id && (
                  <div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Transaction ID:</span>
                          <p className="text-gray-900 dark:text-white font-mono text-[10px] mt-1 break-all">
                            {livenessResult.liveness_transaction_id}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Technical Details (Collapsible) */}
                    {livenessResult.liveness_metadata && (
                      <details className="mt-4 pt-4 border-t border-green-300 dark:border-green-800">
                        <summary className="text-xs font-bold text-green-900 dark:text-green-300 mb-2 cursor-pointer hover:text-green-700 dark:hover:text-green-200">
                          🔧 Technical Details
                        </summary>
                        <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <pre className="text-[10px] text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(livenessResult.liveness_metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationFlow;
