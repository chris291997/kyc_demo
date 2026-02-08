import React, { useState, useRef, MouseEvent } from 'react';
import { ZoomIn, ZoomOut, X, Maximize2 } from 'lucide-react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  className?: string;
  magnifierHeight?: number;
  magnifierWidth?: number;
  zoomLevel?: number;
  objectFit?: 'cover' | 'contain';
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  className = '',
  magnifierHeight = 150,
  magnifierWidth = 150,
  zoomLevel = 1.5,
  objectFit = 'cover',
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  const [[imgWidth, imgHeight], setSize] = useState([0, 0]);
  const [[offsetX, offsetY], setOffset] = useState([0, 0]);
  const imgRef = useRef<HTMLImageElement>(null);

  const mouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    const img = imgRef.current;
    
    if (img && objectFit === 'cover') {
      // For object-cover, calculate the actual displayed image dimensions
      const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = width / height;
      
      let displayedWidth, displayedHeight, imgOffsetX, imgOffsetY;
      
      if (imgNaturalRatio > containerRatio) {
        // Image is wider - height fills container, width is cropped
        displayedHeight = height;
        displayedWidth = height * imgNaturalRatio;
        imgOffsetX = (width - displayedWidth) / 2;
        imgOffsetY = 0;
      } else {
        // Image is taller - width fills container, height is cropped
        displayedWidth = width;
        displayedHeight = width / imgNaturalRatio;
        imgOffsetX = 0;
        imgOffsetY = (height - displayedHeight) / 2;
      }
      
      setSize([displayedWidth, displayedHeight]);
      setOffset([imgOffsetX, imgOffsetY]);
    } else {
      setSize([width, height]);
      setOffset([0, 0]);
    }
    setShowMagnifier(true);
  };

  const mouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const elem = e.currentTarget;
    const { top, left } = elem.getBoundingClientRect();

    // Calculate cursor position on the image
    const x = e.pageX - left - window.pageXOffset;
    const y = e.pageY - top - window.pageYOffset;
    setXY([x, y]);
  };

  const mouseLeave = () => {
    setShowMagnifier(false);
  };

  return (
    <>
      {/* Image Container */}
      <div
        className={`relative ${className} group`}
        onMouseEnter={mouseEnter}
        onMouseMove={mouseMove}
        onMouseLeave={mouseLeave}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover object-center'} cursor-zoom-in`}
        />

          {/* Magnifier Glass */}
          {showMagnifier && (
            <div
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                height: `${magnifierHeight}px`,
                width: `${magnifierWidth}px`,
                top: `${y - magnifierHeight / 2}px`,
                left: `${x - magnifierWidth / 2}px`,
                opacity: '1',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                backgroundColor: 'white',
                backgroundImage: `url('${src}')`,
                backgroundRepeat: 'no-repeat',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
                backgroundPositionX: `${-(x - offsetX) * zoomLevel + magnifierWidth / 2}px`,
                backgroundPositionY: `${-(y - offsetY) * zoomLevel + magnifierHeight / 2}px`,
              }}
            />
          )}

        {/* Zoom Icon Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowFullScreen(true)}
            className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="View full size"
          >
            <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Full Screen Modal */}
      {showFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-screen">
            {/* Close Button */}
            <button
              onClick={() => setShowFullScreen(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Full Size Image */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
              <p className="text-sm">{alt}</p>
              <p className="text-xs text-gray-300 mt-1">Click outside to close</p>
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowFullScreen(false)}
          />
        </div>
      )}
    </>
  );
};

export default ImageMagnifier;

