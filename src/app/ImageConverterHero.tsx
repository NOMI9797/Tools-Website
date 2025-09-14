'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';

type TargetFormat = 'jpg' | 'png' | 'webp' | 'svg';

export default function ImageConverterHero() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [target, setTarget] = useState<TargetFormat>('png');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/bmp', 'image/tiff'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!ALLOWED_MIME_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff)$/i)) {
        setError('Please select a valid image file (JPG, PNG, WEBP, SVG, GIF, BMP, TIFF).');
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setConvertedImageUrl(null);
      setConvertedFileName('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      if (!ALLOWED_MIME_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff)$/i)) {
        setError('Please select a valid image file (JPG, PNG, WEBP, SVG, GIF, BMP, TIFF).');
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setConvertedImageUrl(null);
      setConvertedFileName('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('Please upload an image file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setConvertedImageUrl(null);

    try {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300/20 rounded-xl p-12 text-center hover:border-gray-400/30 transition-all duration-200 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🖼️</div>
            <div className="text-gray-700 font-medium mb-2 text-lg">Click to select or drag & drop</div>
            <div className="text-sm text-gray-600">Supports: JPG, PNG, WEBP, SVG, GIF, BMP, TIFF</div>
            <div className="text-xs text-gray-500 mt-2">Max file size: 50MB</div>
          </div>
          
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
                  Converting...
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