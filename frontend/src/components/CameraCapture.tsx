import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCw, Check } from 'lucide-react';
import type { CameraCaptureProps } from '../types';

function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setImageSrc(null);
  };

  const handleConfirm = () => {
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    if (onError) {
      onError(
        new Error(
          typeof error === 'string'
            ? error
            : 'Failed to access camera. Please check permissions.'
        )
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="webcam-container">
        {imageSrc ? (
          <img src={imageSrc} alt="Captured" className="w-full" />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="w-full"
          />
        )}
      </div>

      {!isCameraReady && !imageSrc && (
        <div className="text-center text-gray-600">
          <p>Initializing camera...</p>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        {imageSrc ? (
          <>
            <button onClick={handleRetake} className="btn-secondary flex items-center">
              <RotateCw className="w-5 h-5 mr-2" />
              Retake Photo
            </button>
            <button onClick={handleConfirm} className="btn-success flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Use This Photo
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!isCameraReady}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capture Photo
          </button>
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>📸 Make sure your face is centered and well-lit</p>
        <p>✨ Remove glasses or face coverings if possible</p>
      </div>
    </div>
  );
}

export default CameraCapture;

