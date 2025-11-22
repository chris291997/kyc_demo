import React, { useEffect, useRef, useState } from 'react';
import '@regulaforensics/vp-frontend-face-components';

interface CyantechFaceCaptureProps {
  onCapture: (image: string, livenessResult?: any) => void;
  onClose?: () => void;
}

/**
 * Cyantech Face SDK Camera Capture Component
 * Provides built-in liveness detection and face quality checks
 */
export const CyantechFaceCapture: React.FC<CyantechFaceCaptureProps> = ({
  onCapture,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cyantech Face SDK Component
    const initFaceComponent = async () => {
      try {
        const faceComponent = document.createElement('face-liveness');
        
        // Configure Face SDK component
        faceComponent.setAttribute('service-url', import.meta.env.VITE_API_URL + '/api/face/liveness');
        
        // Optional: Customize UI
        faceComponent.setAttribute('locale', 'en');
        faceComponent.setAttribute('theme', 'light');
        
        // Listen for liveness complete event (when check is done)
        faceComponent.addEventListener('complete', (event: any) => {
          console.log('Liveness complete event:', event);
          const { detail } = event;
          if (detail) {
            // Extract image and liveness result
            const image = detail.image || detail.bestShot?.image;
            const livenessResult = detail.liveness || detail;
            
            console.log('Liveness result:', livenessResult);
            onCapture(image, livenessResult);
          }
        });

        // Also listen for face-captured as fallback
        faceComponent.addEventListener('face-captured', (event: any) => {
          console.log('Face captured event:', event);
          const { detail } = event;
          if (detail && detail.image) {
            onCapture(detail.image, detail);
          }
        });

        // Listen for errors
        faceComponent.addEventListener('error', (event: any) => {
          const { detail } = event;
          console.error('Liveness error:', detail);
          setError(detail?.message || 'Face capture error');
        });

        // Listen for close/cancel
        faceComponent.addEventListener('close', () => {
          console.log('Liveness closed');
          if (onClose) onClose();
        });

        containerRef.current.appendChild(faceComponent);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Face SDK component:', err);
        setError('Failed to initialize face capture');
      }
    };

    initFaceComponent();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [onCapture, onClose]);

  return (
    <div className="cyantech-face-capture-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isInitialized && !error && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Initializing face capture...</p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default CyantechFaceCapture;

