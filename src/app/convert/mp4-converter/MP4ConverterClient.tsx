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

export default function MP4ConverterClient() {
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
      // Validate file type
      const validTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/webm', 
        'video/mkv', 'video/flv', 'video/wmv', 'video/3gp',
        'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a valid video file (MP4, AVI, MOV, WEBM, MKV, FLV, WMV, etc.)');
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
        const response = await fetch('/api/convert/mp4', {
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
      const inputName = 'input.mp4';
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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert Video to MP4</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Video File
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-gray-700">
                    {file ? file.name : "Click to select video file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: MP4, AVI, MOV, WEBM, MKV, FLV, WMV, 3GP, QuickTime
                  </div>
                </button>
              </div>
              
              {file && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎬</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-700">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conversion Settings */}
            {file && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Conversion Settings</h4>
                
                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="high" className="bg-gray-200 text-gray-900">High Quality</option>
                    <option value="medium" className="bg-gray-200 text-gray-900">Medium Quality</option>
                    <option value="low" className="bg-gray-200 text-gray-900">Low Quality</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
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
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="original" className="bg-gray-200 text-gray-900">Original Resolution</option>
                    <option value="1080p" className="bg-gray-200 text-gray-900">1080p (Full HD)</option>
                    <option value="720p" className="bg-gray-200 text-gray-900">720p (HD)</option>
                    <option value="480p" className="bg-gray-200 text-gray-900">480p (SD)</option>
                    <option value="360p" className="bg-gray-200 text-gray-900">360p (Low)</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
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
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="original" className="bg-gray-200 text-gray-900">Original FPS</option>
                    <option value="60" className="bg-gray-200 text-gray-900">60 FPS</option>
                    <option value="30" className="bg-gray-200 text-gray-900">30 FPS</option>
                    <option value="24" className="bg-gray-200 text-gray-900">24 FPS</option>
                    <option value="15" className="bg-gray-200 text-gray-900">15 FPS</option>
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
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="h264" className="bg-gray-200 text-gray-900">H.264 (Better compatibility)</option>
                    <option value="h265" className="bg-gray-200 text-gray-900">H.265 (Better compression)</option>
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
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="aac" className="bg-gray-200 text-gray-900">AAC (Recommended)</option>
                    <option value="mp3" className="bg-gray-200 text-gray-900">MP3</option>
                    <option value="copy" className="bg-gray-200 text-gray-900">Copy Original</option>
                  </select>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {file && (
              <button
                onClick={handleConvert}
                disabled={isLoading || !ffmpegLoaded}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                {isLoading ? `Converting... ${progress}%` : 'Convert to MP4'}
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

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {convertedFile ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-green-700 font-medium">Video Conversion Successful!</span>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Original Size:</span>
                    <div className="font-medium text-gray-900">{formatFileSize(file?.size || 0)}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Converted Size:</span>
                    <div className="font-medium text-gray-900">{formatFileSize(convertedFile.size)}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Size Change:</span>
                    <div className={`font-medium ${convertedFile.size < (file?.size || 0) ? 'text-green-600' : 'text-red-600'}`}>
                      {((convertedFile.size - (file?.size || 0)) / (file?.size || 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">MP4</div>
                  </div>
                </div>
              </div>

              {/* Settings Used */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Settings Used</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900 capitalize">{settings.quality}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Resolution:</span>
                    <div className="font-medium text-gray-900">{settings.resolution}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Frame Rate:</span>
                    <div className="font-medium text-gray-900">{settings.fps}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Video Codec:</span>
                    <div className="font-medium text-gray-900">{settings.videoCodec.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Audio Codec:</span>
                    <div className="font-medium text-gray-900">{settings.audioCodec.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Bitrate:</span>
                    <div className="font-medium text-gray-900">{settings.bitrate}</div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                <span>📥</span>
                <span>Download MP4</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select a video file and configure your settings to convert to MP4 format.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading video converter...</p>
        </div>
      )}
    </div>
  );
}
