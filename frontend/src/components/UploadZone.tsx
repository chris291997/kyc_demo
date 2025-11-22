import { useRef, useState, DragEvent } from 'react';
import { Upload, FileCheck, X } from 'lucide-react';
import type { UploadZoneProps } from '../types';

function UploadZone({ onFileSelect, accept = 'image/*', maxSize = 10485760 }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onFileSelect(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  return (
    <div>
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-md mx-auto rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700"
            />
            <div className="flex items-center justify-center text-green-600 dark:text-green-400">
              <FileCheck className="w-6 h-6 mr-2" />
              <span className="font-semibold">Image loaded successfully</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Upload different image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Drop your document here
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                or <span className="text-blue-600 dark:text-blue-400 font-semibold">click to browse</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Supported formats: JPG, PNG • Max {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium animate-slide-down">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default UploadZone;

