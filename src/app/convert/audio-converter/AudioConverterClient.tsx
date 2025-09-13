"use client";

import { useState, useCallback, useRef } from "react";

type AudioFormat = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
};

const supportedFormats: AudioFormat[] = [
  {
    id: "mp3",
    name: "MP3",
    extension: "mp3",
    mimeType: "audio/mpeg",
    description: "MPEG Audio Layer III - Most common audio format"
  },
  {
    id: "wav",
    name: "WAV",
    extension: "wav",
    mimeType: "audio/wav",
    description: "Waveform Audio File Format - Uncompressed audio"
  },
  {
    id: "ogg",
    name: "OGG",
    extension: "ogg",
    mimeType: "audio/ogg",
    description: "Ogg Vorbis - Open source audio format"
  },
  {
    id: "flac",
    name: "FLAC",
    extension: "flac",
    mimeType: "audio/flac",
    description: "Free Lossless Audio Codec - Lossless compression"
  },
  {
    id: "aac",
    name: "AAC",
    extension: "aac",
    mimeType: "audio/aac",
    description: "Advanced Audio Coding - High quality compression"
  },
  {
    id: "m4a",
    name: "M4A",
    extension: "m4a",
    mimeType: "audio/mp4",
    description: "MPEG-4 Audio - Apple's audio format"
  },
  {
    id: "wma",
    name: "WMA",
    extension: "wma",
    mimeType: "audio/x-ms-wma",
    description: "Windows Media Audio - Microsoft's audio format"
  }
];

const qualityOptions = [
  { id: "high", name: "High Quality", description: "Best quality, larger file size" },
  { id: "medium", name: "Medium Quality", description: "Good balance of quality and size" },
  { id: "low", name: "Low Quality", description: "Smaller file size, lower quality" }
];

export default function AudioConverterClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState("mp3");
  const [quality, setQuality] = useState("high");
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
      const isValidFormat = supportedFormats.some(format => format.extension === fileExtension);
      
      if (!isValidFormat) {
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
      formData.append("targetFormat", targetFormat);
      formData.append("quality", quality);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/convert/audio-converter', {
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
  }, [selectedFile, targetFormat, quality]);

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

  const getFileIcon = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'mp3': return '🎵';
      case 'wav': return '🔊';
      case 'ogg': return '🎶';
      case 'flac': return '🎼';
      case 'aac': return '🎧';
      case 'm4a': return '🍎';
      case 'wma': return '🪟';
      default: return '🎵';
    }
  };

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert Audio File</h3>
          
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
                  accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.wma"
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
                    Supports: MP3, WAV, OGG, FLAC, AAC, M4A, WMA
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

            {/* Target Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Convert To
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300/50 bg-gray-200/50 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              >
                {supportedFormats.map((format) => (
                  <option key={format.id} value={format.id} className="bg-slate-800 text-gray-900">
                    {format.name} - {format.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <div className="space-y-2">
                {qualityOptions.map((option) => (
                  <label key={option.id} className="flex items-center space-x-3 p-4 border border-white/10 bg-gray-200/50 rounded-xl hover:bg-gray-300/50 cursor-pointer transition-all duration-200 backdrop-blur-sm">
                    <input
                      type="radio"
                      name="quality"
                      value={option.id}
                      checked={quality === option.id}
                      onChange={(e) => setQuality(e.target.value)}
                      className="text-gray-600 focus:ring-gray-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-700">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-900 py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isConverting ? "Converting..." : "Convert Audio"}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {conversionResult ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-green-700 font-medium">Conversion Successful!</span>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Original Format:</span>
                    <span className="font-medium text-gray-900">{conversionResult.originalFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Target Format:</span>
                    <span className="font-medium text-gray-900">{conversionResult.targetFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Quality:</span>
                    <span className="font-medium text-gray-900 capitalize">{conversionResult.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Original Size:</span>
                    <span className="font-medium text-gray-900">{formatFileSize(conversionResult.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Converted Size:</span>
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
                </div>
              </div>

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
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select an audio file and choose your target format to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats Info */}
      <div className="mt-8 bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-600 mb-4">Supported Audio Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedFormats.map((format) => (
            <div key={format.id} className="bg-gray-200/50 border border-gray-300/50 p-4 rounded-xl backdrop-blur-sm hover:bg-gray-300/50 transition-all duration-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{getFileIcon(format.extension)}</span>
                <span className="font-semibold text-gray-900">{format.name}</span>
              </div>
              <p className="text-sm text-gray-700">{format.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
