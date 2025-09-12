'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  resolution: 'original' | '720p' | '480p' | '360p';
  fps: 'original' | '30' | '24' | '15';
  bitrate: 'auto' | '1000k' | '500k' | '250k';
}

export default function VideoCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    resolution: 'original',
    fps: 'original',
    bitrate: 'auto'
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
        setError('Failed to load video compressor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/webm', 
        'video/mkv', 'video/flv', 'video/wmv', 'video/3gp'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a valid video file (MP4, AVI, MOV, WEBM, etc.)');
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
      formData.append('quality', settings.quality);
      formData.append('resolution', settings.resolution);
      formData.append('fps', settings.fps);
      formData.append('bitrate', settings.bitrate);

      try {
        const response = await fetch('/api/compress/video', {
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
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      
      // Build FFmpeg command based on settings
      let command = ['-i', 'input.mp4'];
      
      // Video codec and quality
      switch (settings.quality) {
        case 'high':
          command.push('-c:v', 'libx264', '-crf', '18');
          break;
        case 'medium':
          command.push('-c:v', 'libx264', '-crf', '23');
          break;
        case 'low':
          command.push('-c:v', 'libx264', '-crf', '28');
          break;
      }
      
      // Resolution
      if (settings.resolution !== 'original') {
        switch (settings.resolution) {
          case '720p':
            command.push('-vf', 'scale=1280:720');
            break;
          case '480p':
            command.push('-vf', 'scale=854:480');
            break;
          case '360p':
            command.push('-vf', 'scale=640:360');
            break;
        }
      }
      
      // FPS
      if (settings.fps !== 'original') {
        command.push('-r', settings.fps);
      }
      
      // Bitrate
      if (settings.bitrate !== 'auto') {
        command.push('-b:v', settings.bitrate);
      }
      
      // Audio codec
      command.push('-c:a', 'aac', '-b:a', '128k');
      
      // Output
      command.push('-y', 'output.mp4');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      
      setCompressedFile(blob);
      
      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
      
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
      a.download = `compressed_${file?.name || 'video.mp4'}`;
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Video File
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose Video File
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
          
          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality
            </label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="high">High Quality (Larger file)</option>
              <option value="medium">Medium Quality (Balanced)</option>
              <option value="low">Low Quality (Smaller file)</option>
            </select>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <select
              value={settings.resolution}
              onChange={(e) => setSettings({...settings, resolution: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="original">Original Resolution</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p (SD)</option>
              <option value="360p">360p (Low)</option>
            </select>
          </div>

          {/* FPS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frame Rate
            </label>
            <select
              value={settings.fps}
              onChange={(e) => setSettings({...settings, fps: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="original">Original FPS</option>
              <option value="30">30 FPS</option>
              <option value="24">24 FPS</option>
              <option value="15">15 FPS</option>
            </select>
          </div>

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
              <option value="auto">Auto (Recommended)</option>
              <option value="1000k">1000 kbps</option>
              <option value="500k">500 kbps</option>
              <option value="250k">250 kbps</option>
            </select>
          </div>
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
            {isLoading ? `Compressing... ${progress}%` : 'Compress Video'}
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

          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Compressed Video
          </button>
        </div>
      )}

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video compressor...</p>
        </div>
      )}
    </div>
  );
}
