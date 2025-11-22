import React, { useEffect, useRef, useState } from 'react';
import '@regulaforensics/vp-frontend-document-components';

interface CyantechDocumentCaptureProps {
  onCapture: (images: string[]) => void;
  onClose?: () => void;
}

/**
 * Cyantech Document Reader SDK Camera Capture Component
 * Uses Document Reader web components for smart document capture
 * with automatic quality checks, edge detection, and guidance
 */
export const CyantechDocumentCapture: React.FC<CyantechDocumentCaptureProps> = ({
  onCapture,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initDocumentComponent = async () => {
      try {
        // Create document-reader web component
        const docComponent = document.createElement('document-reader') as any;
        
        // Configure Document Reader component for capture mode
        docComponent.setAttribute('locale', 'en');
        docComponent.setAttribute('theme', 'light');
        
        // Listen for ALL events to debug
        const allEventTypes = [
          'document-captured', 'image-captured', 'captured', 'photo-taken',
          'complete', 'done', 'finish', 'success', 'result'
        ];
        
        allEventTypes.forEach(eventType => {
          docComponent.addEventListener(eventType, (event: any) => {
            console.log(`🎯 Document Reader Event: "${eventType}"`, event);
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

        // Listen for processing complete (if component does processing)
        docComponent.addEventListener('processing-complete', (event: any) => {
          console.log('Document processing complete:', event);
        });

        // Listen for errors
        docComponent.addEventListener('error', (event: any) => {
          const { detail } = event;
          setError(detail?.message || 'Document capture error');
          console.error('Document Capture Error:', detail);
        });

        // Listen for close/cancel
        docComponent.addEventListener('close', () => {
          if (onClose) onClose();
        });

        // Listen for ready state
        docComponent.addEventListener('ready', () => {
          console.log('Document capture component ready');
          setIsInitialized(true);
        });

        containerRef.current.appendChild(docComponent);
        
        // Set initialized after a short delay if 'ready' event doesn't fire
        setTimeout(() => {
          setIsInitialized(true);
        }, 1000);
      } catch (err) {
        console.error('Failed to initialize Document Reader component:', err);
        setError('Failed to initialize document capture');
      }
    };

    initDocumentComponent();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [onCapture, onClose]);

  return (
    <div className="cyantech-document-capture-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isInitialized && !error && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Initializing document capture...</p>
        </div>
      )}

      <div ref={containerRef} className="w-full min-h-[500px]" />
    </div>
  );
};

export default CyantechDocumentCapture;

