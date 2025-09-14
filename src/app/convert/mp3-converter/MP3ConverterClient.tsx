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
  };

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setConvertedAudioUrl(null);
    setConvertedFileName('');
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('Please upload an audio file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setConvertedAudioUrl(null);

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

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert to MP3. Please try again.');
    } finally {
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
            onFileSelect={handleFileChange}
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            icon="🎵"
            placeholder="Upload an audio file to convert to MP3"
          />

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

          {/* Download Button */}
          {convertedAudioUrl && (
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-green-600/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative z-10"
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