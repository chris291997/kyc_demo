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
        // IMPORTANT: Set service-url to point to the Regula Face SDK service
        // This is required for liveness detection to work and return transactionId
        const faceSdkUrl = 'http://localhost:8081';
        faceComponent.setAttribute('service-url', faceSdkUrl);
        
        // Optional: Customize UI
        faceComponent.setAttribute('locale', 'en');
        faceComponent.setAttribute('theme', 'light');
        
        // Optional: Configure settings if the component supports it
        if (faceComponent.settings !== undefined) {
          faceComponent.settings = {
            locale: 'en',
            theme: 'light',
            returnBase64: true,
            returnImage: true,
            serviceUrl: faceSdkUrl,
          };
        }

        // Intercept onEvent hook if available (similar to portrait capture)
        if (faceComponent.onEvent && typeof faceComponent.onEvent === 'function') {
          const originalOnEvent = faceComponent.onEvent.bind(faceComponent);
          faceComponent.onEvent = function(...args: any[]) {
            args.forEach((arg) => {
              if (arg && typeof arg === 'object') {
                // Check for PROCESS_FINISHED action
                if (arg.action === 'PROCESS_FINISHED' && arg.data) {
                  if (arg.data.status === 1 && arg.data.response) {
                    const response = arg.data.response;
                    let image: string | null = null;
                    
                    // Extract image
                    if (response.capture && Array.isArray(response.capture) && response.capture.length > 0) {
                      image = response.capture[0];
                    } else if (response.portrait) {
                      image = response.portrait;
                    } else if (response.image) {
                      image = response.image;
                    }
                    
                    // Pass the COMPLETE response object
                    const livenessResult = {
                      ...response,  // Include ALL response data
                      transactionId: response?.transactionId || arg.data?.transactionId,
                      tag: response?.tag || arg.data?.tag,
                      ...(response?.status !== undefined ? { status: response.status } : {}),
                    };
                    
                    // Ensure image is base64 format
                    if (image && !image.startsWith('data:')) {
                      image = `data:image/jpeg;base64,${image}`;
                    }
                    
                    if (image) {
                      onCapture(image, livenessResult);
                    } else {
                      onCapture('', livenessResult);
                    }
                  }
                }
              }
            });
            return originalOnEvent.apply(this, args);
          };
        }
        
        // Listen for face-liveness event (the actual event name from Regula SDK)
        faceComponent.addEventListener('face-liveness', (event: any) => {
          const { detail } = event;
          
          if (!detail) {
            console.warn('⚠️ face-liveness event has no detail');
            return;
          }
          
          // Check if the process has finished
          if (detail.action === 'PROCESS_FINISHED') {
            // Check if successful (status === 1 means success in Regula SDK)
            if (detail.data && detail.data.status === 1) {
              const response = detail.data.response;
              
              // Extract image from response
              let image: string | null = null;
              if (response?.capture && Array.isArray(response.capture) && response.capture.length > 0) {
                image = response.capture[0];
              } else if (response?.portrait) {
                image = response.portrait;
              } else if (response?.image) {
                image = response.image;
              } else if (response?.bestShot?.image) {
                image = response.bestShot.image;
              }
              
              // Pass the COMPLETE response object to backend
              const livenessResult = {
                ...response,
                transactionId: response?.transactionId || detail.data?.transactionId,
                tag: response?.tag || detail.data?.tag,
                ...(response?.status !== undefined ? { status: response.status } : {}),
              };
              
              // Ensure image is base64 format
              if (image && !image.startsWith('data:')) {
                image = `data:image/jpeg;base64,${image}`;
              }
              
              if (image) {
                onCapture(image, livenessResult);
              } else {
                console.warn('⚠️ No image found in liveness response');
                onCapture('', livenessResult);
              }
            } else {
              // Liveness check failed
              const reason = detail.data?.reason || 'Unknown reason';
              console.error('❌ Liveness check failed:', reason);
              setError(`Liveness check failed: ${reason}`);
            }
          }
        });

        // Listen for errors
        faceComponent.addEventListener('error', (event: any) => {
          const { detail } = event;
          console.error('❌ Liveness error event:', detail);
          setError(detail?.message || detail?.reason || 'Face capture error');
        });

        // Listen for close/cancel
        faceComponent.addEventListener('close', () => {
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

