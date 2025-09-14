'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import FileUpload from '@/components/FileUpload';

export default function MP4ToMP3Client() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB with server-side fallback
  const supportedVideoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp'];
  const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv',
    'video/webm', 'video/x-matroska', 'video/x-m4v', 'video/3gpp'
  ];

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        // Only initialize FFmpeg on client side
        if (typeof window === 'undefined') return;
        
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        
        // Load FFmpeg
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setIsFFmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setError('Failed to load video converter. Please refresh the page and try again.');
      }
    };

    loadFFmpeg();
  }, []);

  const resetState = () => {
    setFile(null);
    setConvertedAudioUrl(null);
    setConvertedFileName('');
    setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setConvertedAudioUrl(null);
      setConvertedFileName('');
    } else {
      resetState();
    }
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('Please upload a video file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConvertedAudioUrl(null);

    // Try server-side conversion first for better reliability
    try {
      console.log('Attempting server-side conversion...');
      
        const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', '192');
      formData.append('startTime', '0');
      formData.append('duration', '');
      formData.append('normalize', 'true');

        const response = await fetch('/api/convert/mp4-mp3', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
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
        
        console.log('Server-side conversion successful');
        return;
      }
    } catch (serverError) {
      console.log('Server-side conversion failed, trying client-side...', serverError);
    }

    // Fallback to client-side conversion
    if (!isFFmpegLoaded) {
      setError('Video converter is still loading. Please wait a moment and try again.');
      setIsLoading(false);
      return;
    }

    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        setError('FFmpeg not initialized. Please refresh the page and try again.');
        setIsLoading(false);
        return;
      }
      
      const timestamp = Date.now();
      const inputFileName = `input_${timestamp}.mp4`;
      const outputFileName = `output_${timestamp}.mp3`;

      console.log('Starting client-side conversion...');
      
      // Write the file to FFmpeg's file system
      console.log('Writing file to FFmpeg filesystem...');
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile(inputFileName, fileData);
      console.log('File written successfully');

      // Run FFmpeg command to extract audio
      console.log('Running FFmpeg conversion...');
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // No video
        '-acodec', 'libmp3lame',
        '-ab', '192k', // 192 kbps bitrate
        '-ar', '44100', // Sample rate
        '-ac', '2', // Stereo
        '-y', // Overwrite output file
        outputFileName
      ]);
      console.log('FFmpeg conversion completed');

      // Read the result
      console.log('Reading output file...');
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      
      const url = URL.createObjectURL(blob);
      setConvertedAudioUrl(url);
      setConvertedFileName(`${file.name.split('.')[0]}.mp3`);

      console.log('Client-side conversion successful');

      // Clean up FFmpeg files
      try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
        console.log('Cleanup completed');
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }

    } catch (err: any) {
      console.error('Client-side conversion error:', err);
      
      // More specific error messages
      if (err.message?.includes('FS error')) {
        setError('File system error. Please try with a smaller file or a different video format.');
      } else if (err.message?.includes('Invalid data')) {
        setError('Invalid video file. Please check the file format and try again.');
      } else if (err.message?.includes('No such file')) {
        setError('File processing error. Please try again.');
      } else {
        setError('Conversion failed. Please try with a different file or refresh the page.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [file, isFFmpegLoaded]);

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


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
          <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="🎬"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={supportedVideoFormats}
            onFileChange={handleFileChange}
            onError={setError}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

            {/* Convert Button - Only show after file upload and before conversion */}
            {file && !convertedAudioUrl && (
              <button
                onClick={handleConvert}
                disabled={isLoading || !isFFmpegLoaded}
                className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
              >
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Converting to MP3...
                    </>
                  ) : !isFFmpegLoaded ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading Converter...
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
            )}

              {/* Download Button */}
          {convertedAudioUrl && (
              <button
                onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl"
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