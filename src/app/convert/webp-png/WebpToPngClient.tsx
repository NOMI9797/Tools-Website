"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function WebpToPngClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/webp'];
  const ALLOWED_EXTENSIONS = ['webp'];

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setConvertedImage(null);
    setConvertedFileName('');
    setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setConvertedImage(null);
      setConvertedFileName('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      resetState();
    }
  };


  const handleConvert = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/webp-png', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      setConvertedImage(`data:image/png;base64,${data.base64}`);
      setConvertedFileName(file.name.replace('.webp', '.png') || 'converted.png');
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedImage || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImage, convertedFileName]);


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="🖼️"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            onFileChange={handleFileChange}
            onError={setError}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Convert Button - Only show after file upload and before conversion */}
          {file && !convertedImage && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to PNG...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to PNG
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button - Only show after conversion */}
          {convertedImage && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PNG File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
