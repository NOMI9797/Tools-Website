'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

interface ConversionSettings {
  quality: 'high' | 'medium' | 'low';
  resolution: 'original' | '1080p' | '720p' | '480p' | '360p';
  fps: 'original' | '60' | '30' | '24' | '15';
  bitrate: 'auto' | '5000k' | '3000k' | '2000k' | '1000k' | '500k';
  audioCodec: 'aac' | 'mp3' | 'copy';
  videoCodec: 'h264' | 'h265';
}

export default function MovToMp4Client() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 'medium',
    resolution: 'original',
    fps: 'original',
    bitrate: 'auto',
    audioCodec: 'aac',
    videoCodec: 'h264'
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
        setError('Failed to load video converter. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type - specifically for MOV files
      const validTypes = [
        'video/quicktime',
        'video/x-quicktime',
        'video/mov',
        'video/mp4' // Some MOV files might be detected as MP4
      ];
      
      const validExtensions = ['.mov', '.qt'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setError('Please select a valid MOV (QuickTime) file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setConvertedFile(null);
    }
  };

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
      formData.append('resolution', settings.resolution);
      formData.append('fps', settings.fps);
      formData.append('bitrate', settings.bitrate);
      formData.append('audioCodec', settings.audioCodec);
      formData.append('videoCodec', settings.videoCodec);

      try {
        const response = await fetch('/api/convert/mov-mp4', {
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
      const inputName = 'input.mov';
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Build FFmpeg command based on settings
      let command = ['-i', inputName];
      
      // Video codec
      if (settings.videoCodec === 'h265') {
        command.push('-c:v', 'libx265');
      } else {
        command.push('-c:v', 'libx264');
      }
      
      // Quality settings
      switch (settings.quality) {
        case 'high':
          command.push('-crf', '18');
          break;
        case 'medium':
          command.push('-crf', '23');
          break;
        case 'low':
          command.push('-crf', '28');
          break;
      }
      
      // Resolution
      if (settings.resolution !== 'original') {
        switch (settings.resolution) {
          case '1080p':
            command.push('-vf', 'scale=1920:1080');
            break;
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
      if (settings.audioCodec === 'copy') {
        command.push('-c:a', 'copy');
      } else {
        command.push('-c:a', settings.audioCodec);
        command.push('-b:a', '128k');
      }
      
      // Output
      command.push('-y', 'output.mp4');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      
      setConvertedFile(blob);
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile('output.mp4');
      
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
      a.download = `converted_${file?.name?.replace(/\.[^/.]+$/, '') || 'video'}.mp4`;
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

  const getQualityDescription = (quality: string) => {
    const descriptions: Record<string, string> = {
      'high': 'High quality (larger file)',
      'medium': 'Medium quality (balanced)',
      'low': 'Low quality (smaller file)'
    };
    return descriptions[quality] || quality;
  };

  const getResolutionDescription = (resolution: string) => {
    const descriptions: Record<string, string> = {
      'original': 'Keep original resolution',
      '1080p': 'Full HD (1920x1080)',
      '720p': 'HD (1280x720)',
      '480p': 'SD (854x480)',
      '360p': 'Low (640x360)'
    };
    return descriptions[resolution] || resolution;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select MOV File
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/quicktime,video/x-quicktime,.mov,.qt"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose MOV File
          </button>
          {file && (
            <span className="text-sm text-gray-600">
              {file.name} ({formatFileSize(file.size)})
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supports QuickTime MOV files (.mov, .qt)
        </p>
      </div>

      {/* Conversion Settings */}
      {file && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Conversion Settings</h3>
          
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
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getQualityDescription(settings.quality)}
            </p>
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
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p (SD)</option>
              <option value="360p">360p (Low)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getResolutionDescription(settings.resolution)}
            </p>
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
              <option value="60">60 FPS</option>
              <option value="30">30 FPS</option>
              <option value="24">24 FPS</option>
              <option value="15">15 FPS</option>
            </select>
          </div>

          {/* Bitrate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Bitrate
            </label>
            <select
              value={settings.bitrate}
              onChange={(e) => setSettings({...settings, bitrate: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="auto">Auto (Recommended)</option>
              <option value="5000k">5000 kbps</option>
              <option value="3000k">3000 kbps</option>
              <option value="2000k">2000 kbps</option>
              <option value="1000k">1000 kbps</option>
              <option value="500k">500 kbps</option>
            </select>
          </div>

          {/* Video Codec */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Codec
            </label>
            <select
              value={settings.videoCodec}
              onChange={(e) => setSettings({...settings, videoCodec: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="h264">H.264 (Better compatibility)</option>
              <option value="h265">H.265 (Better compression)</option>
            </select>
          </div>

          {/* Audio Codec */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Codec
            </label>
            <select
              value={settings.audioCodec}
              onChange={(e) => setSettings({...settings, audioCodec: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="aac">AAC (Recommended)</option>
              <option value="mp3">MP3</option>
              <option value="copy">Copy Original</option>
            </select>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {file && (
        <div className="mb-6">
          <button
            onClick={handleConvert}
            disabled={isLoading || !ffmpegLoaded}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? `Converting... ${progress}%` : 'Convert MOV to MP4'}
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
      {convertedFile && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Original MOV</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(file?.size || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Converted MP4</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(convertedFile.size)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Settings Used</h4>
            <p className="text-sm text-gray-600">
              Quality: {settings.quality}<br />
              Resolution: {settings.resolution}<br />
              FPS: {settings.fps}<br />
              Video Codec: {settings.videoCodec.toUpperCase()}<br />
              Audio Codec: {settings.audioCodec.toUpperCase()}<br />
              Bitrate: {settings.bitrate}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download MP4
          </button>
        </div>
      )}

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video converter...</p>
        </div>
      )}
    </div>
  );
}
