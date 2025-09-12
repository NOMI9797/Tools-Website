'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

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
  const [settings, setSettings] = useState<CompressionSettings>({
    compressionType: 'downsample',
    bitDepth: '16',
    sampleRate: '44100',
    mp3Bitrate: '128',
    mp3EncodingMode: 'cbr'
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
        setError('Failed to load WAV compressor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'audio/wav' && !selectedFile.name.toLowerCase().endsWith('.wav')) {
        setError('Please select a valid WAV file');
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
      const extension = settings.compressionType === 'downsample' ? 'wav' : 'mp3';
      a.download = `compressed_${file?.name?.replace('.wav', '') || 'audio'}.${extension}`;
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select WAV File
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,.wav"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose WAV File
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
          
          {/* Compression Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compression Method
            </label>
            <select
              value={settings.compressionType}
              onChange={(e) => setSettings({...settings, compressionType: e.target.value as any})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="downsample">Downsample WAV (Keep WAV format)</option>
              <option value="convert">Convert to MP3 (Maximum compression)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getCompressionTypeDescription(settings.compressionType)}
            </p>
          </div>

          {/* WAV Downsampling Settings */}
          {settings.compressionType === 'downsample' && (
            <>
              {/* Bit Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bit Depth
                </label>
                <select
                  value={settings.bitDepth}
                  onChange={(e) => setSettings({...settings, bitDepth: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="16">16-bit</option>
                  <option value="8">8-bit</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getBitDepthDescription(settings.bitDepth)}
                </p>
              </div>

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
                  <option value="44100">44.1 kHz</option>
                  <option value="22050">22.05 kHz</option>
                  <option value="11025">11.025 kHz</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getSampleRateDescription(settings.sampleRate)}
                </p>
              </div>
            </>
          )}

          {/* MP3 Conversion Settings */}
          {settings.compressionType === 'convert' && (
            <>
              {/* MP3 Bitrate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MP3 Bitrate
                </label>
                <select
                  value={settings.mp3Bitrate}
                  onChange={(e) => setSettings({...settings, mp3Bitrate: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="320">320 kbps - High quality</option>
                  <option value="256">256 kbps - Very good quality</option>
                  <option value="192">192 kbps - Good quality</option>
                  <option value="128">128 kbps - Standard quality</option>
                  <option value="96">96 kbps - Lower quality</option>
                  <option value="64">64 kbps - Low quality</option>
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cbr">CBR - Constant Bitrate</option>
                  <option value="vbr">VBR - Variable Bitrate</option>
                  <option value="abr">ABR - Average Bitrate</option>
                </select>
              </div>
            </>
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
            {isLoading ? `Compressing... ${progress}%` : 'Compress WAV'}
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
              <h4 className="font-medium text-gray-900 mb-2">Original WAV</h4>
              <p className="text-sm text-gray-600">Size: {formatFileSize(file?.size || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {settings.compressionType === 'downsample' ? 'Compressed WAV' : 'MP3 Output'}
              </h4>
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
              Method: {settings.compressionType === 'downsample' ? 'WAV Downsampling' : 'MP3 Conversion'}<br />
              {settings.compressionType === 'downsample' ? (
                <>
                  Bit Depth: {settings.bitDepth}-bit<br />
                  Sample Rate: {settings.sampleRate} Hz
                </>
              ) : (
                <>
                  Bitrate: {settings.mp3Bitrate} kbps<br />
                  Mode: {settings.mp3EncodingMode.toUpperCase()}
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download {settings.compressionType === 'downsample' ? 'Compressed WAV' : 'MP3'}
          </button>
        </div>
      )}

      {/* Loading Status */}
      {!ffmpegLoaded && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WAV compressor...</p>
        </div>
      )}
    </div>
  );
}
