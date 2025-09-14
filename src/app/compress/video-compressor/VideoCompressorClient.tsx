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
  const [loadingMessage, setLoadingMessage] = useState("Loading video compressor...");
  const [compressedFileName, setCompressedFileName] = useState("");
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    resolution: '720p',
    fps: '30',
    bitrate: '500k'
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

        setLoadingMessage("Loading FFmpeg core...");
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        setLoadingMessage("Video compressor ready!");
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
      setCompressedFileName("");
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
          setCompressedFileName(`compressed_${file.name}`);
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
      
      // Video codec and quality - More aggressive compression
      switch (settings.quality) {
        case 'high':
          command.push('-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-profile:v', 'baseline');
          break;
        case 'medium':
          command.push('-c:v', 'libx264', '-crf', '32', '-preset', 'medium', '-profile:v', 'baseline');
          break;
        case 'low':
          command.push('-c:v', 'libx264', '-crf', '35', '-preset', 'fast', '-profile:v', 'baseline');
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
      
      // Audio codec - More aggressive audio compression
      command.push('-c:a', 'aac', '-b:a', '64k', '-ac', '2');
      
      // Additional compression options
      command.push('-movflags', '+faststart');
      
      // Output
      command.push('-y', 'output.mp4');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      
      setCompressedFile(blob);
      setCompressedFileName(`compressed_${file.name}`);
      
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
      a.download = compressedFileName || `compressed_${file?.name || 'video.mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCompressedFile(null);
    setCompressedFileName("");
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload Video File</h3>
          
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-400/50 rounded-xl hover:border-gray-500/50 transition-all duration-200 bg-gray-300/30 hover:bg-gray-300/50"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎬</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {file ? "Change Video File" : "Select Video File"}
                    </div>
                    <div className="text-sm text-gray-600">
                      MP4, AVI, MOV, WEBM, MKV, FLV, WMV, 3GP
                    </div>
                    {file && (
                      <div className="mt-3 text-sm text-gray-700">
                        {file.name} ({formatFileSize(file.size)})
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Compression Settings */}
              {file && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900">Compression Settings</h4>
                  
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <select
                      value={settings.quality}
                      onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                    >
                      <option value="high">High Quality (30% smaller)</option>
                      <option value="medium">Medium Quality (50% smaller)</option>
                      <option value="low">Low Quality (70% smaller)</option>
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
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
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
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
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
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                    >
                      <option value="auto">Auto (Recommended)</option>
                      <option value="800k">800 kbps</option>
                      <option value="500k">500 kbps</option>
                      <option value="300k">300 kbps</option>
                      <option value="150k">150 kbps</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {file && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCompress}
                    disabled={isLoading || !ffmpegLoaded}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    {isLoading ? `Compressing... ${progress}%` : 'Compress Video'}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="px-6 py-4 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50 font-semibold"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Compressing video...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-300/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-gray-600 to-gray-700 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Compression Result</h3>
          
          {compressedFile ? (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Compressed Video</h4>
                <video
                  src={URL.createObjectURL(compressedFile)}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Download</h4>
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    Download Compressed Video
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-300/50 text-gray-900 py-3 px-6 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50 font-semibold"
                  >
                    Compress Another Video
                  </button>
                </div>
              </div>

              {/* Compression Details */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Compression Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-300/50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Original</h5>
                    <p className="text-sm text-gray-700">Size: {formatFileSize(file?.size || 0)}</p>
                  </div>
                  <div className="bg-gray-300/50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Compressed</h5>
                    <p className="text-sm text-gray-700">Size: {formatFileSize(compressedFile.size)}</p>
                  </div>
                </div>
                
                <div className="mt-4 bg-gray-300/50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Compression Ratio</h5>
                  <p className="text-sm text-gray-700">
                    {file && compressedFile && (
                      <>
                        {Math.round(((file.size - compressedFile.size) / file.size) * 100)}% smaller
                        <br />
                        {formatFileSize(file.size - compressedFile.size)} saved
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Original Video</h4>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">File Information</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium">Name:</span> {file.name}</div>
                  <div><span className="font-medium">Size:</span> {formatFileSize(file.size)}</div>
                  <div><span className="font-medium">Type:</span> {file.type}</div>
                </div>
              </div>

              {/* Ready to Compress */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">🎬</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Compress</h4>
                <p className="text-gray-700">
                  Configure your compression settings and click "Compress Video" to start.
                </p>
              </div>

              {/* Compression Tips */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">💡 Compression Tips</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>• <strong>Lower resolution</strong> = Smaller file size</div>
                  <div>• <strong>Lower FPS</strong> = Smaller file size</div>
                  <div>• <strong>Lower bitrate</strong> = Smaller file size</div>
                  <div>• <strong>Lower quality</strong> = Smaller file size</div>
                  <div>• <strong>For maximum compression:</strong> Use 360p, 15 FPS, 150k bitrate, Low quality</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Compress</h4>
              <p className="text-gray-700">
                Select a video file to start compressing it and reducing its file size.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="mt-8 bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">{loadingMessage}</p>
        </div>
      )}
    </div>
  );
}
