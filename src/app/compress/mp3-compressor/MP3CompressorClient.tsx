'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

interface CompressionSettings {
  bitrate: '320' | '256' | '192' | '128' | '96' | '64';
  encodingMode: 'cbr' | 'vbr' | 'abr';
  quality: 'high' | 'medium' | 'low';
}

export default function MP3CompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [settings, setSettings] = useState<CompressionSettings>({
    bitrate: '128',
    encodingMode: 'cbr',
    quality: 'medium'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setError('Failed to load MP3 compressor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'audio/mpeg' && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
        setError('Please select a valid MP3 file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setCompressedFile(null);
    }
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
      formData.append('bitrate', settings.bitrate);
      formData.append('encodingMode', settings.encodingMode);
      formData.append('quality', settings.quality);

      try {
        const response = await fetch('/api/compress/mp3', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setCompressedFile(blob);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server compression failed, falling back to client-side');
      }

      // Client-side compression fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      await ffmpeg.writeFile('input.mp3', await fetchFile(file));
      
      // Build FFmpeg command based on settings
      let command = ['-i', 'input.mp3'];
      
      // Audio codec and bitrate
      command.push('-c:a', 'libmp3lame');
      
      // Encoding mode and bitrate
      switch (settings.encodingMode) {
        case 'cbr':
          command.push('-b:a', `${settings.bitrate}k`);
          break;
        case 'vbr':
          const vbrQuality = settings.quality === 'high' ? '0' : settings.quality === 'medium' ? '4' : '9';
          command.push('-q:a', vbrQuality);
          break;
        case 'abr':
          command.push('-abr', '1', '-b:a', `${settings.bitrate}k`);
          break;
      }
      
      // Additional quality settings
      if (settings.encodingMode === 'cbr' || settings.encodingMode === 'abr') {
        command.push('-joint_stereo', '1');
      }
      
      // Output
      command.push('-y', 'output.mp3');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp3');
      const blob = new Blob([data], { type: 'audio/mpeg' });
      
      setCompressedFile(blob);
      
      // Cleanup
      await ffmpeg.deleteFile('input.mp3');
      await ffmpeg.deleteFile('output.mp3');
      
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
      a.download = `compressed_${file?.name || 'audio.mp3'}`;
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

  const getBitrateDescription = (bitrate: string) => {
    const descriptions: Record<string, string> = {
      '320': 'High quality (320 kbps)',
      '256': 'Very good quality (256 kbps)',
      '192': 'Good quality (192 kbps)',
      '128': 'Standard quality (128 kbps)',
      '96': 'Lower quality (96 kbps)',
      '64': 'Low quality (64 kbps)'
    };
    return descriptions[bitrate] || bitrate;
  };

  const getEncodingModeDescription = (mode: string) => {
    const descriptions: Record<string, string> = {
      'cbr': 'Constant Bitrate - Consistent quality',
      'vbr': 'Variable Bitrate - Optimized file size',
      'abr': 'Average Bitrate - Balanced approach'
    };
    return descriptions[mode] || mode;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select MP3 File
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose MP3 File
          </button>
          {file && (
            <span className="text-sm text-gray-600">
              {file.name} ({formatFileSize(file.size)})
            </span>
          )}
        </div>
      </div>

      {/* Compression Settings */}
      {file && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Compression Settings</h3>
          
          {/* Bitrate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitrate
            </label>
            <select
              value={settings.bitrate}
              onChange={(e) => setSettings({...settings, bitrate: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="320">320 kbps - High quality</option>
              <option value="256">256 kbps - Very good quality</option>
              <option value="192">192 kbps - Good quality</option>
              <option value="128">128 kbps - Standard quality</option>
              <option value="96">96 kbps - Lower quality</option>
              <option value="64">64 kbps - Low quality</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getBitrateDescription(settings.bitrate)}
            </p>
          </div>

          {/* Encoding Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encoding Mode
            </label>
            <select
              value={settings.encodingMode}
              onChange={(e) => setSettings({...settings, encodingMode: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cbr">CBR - Constant Bitrate</option>
              <option value="vbr">VBR - Variable Bitrate</option>
              <option value="abr">ABR - Average Bitrate</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getEncodingModeDescription(settings.encodingMode)}
            </p>
          </div>

          {/* Quality (for VBR) */}
          {settings.encodingMode === 'vbr' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VBR Quality
              </label>
              <select
                value={settings.quality}
                onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="high">High Quality (0)</option>
                <option value="medium">Medium Quality (4)</option>
                <option value="low">Low Quality (9)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers = higher quality, larger file size
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compress Button */}
      {file && (
        <div className="mb-6">
          <button
            onClick={handleCompress}
            disabled={isLoading || !ffmpegLoaded}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? `Compressing... ${progress}%` : 'Compress MP3'}
          </button>
        </div>
      )}

      {/* Progress */}
      {isLoading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {compressedFile && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compression Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Original</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(file?.size || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Compressed</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(compressedFile.size)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Compression Ratio</h4>
            <p className="text-sm text-gray-600">
              {file && compressedFile && (
                <>
                  {Math.round(((file.size - compressedFile.size) / file.size) * 100)}% smaller
                  <br />
                  {formatFileSize(file.size - compressedFile.size)} saved
                </>
              )}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Settings Used</h4>
            <p className="text-sm text-gray-600">
              Bitrate: {settings.bitrate} kbps<br />
              Mode: {settings.encodingMode.toUpperCase()}<br />
              {settings.encodingMode === 'vbr' && `Quality: ${settings.quality}`}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Compressed MP3
          </button>
        </div>
      )}

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MP3 compressor...</p>
        </div>
      )}
    </div>
  );
}
