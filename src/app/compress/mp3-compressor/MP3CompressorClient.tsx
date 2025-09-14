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
  const [loadingMessage, setLoadingMessage] = useState("Loading MP3 compressor...");
  const [compressedFileName, setCompressedFileName] = useState("");
  const [settings, setSettings] = useState<CompressionSettings>({
    bitrate: '96',
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

        setLoadingMessage("Loading FFmpeg core...");
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        setLoadingMessage("MP3 compressor ready!");
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
      setCompressedFileName(`compressed_${file.name}`);
      
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
      a.download = compressedFileName || `compressed_${file?.name || 'audio.mp3'}`;
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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload MP3 File</h3>
          
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-400/50 rounded-xl hover:border-gray-500/50 transition-all duration-200 bg-gray-300/30 hover:bg-gray-300/50"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎵</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {file ? "Change MP3 File" : "Select MP3 File"}
                    </div>
                    <div className="text-sm text-gray-600">
                      MP3 audio files only
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
                      <option value="320">320 kbps - High quality</option>
                      <option value="256">256 kbps - Very good quality</option>
                      <option value="192">192 kbps - Good quality</option>
                      <option value="128">128 kbps - Standard quality</option>
                      <option value="96">96 kbps - Lower quality</option>
                      <option value="64">64 kbps - Low quality</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
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
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                    >
                      <option value="cbr">CBR - Constant Bitrate</option>
                      <option value="vbr">VBR - Variable Bitrate</option>
                      <option value="abr">ABR - Average Bitrate</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
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
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      >
                        <option value="high">High Quality (0)</option>
                        <option value="medium">Medium Quality (4)</option>
                        <option value="low">Low Quality (9)</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-1">
                        Lower numbers = higher quality, larger file size
                      </p>
                    </div>
                  )}
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
                    {isLoading ? `Compressing... ${progress}%` : 'Compress MP3'}
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
              {/* Audio Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Compressed Audio</h4>
                <audio
                  src={URL.createObjectURL(compressedFile)}
                  controls
                  className="w-full"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Download</h4>
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    Download Compressed MP3
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-300/50 text-gray-900 py-3 px-6 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50 font-semibold"
                  >
                    Compress Another MP3
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

                <div className="mt-4 bg-gray-300/50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Settings Used</h5>
                  <p className="text-sm text-gray-700">
                    Bitrate: {settings.bitrate} kbps<br />
                    Mode: {settings.encodingMode.toUpperCase()}<br />
                    {settings.encodingMode === 'vbr' && `Quality: ${settings.quality}`}
                  </p>
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-6">
              {/* Audio Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Original Audio</h4>
                <audio
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full"
                >
                  Your browser does not support the audio element.
                </audio>
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
                <div className="text-6xl mb-4">🎵</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Compress</h4>
                <p className="text-gray-700">
                  Configure your compression settings and click "Compress MP3" to start.
                </p>
              </div>

              {/* Compression Tips */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-gray-900 mb-4">💡 Compression Tips</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>• <strong>Lower bitrate</strong> = Smaller file size</div>
                  <div>• <strong>VBR mode</strong> = Better compression for music</div>
                  <div>• <strong>CBR mode</strong> = Consistent quality</div>
                  <div>• <strong>For maximum compression:</strong> Use 64 kbps, VBR, Low quality</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎵</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Compress</h4>
              <p className="text-gray-700">
                Select an MP3 file to start compressing it and reducing its file size.
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
