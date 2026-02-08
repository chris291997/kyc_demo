import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCw, Check, X } from 'lucide-react';

interface CyantechDocumentCaptureProps {
  onCapture: (images: string[]) => void;
  onClose?: () => void;
}

/**
 * Custom Document Capture Component
 * Provides a live camera feed with ID-sized box guide overlay
 * for positioning documents correctly
 */
export const CyantechDocumentCapture: React.FC<CyantechDocumentCaptureProps> = ({
  onCapture,
  onClose,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID card dimensions: Standard credit card size (85.6mm x 53.98mm)
  // Aspect ratio: ~1.586:1 (width:height)
  const ID_ASPECT_RATIO = 1.586;

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: { ideal: 'environment' }, // Use back camera if available
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
    }
  }, []);

  const handleRetake = () => {
    setImageSrc(null);
  };

  const handleConfirm = () => {
    if (imageSrc) {
      onCapture([imageSrc]);
    }
  };

  const handleUserMedia = () => {
    setIsCameraReady(true);
    setError(null);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    const errorMessage = typeof error === 'string' 
      ? error 
      : 'Failed to access camera. Please check permissions and ensure no other app is using the camera.';
    setError(errorMessage);
    setIsCameraReady(false);
  };

  // Calculate box guide dimensions based on container size
  const [guideDimensions, setGuideDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateGuideDimensions = () => {
      // Use a percentage of the viewport for the guide box
      // ID cards are typically ~85.6mm x 53.98mm
      const maxWidth = Math.min(window.innerWidth * 0.85, 600);
      const calculatedHeight = maxWidth / ID_ASPECT_RATIO;
      
      setGuideDimensions({
        width: maxWidth,
        height: calculatedHeight,
      });
    };

    updateGuideDimensions();
    window.addEventListener('resize', updateGuideDimensions);
    return () => window.removeEventListener('resize', updateGuideDimensions);
  }, []);

  return (
    <div className="cyantech-document-capture-container relative w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
        {imageSrc ? (
          <div className="relative w-full h-full">
            <img 
              src={imageSrc} 
              alt="Captured document" 
              className="w-full h-auto object-contain"
            />
            {/* Overlay guide on captured image */}
            <div 
              className="absolute border-4 border-blue-500 rounded-lg pointer-events-none"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${guideDimensions.width}px`,
                height: `${guideDimensions.height}px`,
                maxWidth: '90%',
                maxHeight: '90%',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="w-full h-full object-cover"
              mirrored={false}
            />
            
            {/* Box guide overlay */}
            {isCameraReady && (
              <div 
                className="absolute border-4 border-blue-500 rounded-lg pointer-events-none z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${guideDimensions.width}px`,
                  height: `${guideDimensions.height}px`,
                  maxWidth: '90%',
                  maxHeight: '90%',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                
                {/* Center alignment guide */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 transform -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500/50 transform -translate-x-1/2"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isCameraReady && !imageSrc && !error && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Initializing camera...</p>
        </div>
      )}

      {/* Instructions */}
      {!imageSrc && isCameraReady && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Instructions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Position your ID card within the blue frame</li>
            <li>• Ensure all four corners are visible</li>
            <li>• Make sure the document is flat and well-lit</li>
            <li>• Avoid shadows and glare</li>
            <li>• Keep the camera steady</li>
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 justify-center mt-6">
        {imageSrc ? (
          <>
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
            >
              <RotateCw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Check className="w-5 h-5" />
              Use This Photo
            </button>
          </>
        ) : (
          <>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            )}
            <button
              onClick={handleCapture}
              disabled={!isCameraReady}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Capture Document
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CyantechDocumentCapture;
