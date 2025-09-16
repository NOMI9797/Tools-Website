"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function HeicToPdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedPdf, setConvertedPdf] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/heic', 'image/heif'];
  const ALLOWED_EXTENSIONS = ['heic', 'heif'];

  const resetState = () => {
    setFiles([]);
    setConvertedPdf(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    setConvertProgress(0);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    // Simulate upload progress and accumulate files
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedPdf(null);
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
          setFiles(prev => {
            const exists = prev.some(f => f.name === selectedFile.name && f.size === selectedFile.size);
            if (exists) return prev;
            return [...prev, selectedFile];
          });
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };


  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    setConvertProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await fetch('/api/convert/heic-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert images');
      }

      const data = await res.json();
      setConvertedPdf(`data:application/pdf;base64,${data.base64}`);
      setConvertedFileName(files.length === 1 
        ? files[0].name.replace(/\.heic$/i, '.pdf')
        : 'converted.pdf');
      setConvertProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        alert(`Conversion failed: ${error.message}`);
      } else {
        alert('Failed to convert images. Please ensure all files are valid HEIC images and try again.');
      }
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedPdf || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedPdf;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedPdf, convertedFileName]);


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="📱"
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-gray-700 font-medium mb-2">Selected images ({files.length})</div>
              <ul className="max-h-40 overflow-auto space-y-1 text-sm text-gray-700">
                {files.map((f, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="truncate mr-3">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Convert Button - Only show after file upload and before conversion */}
          {files.length > 0 && !convertedPdf && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to PDF
                  </>
                )}
              </span>
            </button>
          )}

          {/* Converting Progress */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                <span>Converting to PDF...</span>
                <span>{Math.round(convertProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${convertProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Download Button - Only show after conversion */}
          {convertedPdf && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
