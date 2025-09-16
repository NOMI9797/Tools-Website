'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';

type TargetFormat = 'jpg' | 'png' | 'webp' | 'svg';

export default function ImageConverterHero() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [target, setTarget] = useState<TargetFormat>('png');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/bmp', 'image/tiff'];
  const ALLOWED_EXTENSIONS = ['jpg','jpeg','png','webp','svg','gif','bmp','tiff'];
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setConvertedImageUrl(null);
      setConvertedFileName('');
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName('');
      setError(null);
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedImageUrl(null);
    setConvertedFileName('');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFile(selectedFile);
          setUploadingFileName('');
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('Please upload an image file first.');
      return;
    }
    setIsLoading(true);
    setConvertProgress(0);
    setError(null);
    setConvertedImageUrl(null);

    try {
      // Simulated converting progress while waiting for server
      let current = 0;
      const interval = setInterval(() => {
        current += Math.random() * 15 + 5;
        if (current >= 95) current = 95;
        setConvertProgress(current);
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', target);
      formData.append('quality', '80');

      const response = await fetch('/api/convert/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Image conversion failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setConvertedImageUrl(url);
      const newFileName = file.name.replace(/\.[^/.]+$/, "") + `.${target === 'jpeg' ? 'jpg' : target}`;
      setConvertedFileName(newFileName);
      setConvertProgress(100);

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file, target]);

  const handleDownload = () => {
    if (convertedImageUrl && convertedFileName) {
      const a = document.createElement('a');
      a.href = convertedImageUrl;
      a.download = convertedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleReset = () => {
    setFile(null);
    setConvertedImageUrl(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName('');
    setConvertProgress(0);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tool Heading */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Image Converter
        </h2>
        <p className="text-lg text-gray-700">
          Transform your images between JPG, PNG, WEBP, and SVG formats
        </p>
      </div>
      
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area via FileUpload */}
          <FileUpload
            placeholder="Choose Files"
            icon="🖼️"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            onFileChange={handleFileChange}
            onError={setError}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Uploading {uploadingFileName}...</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {file && (
            <div className="p-4 bg-gray-200/20 border border-gray-300/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🖼️</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{file.name}</div>
                  <div className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!file || isLoading}
            className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting... {Math.round(convertProgress)}%
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Convert Image
                </>
              )}
            </span>
          </button>

          {/* Converting Progress */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Converting image...</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(convertProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-gray-500 to-gray-700 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${convertProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Download Button */}
          {convertedImageUrl && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-3">
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Converted Image
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}