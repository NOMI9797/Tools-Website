'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a';

export default function AudioConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [target, setTarget] = useState<AudioFormat>('mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'audio/wave', 'audio/x-wav', 'audio/vorbis'
  ];
  const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];

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
      formData.append('targetFormat', target);
      formData.append('quality', '192'); // Default quality

      const response = await fetch('/api/convert/audio-converter', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audio conversion failed.');
      }

      const result = await response.json();
      
      // Convert base64 to blob
      const byteCharacters = atob(result.audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      
      const url = URL.createObjectURL(blob);
      setConvertedAudioUrl(url);
      setConvertedFileName(result.fileName);
      setConvertProgress(100);

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert audio. Please try again.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [file, target]);

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
            placeholder="Upload an audio file to convert"
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

          {/* Format Selection */}
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Output Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] as AudioFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setTarget(format)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    target === format
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                      : 'bg-gray-300/50 text-gray-900 hover:bg-gray-400/50 border border-gray-300/50'
                  }`}
                >
                  <div className="text-lg mb-1">{getFileIcon(format)}</div>
                  <div className="text-xs uppercase">{format}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!file || isLoading}
            className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
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
                  Convert Audio
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
              className="w-full py-4 bg-green-600/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Converted Audio
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}