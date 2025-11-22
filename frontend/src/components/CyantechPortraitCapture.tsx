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
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initPortraitCapture = async () => {
      try {
        // Create face-capture web component for portrait capture
        // This is different from face-liveness which does liveness checks
        const faceComponent = document.createElement('face-capture') as any;
        
        // Configure for portrait capture ONLY (no liveness)
        faceComponent.setAttribute('locale', 'en');
        faceComponent.setAttribute('theme', 'light');
        
        // Listen for ALL events to debug
        const allEventTypes = [
          'image-captured', 'captured', 'photo-taken', 'face-captured',
          'complete', 'done', 'finish', 'success', 'result'
        ];
        
        allEventTypes.forEach(eventType => {
          faceComponent.addEventListener(eventType, (event: any) => {
            console.log(`👤 Face Capture Event: "${eventType}"`, event);
            console.log('Event detail:', event.detail);
            console.log('Full event object:', JSON.stringify(event, null, 2));
            
            const { detail } = event;
            
            // Try to extract image data from various possible structures
            if (detail) {
              if (detail.images && Array.isArray(detail.images)) {
                console.log('✅ Found images array, calling onCapture');
                onCapture(detail.images);
              } else if (detail.image) {
                console.log('✅ Found single image, calling onCapture');
                onCapture([detail.image]);
              } else if (typeof detail === 'string') {
                console.log('✅ Detail is string (base64?), calling onCapture');
                onCapture([detail]);
              } else if (Array.isArray(detail)) {
                console.log('✅ Detail is array, calling onCapture');
                onCapture(detail);
              } else {
                console.log('⚠️  Unrecognized detail structure');
              }
            } else {
              console.log('⚠️  No detail in event');
            }
          });
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
          console.log('Portrait capture component ready');
          setIsInitialized(true);
        });

        containerRef.current.appendChild(faceComponent);
        
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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
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

