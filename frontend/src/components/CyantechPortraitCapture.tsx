import React, { useEffect, useRef, useState } from 'react';
import '@regulaforensics/vp-frontend-face-components';

interface CyantechPortraitCaptureProps {
  onCapture: (images: string[]) => void;
  onClose?: () => void;
}

/**
 * Cyantech Face SDK Portrait Capture Component
 * Uses Face SDK web components for quality-checked portrait capture
 * Configured for CAPTURE ONLY - NO liveness processing
 */
export const CyantechPortraitCapture: React.FC<CyantechPortraitCaptureProps> = ({
  onCapture,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const faceComponentRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const initPortraitCapture = async () => {
      try {
        // Create face-capture web component for portrait capture
        const faceComponent = document.createElement('face-capture') as any;
        faceComponentRef.current = faceComponent;
        
        // Configure using settings (not attributes) to avoid deprecation warning
        const settings = {
          locale: 'en',
          theme: 'light',
          mode: 'capture',
          showResult: true,
          returnBase64: true,
          returnImage: true,
        };
        
        // Use settings if available (newer API)
        if (faceComponent.settings !== undefined) {
          faceComponent.settings = settings;
        } else if (faceComponent.setConfig) {
          faceComponent.setConfig(settings);
        } else {
          // Fallback to attributes if settings not available
        faceComponent.setAttribute('locale', 'en');
        faceComponent.setAttribute('theme', 'light');
        }
        
        // Helper function to convert Blob to base64
        const blobToBase64 = (blob: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };
        
        // Hook into onEvent method - this is how the component handles events internally
        if (faceComponent.onEvent && typeof faceComponent.onEvent === 'function') {
          const originalOnEvent = faceComponent.onEvent.bind(faceComponent);
          faceComponent.onEvent = function(...args: any[]) {
            // Check each argument for PROCESS_FINISHED action with image data
            args.forEach((arg) => {
              if (arg && typeof arg === 'object' && arg.action === 'PROCESS_FINISHED' && arg.data) {
                // Extract image from data.response.capture array
                if (arg.data.response && arg.data.response.capture) {
                  const captureArray = arg.data.response.capture;
                  if (Array.isArray(captureArray) && captureArray.length > 0 && !hasCapturedRef.current) {
                    const imageBase64 = captureArray[0];
                    
                    // Convert to data URL if needed
                    let imageData = imageBase64;
                    if (!imageBase64.startsWith('data:')) {
                      imageData = `data:image/jpeg;base64,${imageBase64}`;
                    }
                    
                    hasCapturedRef.current = true;
                    onCapture([imageData]);
                  }
                }
              }
            });
            
            return originalOnEvent.apply(this, args);
          };
        }
        
        // Primary handler for 'capture' event (returns Blob in event.detail.image)
        faceComponent.addEventListener('capture', async (event: any) => {
          if (hasCapturedRef.current) {
            return;
          }
            
            const { detail } = event;
            
          if (detail && detail.image) {
            try {
              if (detail.image instanceof Blob) {
                const base64String = await blobToBase64(detail.image);
                hasCapturedRef.current = true;
                onCapture([base64String]);
              } else if (typeof detail.image === 'string') {
                hasCapturedRef.current = true;
                onCapture([detail.image]);
              }
            } catch (err) {
              console.error('Error processing captured image:', err);
              setError('Failed to process captured image');
              }
          }
        });

        // Listen for errors
        faceComponent.addEventListener('error', (event: any) => {
          const { detail } = event;
          setError(detail?.message || 'Portrait capture error');
          console.error('Cyantech Portrait Capture Error:', detail);
        });

        // Listen for close/cancel
        faceComponent.addEventListener('close', () => {
          if (onClose) onClose();
        });

        // Listen for ready state
        faceComponent.addEventListener('ready', () => {
          setIsInitialized(true);
        });

        if (containerRef.current) {
        containerRef.current.appendChild(faceComponent);
        }
        
        // Set initialized after a short delay if 'ready' event doesn't fire
        setTimeout(() => {
          setIsInitialized(true);
        }, 1000);
      } catch (err) {
        console.error('Failed to initialize portrait capture component:', err);
        setError('Failed to initialize portrait capture');
      }
    };

    initPortraitCapture();

    // Cleanup
    return () => {
      if (containerRef.current && faceComponentRef.current) {
        try {
          containerRef.current.removeChild(faceComponentRef.current);
        } catch (err) {
          // Component may have already been removed
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
          }
        }
      }
    };
  }, [onCapture, onClose]);

  return (
    <div className="cyantech-portrait-capture-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isInitialized && !error && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="ml-4 text-gray-600">Initializing portrait capture...</p>
        </div>
      )}

      <div ref={containerRef} className="w-full min-h-[500px]" />
    </div>
  );
};

export default CyantechPortraitCapture;

