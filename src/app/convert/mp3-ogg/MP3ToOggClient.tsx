'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

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
        setError('Failed to load audio converter. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type - specifically for MP3 files
      if (selectedFile.type !== 'audio/mpeg' && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
        setError('Please select a valid MP3 file');
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

  const getBitrateDescription = (bitrate: string) => {
    const descriptions: Record<string, string> = {
      'auto': 'Auto (VBR quality-based)',
      '320': '320 kbps - High quality',
      '256': '256 kbps - Very good quality',
      '192': '192 kbps - Good quality',
      '128': '128 kbps - Standard quality',
      '96': '96 kbps - Lower quality',
      '64': '64 kbps - Low quality'
    };
    return descriptions[bitrate] || bitrate;
  };

  const getSampleRateDescription = (rate: string) => {
    const descriptions: Record<string, string> = {
      'original': 'Keep original sample rate',
      '48000': '48 kHz - Professional quality',
      '44100': '44.1 kHz - CD quality',
      '22050': '22.05 kHz - Half CD quality',
      '11025': '11.025 kHz - Quarter CD quality'
    };
    return descriptions[rate] || rate;
  };

  const getEncodingModeDescription = (mode: string) => {
    const descriptions: Record<string, string> = {
      'vbr': 'VBR - Variable Bitrate (Recommended)',
      'cbr': 'CBR - Constant Bitrate',
      'abr': 'ABR - Average Bitrate'
    };
    return descriptions[mode] || mode;
  };

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert MP3 to OGG</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select MP3 File
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-gray-700">
                    {file ? file.name : "Click to select MP3 file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: MP3 audio files (.mp3)
                  </div>
                </button>
              </div>
              
              {file && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎵</span>
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

                {/* Encoding Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encoding Mode
                  </label>
                  <select
                    value={settings.encodingMode}
                    onChange={(e) => setSettings({...settings, encodingMode: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="vbr" className="bg-gray-200 text-gray-900">VBR - Variable Bitrate</option>
                    <option value="cbr" className="bg-gray-200 text-gray-900">CBR - Constant Bitrate</option>
                    <option value="abr" className="bg-gray-200 text-gray-900">ABR - Average Bitrate</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    {getEncodingModeDescription(settings.encodingMode)}
                  </p>
                </div>

                {/* Bitrate (for CBR and ABR) */}
                {(settings.encodingMode === 'cbr' || settings.encodingMode === 'abr') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitrate
                    </label>
                    <select
                      value={settings.bitrate}
                      onChange={(e) => setSettings({...settings, bitrate: e.target.value as any})}
                      className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                    >
                      <option value="320" className="bg-gray-200 text-gray-900">320 kbps</option>
                      <option value="256" className="bg-gray-200 text-gray-900">256 kbps</option>
                      <option value="192" className="bg-gray-200 text-gray-900">192 kbps</option>
                      <option value="128" className="bg-gray-200 text-gray-900">128 kbps</option>
                      <option value="96" className="bg-gray-200 text-gray-900">96 kbps</option>
                      <option value="64" className="bg-gray-200 text-gray-900">64 kbps</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      {getBitrateDescription(settings.bitrate)}
                    </p>
                  </div>
                )}

                {/* Sample Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample Rate
                  </label>
                  <select
                    value={settings.sampleRate}
                    onChange={(e) => setSettings({...settings, sampleRate: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="original" className="bg-gray-200 text-gray-900">Original Sample Rate</option>
                    <option value="48000" className="bg-gray-200 text-gray-900">48 kHz</option>
                    <option value="44100" className="bg-gray-200 text-gray-900">44.1 kHz</option>
                    <option value="22050" className="bg-gray-200 text-gray-900">22.05 kHz</option>
                    <option value="11025" className="bg-gray-200 text-gray-900">11.025 kHz</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    {getSampleRateDescription(settings.sampleRate)}
                  </p>
                </div>

                {/* Channels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channels
                  </label>
                  <select
                    value={settings.channels}
                    onChange={(e) => setSettings({...settings, channels: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="original" className="bg-gray-200 text-gray-900">Original Channels</option>
                    <option value="stereo" className="bg-gray-200 text-gray-900">Stereo (2 channels)</option>
                    <option value="mono" className="bg-gray-200 text-gray-900">Mono (1 channel)</option>
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
                {isLoading ? `Converting... ${progress}%` : 'Convert MP3 to OGG'}
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
                  <span className="text-green-700 font-medium">MP3 to OGG Conversion Successful!</span>
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
                    <div className="font-medium text-gray-900">OGG</div>
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
                    <span className="text-gray-700">Encoding Mode:</span>
                    <div className="font-medium text-gray-900">{settings.encodingMode.toUpperCase()}</div>
                  </div>
                  {(settings.encodingMode === 'cbr' || settings.encodingMode === 'abr') && (
                    <div>
                      <span className="text-gray-700">Bitrate:</span>
                      <div className="font-medium text-gray-900">{settings.bitrate} kbps</div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-700">Sample Rate:</span>
                    <div className="font-medium text-gray-900">
                      {settings.sampleRate === 'original' ? 'Original' : `${settings.sampleRate} Hz`}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Channels:</span>
                    <div className="font-medium text-gray-900 capitalize">
                      {settings.channels === 'original' ? 'Original' : settings.channels}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                <span>📥</span>
                <span>Download OGG</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎵</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select an MP3 file and configure your settings to convert to OGG format.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading audio converter...</p>
        </div>
      )}
    </div>
  );
}
