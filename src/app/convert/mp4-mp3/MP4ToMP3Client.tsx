"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type MP3Quality = {
  id: string;
  name: string;
  bitrate: string;
  description: string;
};

const mp3Qualities: MP3Quality[] = [
  {
    id: "320",
    name: "320 kbps",
    bitrate: "320k",
    description: "Highest quality - CD quality audio"
  },
  {
    id: "256",
    name: "256 kbps",
    bitrate: "256k",
    description: "Very high quality - Near CD quality"
  },
  {
    id: "192",
    name: "192 kbps",
    bitrate: "192k",
    description: "High quality - Good for most uses"
  },
  {
    id: "160",
    name: "160 kbps",
    bitrate: "160k",
    description: "Good quality - Balanced size and quality"
  },
  {
    id: "128",
    name: "128 kbps",
    bitrate: "128k",
    description: "Standard quality - Most common bitrate"
  },
  {
    id: "96",
    name: "96 kbps",
    bitrate: "96k",
    description: "Lower quality - Smaller file size"
  }
];

const supportedVideoFormats = [
  "mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v", "3gp", "ogv"
];

export default function MP4ToMP3Client() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState("192");
  const [startTime, setStartTime] = useState("0");
  const [duration, setDuration] = useState("");
  const [normalize, setNormalize] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading audio converter...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load FFmpeg dynamically on client side only
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        setLoadingMessage("Loading FFmpeg...");
        
        // Dynamic imports to avoid SSR issues
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
        
        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on("log", ({ message }) => console.log(message));
        ffmpegInstance.on("progress", ({ progress }) =>
          setProgress(Math.round(progress * 100))
        );

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        
        setFfmpeg(ffmpegInstance);
        setFfmpegLoaded(true);
        setLoadingMessage("Audio converter ready!");
        console.log('FFmpeg loaded successfully');
      } catch (err) {
        console.error("FFmpeg failed to load:", err);
        setError("Failed to load audio converter. Please refresh the page.");
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!supportedVideoFormats.includes(fileExtension || '')) {
        setError(`Unsupported video format: ${fileExtension}. Please select a supported video file.`);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError("");
      setConversionResult(null);
    }
  };

  const handleConvert = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a video file to convert");
      return;
    }

    setIsConverting(true);
    setError("");
    setProgress(0);

    try {
      // First try server-side conversion
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("quality", quality);
        formData.append("startTime", startTime);
        formData.append("duration", duration);
        formData.append("normalize", normalize.toString());

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 200);

        const response = await fetch('/api/convert/mp4-mp3', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (response.ok) {
          const result = await response.json();
          setConversionResult(result);
          return;
        } else {
          console.log('Server conversion failed, trying client-side fallback with FFmpeg.wasm');
        }
      } catch (serverError) {
        console.log('Server conversion failed, trying client-side fallback with FFmpeg.wasm');
      }

      // Fallback to client-side conversion with FFmpeg.wasm
      if (!ffmpegLoaded || !ffmpeg) {
        throw new Error('FFmpeg not available. Please wait for it to load or refresh the page.');
      }

      setLoadingMessage("Converting with client-side FFmpeg...");
      setProgress(0);

      const { fetchFile } = await import("@ffmpeg/util");
      const qualityData = mp3Qualities.find(q => q.id === quality);
      
      if (!qualityData) {
        throw new Error('Invalid quality setting');
      }

      // Write input file to FFmpeg filesystem
      const inputFileName = `input.${selectedFile.name.split('.').pop()}`;
      const outputFileName = 'output.mp3';
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

      // Build FFmpeg command for client-side conversion
      let command = `-i ${inputFileName}`;
      
      // Add time parameters if specified
      const startTimeSeconds = parseFloat(startTime) || 0;
      if (startTimeSeconds > 0) {
        command += ` -ss ${startTimeSeconds}`;
      }

      const durationSeconds = parseFloat(duration) || 0;
      if (durationSeconds > 0) {
        command += ` -t ${durationSeconds}`;
      }

      // Add audio normalization if requested
      if (normalize) {
        command += ` -af loudnorm=I=-16:TP=-1.5:LRA=11`;
      }

      // Add MP3 encoding settings for client-side FFmpeg.wasm
      command += ` -c:a libmp3lame -b:a ${qualityData.bitrate}`;
      command += ` -ac 2`; // Force stereo output
      command += ` -ar 44100`; // Set sample rate
      command += ` -vn`; // Extract only audio (no video)
      command += ` -f mp3`; // Force MP3 format
      command += ` ${outputFileName}`;

      console.log(`Executing FFmpeg command: ${command}`);

      // Execute FFmpeg command
      await ffmpeg.exec(command);

      // Read the output file
      const data = await ffmpeg.readFile(outputFileName);
      const base64Audio = Buffer.from(data).toString('base64');

      // Clean up FFmpeg filesystem
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      // Create result object
      const result = {
        success: true,
        originalFormat: selectedFile.name.split('.').pop()?.toUpperCase(),
        targetFormat: "MP3",
        originalSize: selectedFile.size,
        convertedSize: data.byteLength,
        quality: qualityData.name,
        startTime: startTimeSeconds,
        duration: durationSeconds || 0,
        normalize: normalize,
        audioData: base64Audio,
        mimeType: "audio/mpeg",
        fileName: `${selectedFile.name.split('.')[0]}.mp3`,
        conversionMethod: "Client-side FFmpeg.wasm"
      };

      setConversionResult(result);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  }, [selectedFile, quality, startTime, duration, normalize, ffmpeg, ffmpegLoaded]);

  const handleDownload = () => {
    if (!conversionResult) return;

    const byteCharacters = atob(conversionResult.audioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: conversionResult.mimeType });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = conversionResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeInput = (timeStr: string): string => {
    // Convert seconds to MM:SS format for display
    const seconds = parseFloat(timeStr) || 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number => {
    // Convert MM:SS format to seconds
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(timeStr) || 0;
  };

  const getFileIcon = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'mp4': return '🎬';
      case 'mov': return '🎥';
      case 'avi': return '📹';
      case 'mkv': return '🎞️';
      case 'webm': return '🌐';
      case 'flv': return '📺';
      case 'wmv': return '🪟';
      case 'm4v': return '🍎';
      case '3gp': return '📱';
      case 'ogv': return '🦉';
      default: return '🎬';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Extract Audio from Video</h3>
          
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
                  accept=".mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.m4v,.3gp,.ogv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-gray-600">
                    {selectedFile ? selectedFile.name : "Click to select video file"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Supports: MP4, MOV, AVI, MKV, WEBM, FLV, WMV, M4V, 3GP, OGV
                  </div>
                </button>
              </div>
              
              {selectedFile && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(selectedFile.name.split('.').pop() || '')}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{selectedFile.name}</div>
                      <div className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quality Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MP3 Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mp3Qualities.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} - {q.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Time Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Start Time (seconds or MM:SS)
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="0 or 0:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Duration (seconds or MM:SS)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Leave empty for full video"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Leave duration empty to extract audio from start time to end of video
              </p>
            </div>

            {/* Audio Processing Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Audio Processing
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Audio Normalization</div>
                  <div className="text-sm text-gray-600">Normalize audio levels for consistent volume</div>
                </div>
              </label>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting || !ffmpegLoaded}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {!ffmpegLoaded ? loadingMessage : isConverting ? "Extracting Audio..." : "Extract Audio to MP3"}
            </button>

            {/* Progress Bar */}
            {isConverting && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Extraction Result</h3>
          
          {conversionResult ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-green-800 font-medium">Audio Extraction Successful!</span>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Extraction Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Format:</span>
                    <span className="font-medium">{conversionResult.originalFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MP3 Quality:</span>
                    <span className="font-medium">{conversionResult.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="font-medium">{formatDuration(conversionResult.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(conversionResult.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Size:</span>
                    <span className="font-medium">{formatFileSize(conversionResult.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MP3 Size:</span>
                    <span className="font-medium">{formatFileSize(conversionResult.convertedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size Reduction:</span>
                    <span className="font-medium text-green-600">
                      {((1 - conversionResult.convertedSize / conversionResult.originalSize) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {conversionResult.normalize && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Audio Normalization:</span>
                      <span className="font-medium text-green-600">✓ Applied</span>
                    </div>
                  )}
                  {conversionResult.conversionMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Method:</span>
                      <span className="font-medium text-blue-600">{conversionResult.conversionMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Information */}
              {conversionResult.videoInfo && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Original Video Info</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700">Duration:</span>
                      <div className="font-medium text-blue-900">{formatDuration(conversionResult.videoInfo.duration)}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Resolution:</span>
                      <div className="font-medium text-blue-900">{conversionResult.videoInfo.videoResolution || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Video Codec:</span>
                      <div className="font-medium text-blue-900">{conversionResult.videoInfo.videoCodec || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Audio Codec:</span>
                      <div className="font-medium text-blue-900">{conversionResult.videoInfo.audioCodec || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* MP3 Information */}
              {conversionResult.mp3Info && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">MP3 Audio Info</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-purple-700">Duration:</span>
                      <div className="font-medium text-purple-900">{formatDuration(conversionResult.mp3Info.duration)}</div>
                    </div>
                    <div>
                      <span className="text-purple-700">Bitrate:</span>
                      <div className="font-medium text-purple-900">{conversionResult.mp3Info.bitrate ? Math.round(conversionResult.mp3Info.bitrate / 1000) + ' kbps' : 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-purple-700">Sample Rate:</span>
                      <div className="font-medium text-purple-900">{conversionResult.mp3Info.sampleRate ? Math.round(conversionResult.mp3Info.sampleRate / 1000) + ' kHz' : 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-purple-700">Channels:</span>
                      <div className="font-medium text-purple-900">{conversionResult.mp3Info.channels || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>📥</span>
                <span>Download {conversionResult.fileName}</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Extract Audio</h4>
              <p className="text-gray-600">
                Select a video file and configure your settings to extract audio to MP3 format.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">💡 Tips for Best Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-yellow-900">Time Range:</div>
            <div className="text-gray-700">• Use MM:SS format (e.g., 1:30 for 1 minute 30 seconds)</div>
            <div className="text-gray-700">• Leave duration empty to extract from start time to end</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-yellow-900">Quality:</div>
            <div className="text-gray-700">• 320 kbps for highest quality</div>
            <div className="text-gray-700">• 192 kbps for good balance of quality and size</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-yellow-900">Processing:</div>
            <div className="text-gray-700">• Enable normalization for consistent volume levels</div>
            <div className="text-gray-700">• Works with all major video formats</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-yellow-900">File Size:</div>
            <div className="text-gray-700">• MP3 files are typically 10-20% of original video size</div>
            <div className="text-gray-700">• Higher quality = larger file size</div>
          </div>
        </div>
      </div>
    </div>
  );
}
