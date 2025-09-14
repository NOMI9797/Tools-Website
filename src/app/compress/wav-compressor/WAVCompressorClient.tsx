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
  const [loadingMessage, setLoadingMessage] = useState("Loading WAV compressor...");
  const [compressedFileName, setCompressedFileName] = useState("");
  const [settings, setSettings] = useState<CompressionSettings>({
    compressionType: 'convert',
    bitDepth: '16',
    sampleRate: '22050',
    mp3Bitrate: '96',
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Upload & Settings */}
      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload WAV File
          </h2>
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/wav,.wav"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-gray-400 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group"
            >
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-600 group-hover:text-blue-600">
                  Click to upload WAV file
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports .wav files up to 100MB
                </p>
              </div>
            </button>
            
            {file && (
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compression Settings */}
        {file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Compression Settings
            </h2>
            
            <div className="space-y-4">
              {/* Compression Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Method
                </label>
                <select
                  value={settings.compressionType}
                  onChange={(e) => setSettings({...settings, compressionType: e.target.value as any})}
                  className="w-full p-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="downsample">Downsample WAV (Keep WAV format)</option>
                  <option value="convert">Convert to MP3 (Maximum compression)</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {getCompressionTypeDescription(settings.compressionType)}
                </p>
              </div>

              {/* WAV Downsampling Settings */}
              {settings.compressionType === 'downsample' && (
                <div className="space-y-4">
                  {/* Bit Depth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bit Depth
                    </label>
                    <select
                      value={settings.bitDepth}
                      onChange={(e) => setSettings({...settings, bitDepth: e.target.value as any})}
                      className="w-full p-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="16">16-bit (CD quality)</option>
                      <option value="8">8-bit (lower quality, smaller size)</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
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
                      className="w-full p-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="44100">44.1 kHz (CD quality)</option>
                      <option value="22050">22.05 kHz (half CD quality)</option>
                      <option value="11025">11.025 kHz (quarter CD quality)</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      {getSampleRateDescription(settings.sampleRate)}
                    </p>
                  </div>
                </div>
              )}

              {/* MP3 Conversion Settings */}
              {settings.compressionType === 'convert' && (
                <div className="space-y-4">
                  {/* MP3 Bitrate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MP3 Bitrate
                    </label>
                    <select
                      value={settings.mp3Bitrate}
                      onChange={(e) => setSettings({...settings, mp3Bitrate: e.target.value as any})}
                      className="w-full p-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full p-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="cbr">CBR - Constant Bitrate (consistent quality)</option>
                      <option value="vbr">VBR - Variable Bitrate (optimal quality)</option>
                      <option value="abr">ABR - Average Bitrate (balanced)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex space-x-3">
              <button
                onClick={handleCompress}
                disabled={isLoading || !ffmpegLoaded}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Compressing... {progress}%
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Compress WAV
                  </>
                )}
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Results & Preview */}
      <div className="space-y-6">
        {/* Progress Bar */}
        {isLoading && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Compression Progress</h3>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{progress}% complete</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Compression Error</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Audio Preview */}
        {file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Audio Preview
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Original WAV</h4>
                <audio controls className="w-full">
                  <source src={file ? URL.createObjectURL(file) : ''} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-gray-600 mt-2">Size: {formatFileSize(file?.size || 0)}</p>
              </div>
              
              {compressedFile && (
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {settings.compressionType === 'downsample' ? 'Compressed WAV' : 'MP3 Output'}
                  </h4>
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(compressedFile)} type={settings.compressionType === 'downsample' ? 'audio/wav' : 'audio/mpeg'} />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-sm text-gray-600 mt-2">Size: {formatFileSize(compressedFile.size)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compression Results */}
        {compressedFile && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compression Complete
            </h3>
            
            <div className="space-y-4">
              {/* File Size Comparison */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">File Size Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatFileSize(file?.size || 0)}</p>
                    <p className="text-sm text-gray-600">Original</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatFileSize(compressedFile.size)}</p>
                    <p className="text-sm text-gray-600">Compressed</p>
                  </div>
                </div>
                
                {file && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {Math.round(((file.size - compressedFile.size) / file.size) * 100)}% smaller
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(file.size - compressedFile.size)} saved
                    </p>
                  </div>
                )}
              </div>

              {/* Settings Used */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Settings Used</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium text-gray-800">
                      {settings.compressionType === 'downsample' ? 'WAV Downsampling' : 'MP3 Conversion'}
                    </span>
                  </div>
                  {settings.compressionType === 'downsample' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bit Depth:</span>
                        <span className="font-medium text-gray-800">{settings.bitDepth}-bit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample Rate:</span>
                        <span className="font-medium text-gray-800">{settings.sampleRate} Hz</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bitrate:</span>
                        <span className="font-medium text-gray-800">{settings.mp3Bitrate} kbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mode:</span>
                        <span className="font-medium text-gray-800">{settings.mp3EncodingMode.toUpperCase()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download {settings.compressionType === 'downsample' ? 'Compressed WAV' : 'MP3'}
              </button>
            </div>
          </div>
        )}

        {/* Loading Status */}
        {!ffmpegLoaded && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading WAV Compressor</h3>
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        )}

        {/* Ready State */}
        {ffmpegLoaded && !file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm text-center">
            <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Compress</h3>
            <p className="text-gray-600">Upload a WAV file to get started with compression</p>
          </div>
        )}
      </div>
    </div>
  );
}
