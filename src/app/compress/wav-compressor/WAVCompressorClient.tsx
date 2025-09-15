'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import FileUpload from '@/components/FileUpload';

interface CompressionSettings {
  compressionType: 'downsample' | 'convert';
  bitDepth: '16' | '8';
  sampleRate: '44100' | '22050' | '11025';
  mp3Bitrate: '320' | '256' | '192' | '128' | '96' | '64';
  mp3EncodingMode: 'cbr' | 'vbr' | 'abr';
}

export default function WAVCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading WAV compressor...");
  const [compressedFileName, setCompressedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [settings, setSettings] = useState<CompressionSettings>({
    compressionType: 'convert',
    bitDepth: '16',
    sampleRate: '22050',
    mp3Bitrate: '96',
    mp3EncodingMode: 'cbr'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
  const ALLOWED_MIME_TYPES = ['audio/wav', 'audio/wave', 'audio/x-wav'];
  const ALLOWED_EXTENSIONS = ['wav'];

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

        setLoadingMessage("Loading FFmpeg core...");
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        setLoadingMessage("WAV compressor ready!");
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setError('Failed to load WAV compressor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const resetState = () => {
    setFile(null);
    setCompressedFile(null);
    setCompressedFileName("");
    setError(null);
    setProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFile: File) => {
    // Simulate upload progress (client-side selection UX)
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setCompressedFile(null);
    setCompressedFileName("");
    setProgress(0);

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
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  const handleCompress = async () => {
    if (!file || !ffmpegLoaded || !ffmpegRef.current) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // First try server-side compression
      const formData = new FormData();
      formData.append('file', file);
      formData.append('compressionType', settings.compressionType);
      formData.append('bitDepth', settings.bitDepth);
      formData.append('sampleRate', settings.sampleRate);
      formData.append('mp3Bitrate', settings.mp3Bitrate);
      formData.append('mp3EncodingMode', settings.mp3EncodingMode);

      try {
        const response = await fetch('/api/compress/wav', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setCompressedFile(blob);
          const extension = settings.compressionType === 'downsample' ? 'wav' : 'mp3';
          setCompressedFileName(`compressed_${file.name.replace('.wav', '')}.${extension}`);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server compression failed, falling back to client-side');
      }

      // Client-side compression fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      await ffmpeg.writeFile('input.wav', await fetchFile(file));
      
      // Build FFmpeg command based on settings
      let command = ['-i', 'input.wav'];
      
      if (settings.compressionType === 'downsample') {
        // WAV downsampling
        command.push('-acodec', 'pcm_s16le');
        command.push('-ar', settings.sampleRate);
        command.push('-ac', '2'); // Stereo
        
        // Bit depth handling
        if (settings.bitDepth === '8') {
          command.push('-acodec', 'pcm_u8');
        }
        
        command.push('-y', 'output.wav');
      } else {
        // Convert to MP3
        command.push('-c:a', 'libmp3lame');
        
        // MP3 encoding settings
        switch (settings.mp3EncodingMode) {
          case 'cbr':
            command.push('-b:a', `${settings.mp3Bitrate}k`);
            command.push('-joint_stereo', '1');
            break;
          case 'vbr':
            const vbrQuality = settings.mp3Bitrate === '320' ? '0' : 
                              settings.mp3Bitrate === '256' ? '2' :
                              settings.mp3Bitrate === '192' ? '4' :
                              settings.mp3Bitrate === '128' ? '6' :
                              settings.mp3Bitrate === '96' ? '8' : '9';
            command.push('-q:a', vbrQuality);
            break;
          case 'abr':
            command.push('-abr', '1', '-b:a', `${settings.mp3Bitrate}k`);
            command.push('-joint_stereo', '1');
            break;
        }
        
        command.push('-y', 'output.mp3');
      }
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const outputFileName = settings.compressionType === 'downsample' ? 'output.wav' : 'output.mp3';
      const data = await ffmpeg.readFile(outputFileName);
      const mimeType = settings.compressionType === 'downsample' ? 'audio/wav' : 'audio/mpeg';
      const blob = new Blob([data], { type: mimeType });
      
      setCompressedFile(blob);
      const extension = settings.compressionType === 'downsample' ? 'wav' : 'mp3';
      setCompressedFileName(`compressed_${file.name.replace('.wav', '')}.${extension}`);
      
      // Cleanup
      await ffmpeg.deleteFile('input.wav');
      await ffmpeg.deleteFile(outputFileName);
      
    } catch (error) {
      console.error('Compression failed:', error);
      setError('Compression failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (compressedFile) {
      const url = URL.createObjectURL(compressedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = compressedFileName || `compressed_${file?.name?.replace('.wav', '') || 'audio'}.${settings.compressionType === 'downsample' ? 'wav' : 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionTypeDescription = (type: string) => {
    return type === 'downsample' 
      ? 'Keep WAV format but reduce quality/size' 
      : 'Convert to MP3 for maximum compression';
  };

  const getBitDepthDescription = (depth: string) => {
    return depth === '16' ? '16-bit (CD quality)' : '8-bit (lower quality, smaller size)';
  };

  const getSampleRateDescription = (rate: string) => {
    const descriptions: Record<string, string> = {
      '44100': '44.1 kHz (CD quality)',
      '22050': '22.05 kHz (half CD quality)',
      '11025': '11.025 kHz (quarter CD quality)'
    };
    return descriptions[rate] || rate;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <FileUpload
            onFileChange={handleFileChange}
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            icon="🎵"
            placeholder="Upload a WAV file to compress"
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

          {/* Compression Settings */}
          {file && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Compression Settings</h3>
            
              <div className="space-y-4">
                {/* Compression Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression Method
                  </label>
                  <select
                    value={settings.compressionType}
                    onChange={(e) => setSettings({...settings, compressionType: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="downsample">Downsample WAV (Keep WAV format)</option>
                    <option value="convert">Convert to MP3 (Maximum compression)</option>
                  </select>
                </div>

                {/* WAV Downsampling Settings */}
                {settings.compressionType === 'downsample' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bit Depth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bit Depth
                      </label>
                      <select
                        value={settings.bitDepth}
                        onChange={(e) => setSettings({...settings, bitDepth: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      >
                        <option value="16">16-bit (CD quality)</option>
                        <option value="8">8-bit (lower quality, smaller size)</option>
                      </select>
                    </div>

                    {/* Sample Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sample Rate
                      </label>
                      <select
                        value={settings.sampleRate}
                        onChange={(e) => setSettings({...settings, sampleRate: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      >
                        <option value="44100">44.1 kHz (CD quality)</option>
                        <option value="22050">22.05 kHz (half CD quality)</option>
                        <option value="11025">11.025 kHz (quarter CD quality)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* MP3 Conversion Settings */}
                {settings.compressionType === 'convert' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* MP3 Bitrate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MP3 Bitrate
                      </label>
                      <select
                        value={settings.mp3Bitrate}
                        onChange={(e) => setSettings({...settings, mp3Bitrate: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      >
                        <option value="320">320 kbps - High quality</option>
                        <option value="256">256 kbps - Very good quality</option>
                        <option value="192">192 kbps - Good quality</option>
                        <option value="128">128 kbps - Standard quality</option>
                        <option value="96">96 kbps - Lower quality (50% smaller)</option>
                        <option value="64">64 kbps - Low quality (70% smaller)</option>
                      </select>
                    </div>

                    {/* MP3 Encoding Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MP3 Encoding Mode
                      </label>
                      <select
                        value={settings.mp3EncodingMode}
                        onChange={(e) => setSettings({...settings, mp3EncodingMode: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      >
                        <option value="cbr">CBR - Constant Bitrate</option>
                        <option value="vbr">VBR - Variable Bitrate</option>
                        <option value="abr">ABR - Average Bitrate</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Compress Button */}
          {file && (
            <button
              onClick={handleCompress}
              disabled={isLoading || !ffmpegLoaded}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Compressing... {progress}%
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Compress WAV
                  </>
                )}
              </span>
            </button>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Compressing audio...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-300/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-600 to-gray-700 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          {compressedFile && (
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-green-600/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Compressed File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
