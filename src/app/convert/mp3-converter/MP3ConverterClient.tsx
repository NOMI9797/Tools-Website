"use client";

import { useState, useCallback, useRef } from "react";

type MP3Quality = {
  id: string;
  name: string;
  bitrate: string;
  description: string;
};

type MP3Mode = {
  id: string;
  name: string;
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
  },
  {
    id: "64",
    name: "64 kbps",
    bitrate: "64k",
    description: "Low quality - Very small file size"
  }
];

const mp3Modes: MP3Mode[] = [
  {
    id: "cbr",
    name: "CBR (Constant Bitrate)",
    description: "Constant bitrate throughout the file"
  },
  {
    id: "vbr",
    name: "VBR (Variable Bitrate)",
    description: "Variable bitrate for better quality/size ratio"
  },
  {
    id: "abr",
    name: "ABR (Average Bitrate)",
    description: "Average bitrate with some variation"
  }
];

const supportedInputFormats = [
  "mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff", "au", "ra", "amr", "3gp"
];

export default function MP3ConverterClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState("192");
  const [mode, setMode] = useState("cbr");
  const [normalize, setNormalize] = useState(false);
  const [removeSilence, setRemoveSilence] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!supportedInputFormats.includes(fileExtension || '')) {
        setError(`Unsupported file format: ${fileExtension}. Please select a supported audio file.`);
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
      setError("Please select an audio file to convert");
      return;
    }

    setIsConverting(true);
    setError("");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("quality", quality);
      formData.append("mode", mode);
      formData.append("normalize", normalize.toString());
      formData.append("removeSilence", removeSilence.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/convert/mp3-converter', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const result = await response.json();
      setConversionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  }, [selectedFile, quality, mode, normalize, removeSilence]);

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

  const getFileIcon = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'mp3': return '🎵';
      case 'wav': return '🔊';
      case 'ogg': return '🎶';
      case 'flac': return '🎼';
      case 'aac': return '🎧';
      case 'm4a': return '🍎';
      case 'wma': return '🪟';
      case 'aiff': return '🎚️';
      case 'au': return '📻';
      case 'ra': return '📡';
      case 'amr': return '📱';
      case '3gp': return '📹';
      default: return '🎵';
    }
  };

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert to MP3</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Audio File
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,.aiff,.au,.ra,.amr,.3gp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-gray-700">
                    {selectedFile ? selectedFile.name : "Click to select audio file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: MP3, WAV, OGG, FLAC, AAC, M4A, WMA, AIFF, AU, RA, AMR, 3GP
                  </div>
                </button>
              </div>
              
              {selectedFile && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(selectedFile.name.split('.').pop() || '')}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{selectedFile.name}</div>
                      <div className="text-sm text-gray-700">{formatFileSize(selectedFile.size)}</div>
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
                className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              >
                {mp3Qualities.map((q) => (
                  <option key={q.id} value={q.id} className="bg-slate-800 text-gray-900">
                    {q.name} - {q.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Encoding Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encoding Mode
              </label>
              <div className="space-y-2">
                {mp3Modes.map((modeOption) => (
                  <label key={modeOption.id} className="flex items-center space-x-3 p-4 border border-white/10 bg-gray-200/50 rounded-xl hover:bg-gray-300/50 cursor-pointer transition-all duration-200 backdrop-blur-sm">
                    <input
                      type="radio"
                      name="mode"
                      value={modeOption.id}
                      checked={mode === modeOption.id}
                      onChange={(e) => setMode(e.target.value)}
                      className="text-gray-600 focus:ring-gray-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{modeOption.name}</div>
                      <div className="text-sm text-gray-700">{modeOption.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Audio Processing Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Audio Processing
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-white/10 bg-gray-200/50 rounded-xl hover:bg-gray-300/50 cursor-pointer transition-all duration-200 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    checked={normalize}
                    onChange={(e) => setNormalize(e.target.checked)}
                    className="text-gray-600 focus:ring-gray-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Audio Normalization</div>
                    <div className="text-sm text-gray-700">Normalize audio levels for consistent volume</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-white/10 bg-gray-200/50 rounded-xl hover:bg-gray-300/50 cursor-pointer transition-all duration-200 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    checked={removeSilence}
                    onChange={(e) => setRemoveSilence(e.target.checked)}
                    className="text-gray-600 focus:ring-gray-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Remove Silence</div>
                    <div className="text-sm text-gray-700">Remove silent parts from beginning and end</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-900 py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isConverting ? "Converting to MP3..." : "Convert to MP3"}
            </button>

            {/* Progress Bar */}
            {isConverting && (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">MP3 Conversion Result</h3>
          
          {conversionResult ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-green-700 font-medium">MP3 Conversion Successful!</span>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">MP3 File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Original Format:</span>
                    <span className="font-medium text-gray-900">{conversionResult.originalFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Quality:</span>
                    <span className="font-medium text-gray-900">{conversionResult.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Encoding Mode:</span>
                    <span className="font-medium text-gray-900">{conversionResult.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Original Size:</span>
                    <span className="font-medium text-gray-900">{formatFileSize(conversionResult.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">MP3 Size:</span>
                    <span className="font-medium text-gray-900">{formatFileSize(conversionResult.convertedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Size Change:</span>
                    <span className={`font-medium ${
                      conversionResult.convertedSize < conversionResult.originalSize 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {conversionResult.convertedSize < conversionResult.originalSize ? '-' : '+'}
                      {formatFileSize(Math.abs(conversionResult.convertedSize - conversionResult.originalSize))}
                    </span>
                  </div>
                  {conversionResult.normalize && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Audio Normalization:</span>
                      <span className="font-medium text-green-600">✓ Applied</span>
                    </div>
                  )}
                  {conversionResult.removeSilence && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Silence Removal:</span>
                      <span className="font-medium text-green-600">✓ Applied</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Details */}
              {conversionResult.fileInfo && (
                <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-600 mb-3">Audio Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-medium text-gray-900">{formatDuration(conversionResult.fileInfo.duration)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Bitrate:</span>
                      <div className="font-medium text-gray-900">{conversionResult.fileInfo.bitrate ? Math.round(conversionResult.fileInfo.bitrate / 1000) + ' kbps' : 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Sample Rate:</span>
                      <div className="font-medium text-gray-900">{conversionResult.fileInfo.sampleRate ? Math.round(conversionResult.fileInfo.sampleRate / 1000) + ' kHz' : 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Channels:</span>
                      <div className="font-medium text-gray-900">{conversionResult.fileInfo.channels || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-gray-900 py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                <span>📥</span>
                <span>Download {conversionResult.fileName}</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎵</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert to MP3</h4>
              <p className="text-gray-700">
                Select an audio file and configure your MP3 settings to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MP3 Quality Guide */}
      <div className="mt-8 bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-600 mb-4">MP3 Quality Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">320 kbps</div>
            <div className="text-sm text-gray-700">CD quality, largest file size</div>
          </div>
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">256 kbps</div>
            <div className="text-sm text-gray-700">Near CD quality, high quality</div>
          </div>
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">192 kbps</div>
            <div className="text-sm text-gray-700">High quality, good balance</div>
          </div>
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">128 kbps</div>
            <div className="text-sm text-gray-700">Standard quality, most common</div>
          </div>
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">96 kbps</div>
            <div className="text-sm text-gray-700">Lower quality, smaller size</div>
          </div>
          <div className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
            <div className="font-semibold text-gray-900">64 kbps</div>
            <div className="text-sm text-gray-700">Low quality, very small size</div>
          </div>
        </div>
      </div>
    </div>
  );
}
