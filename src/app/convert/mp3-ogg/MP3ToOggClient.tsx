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
        <p className="text-xs text-gray-500 mt-2">
          Supports MP3 audio files (.mp3)
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
              <option value="vbr">VBR - Variable Bitrate</option>
              <option value="cbr">CBR - Constant Bitrate</option>
              <option value="abr">ABR - Average Bitrate</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="320">320 kbps</option>
                <option value="256">256 kbps</option>
                <option value="192">192 kbps</option>
                <option value="128">128 kbps</option>
                <option value="96">96 kbps</option>
                <option value="64">64 kbps</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="original">Original Sample Rate</option>
              <option value="48000">48 kHz</option>
              <option value="44100">44.1 kHz</option>
              <option value="22050">22.05 kHz</option>
              <option value="11025">11.025 kHz</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="original">Original Channels</option>
              <option value="stereo">Stereo (2 channels)</option>
              <option value="mono">Mono (1 channel)</option>
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
            {isLoading ? `Converting... ${progress}%` : 'Convert MP3 to OGG'}
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
              <h4 className="font-medium text-gray-900 mb-2">Original MP3</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(file?.size || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Converted OGG</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(convertedFile.size)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Settings Used</h4>
            <p className="text-sm text-gray-600">
              Quality: {settings.quality}<br />
              Encoding Mode: {settings.encodingMode.toUpperCase()}<br />
              {(settings.encodingMode === 'cbr' || settings.encodingMode === 'abr') && `Bitrate: ${settings.bitrate} kbps<br />`}
              Sample Rate: {settings.sampleRate === 'original' ? 'Original' : `${settings.sampleRate} Hz`}<br />
              Channels: {settings.channels === 'original' ? 'Original' : settings.channels}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download OGG
          </button>
        </div>
      )}

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audio converter...</p>
        </div>
      )}
    </div>
  );
}
