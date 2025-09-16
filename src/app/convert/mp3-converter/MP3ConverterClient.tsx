'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';

export default function MP3ConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'audio/wave', 'audio/x-wav', 'audio/vorbis', 'audio/x-ms-wma',
    'audio/aiff', 'audio/basic'
  ];
  const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'au'];

  const resetState = () => {
    setFile(null);
    setConvertedAudioUrl(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName('');
    setConvertProgress(0);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedAudioUrl(null);
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
      setError('Please upload an audio file first.');
      return;
    }
    setIsLoading(true);
    setConvertProgress(0);
    setError(null);
    setConvertedAudioUrl(null);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', '192'); // Default quality
      formData.append('mode', 'stereo'); // Default mode
      formData.append('normalize', 'true'); // Default normalize
      formData.append('removeSilence', 'false'); // Default remove silence

      const response = await fetch('/api/convert/mp3-converter', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'MP3 conversion failed.');
      }

      const result = await response.json();
      
      // Convert base64 to blob
      const byteCharacters = atob(result.audioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
    
    const url = URL.createObjectURL(blob);
      setConvertedAudioUrl(url);
      setConvertedFileName(result.fileName);
      setConvertProgress(100);

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert to MP3. Please try again.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [file]);

  const handleDownload = () => {
    if (convertedAudioUrl && convertedFileName) {
    const a = document.createElement('a');
      a.href = convertedAudioUrl;
      a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    }
  };


  const getFileIcon = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'mp3': return '🎵';
      case 'wav': return '🔊';
      case 'ogg': return '🎶';
      case 'flac': return '🎼';
      case 'aac': return '🎧';
      case 'm4a': return '🍎';
      case 'wma': return '🪟';
      case 'aiff': return '🎚️';
      default: return '🎵';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <FileUpload
            onFileChange={handleFileChange}
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            icon="🎵"
            placeholder="Upload an audio file to convert to MP3"
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
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-700 text-sm">{error}</p>
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
                  Converting to MP3...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Convert to MP3
                </>
              )}
            </span>
          </button>

          {/* Converting Progress */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                <span>Converting...</span>
                <span>{Math.round(convertProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${convertProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download Button */}
          {convertedAudioUrl && (
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-green-600/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center gap-3">
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download MP3 File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}