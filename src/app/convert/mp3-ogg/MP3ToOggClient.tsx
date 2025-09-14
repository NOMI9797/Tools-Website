'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import FileUpload from '@/components/FileUpload';

interface ConversionSettings {
  quality: 'high' | 'medium' | 'low';
  bitrate: 'auto' | '320' | '256' | '192' | '128' | '96' | '64';
  sampleRate: 'original' | '48000' | '44100' | '22050' | '11025';
  channels: 'original' | 'stereo' | 'mono';
  encodingMode: 'vbr' | 'cbr' | 'abr';
}

export default function MP3ToOggClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 'medium',
    bitrate: 'auto',
    sampleRate: 'original',
    channels: 'original',
    encodingMode: 'vbr'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'audio/wave', 'audio/x-wav', 'audio/vorbis'
  ];
  const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'au'];

  const resetState = () => {
    setFile(null);
    setConvertedFile(null);
    setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setConvertedFile(null);
    } else {
      resetState();
    }
  };

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });
        
        ffmpeg.on('progress', ({ progress }) => {
          setProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setError('Failed to load audio converter. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);


  const handleConvert = async () => {
    if (!file || !ffmpegLoaded || !ffmpegRef.current) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // First try server-side conversion
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', settings.quality);
      formData.append('bitrate', settings.bitrate);
      formData.append('sampleRate', settings.sampleRate);
      formData.append('channels', settings.channels);
      formData.append('encodingMode', settings.encodingMode);

      try {
        const response = await fetch('/api/convert/mp3-ogg', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setConvertedFile(blob);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server conversion failed, falling back to client-side');
      }

      // Client-side conversion fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      const inputName = 'input.mp3';
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Build FFmpeg command based on settings
      let command = ['-i', inputName];
      
      // Audio codec
      command.push('-c:a', 'libvorbis');
      
      // Quality settings
      switch (settings.quality) {
        case 'high':
          command.push('-q:a', '6');
          break;
        case 'medium':
          command.push('-q:a', '4');
          break;
        case 'low':
          command.push('-q:a', '2');
          break;
      }
      
      // Sample rate
      if (settings.sampleRate !== 'original') {
        command.push('-ar', settings.sampleRate);
      }
      
      // Channels
      if (settings.channels !== 'original') {
        if (settings.channels === 'mono') {
          command.push('-ac', '1');
        } else {
          command.push('-ac', '2');
        }
      }
      
      // Encoding mode and bitrate
      if (settings.encodingMode === 'cbr' && settings.bitrate !== 'auto') {
        command.push('-b:a', `${settings.bitrate}k`);
      } else if (settings.encodingMode === 'abr' && settings.bitrate !== 'auto') {
        command.push('-abr', '1', '-b:a', `${settings.bitrate}k`);
      }
      
      // Output
      command.push('-y', 'output.ogg');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.ogg');
      const blob = new Blob([data], { type: 'audio/ogg' });
      
      setConvertedFile(blob);
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile('output.ogg');
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setError('Conversion failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${file?.name?.replace(/\.[^/.]+$/, '') || 'audio'}.ogg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="🎵"
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
          {file && !convertedFile && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to OGG...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to OGG
                  </>
                )}
              </span>
            </button>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="w-full bg-gray-300/50 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-gray-500 to-gray-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Download Button - Only show after conversion */}
          {convertedFile && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download OGG File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
