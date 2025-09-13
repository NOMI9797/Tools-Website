"use client";

import { useState, useCallback } from "react";

export default function HeicToJpgClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.heic')) {
      alert('Please select a HEIC image file (.heic extension)');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please select a file smaller than 10MB.');
      return;
    }

    setFile(file);
    // Reset converted image
    setConvertedImage(null);
    setConvertedFileName("");
    // For HEIC files, we can't create a preview directly in the browser
    setPreview(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/heic-jpg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      setConvertedImage(`data:image/jpeg;base64,${data.base64}`);
      setConvertedFileName(file.name.replace(/\.heic$/i, '.jpg') || 'converted.jpg');
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        alert(`Conversion failed: ${error.message}`);
      } else {
        alert('Failed to convert image. Please ensure the file is a valid HEIC image from an iPhone or compatible device.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedImage || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImage, convertedFileName]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setConvertedImage(null);
    setConvertedFileName("");
  }, []);

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert HEIC to JPG</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select HEIC File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".heic"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-gray-700">
                    {file ? file.name : "Click to select HEIC file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: HEIC format only (.heic extension)
                  </div>
                </button>
              </div>
              
              {file && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!file || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert to JPG"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {convertedImage ? (
            <div className="space-y-6">
              {/* Converted Image Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Converted JPG Preview</h4>
                <div className="flex justify-center">
                  <img
                    src={convertedImage}
                    alt="Converted Preview"
                    className="max-w-full max-h-64 rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download Converted JPG</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📁</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: JPG</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download JPG
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50"
                    >
                      🔄 Convert Another
                    </button>
                  </div>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Conversion Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Original Format:</span>
                    <div className="font-medium text-gray-900">HEIC</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Converted Format:</span>
                    <div className="font-medium text-gray-900">JPG</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Original Size:</span>
                    <div className="font-medium text-gray-900">{file ? (file.size / (1024 * 1024)).toFixed(2) : '0'} MB</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900">High Quality</div>
                  </div>
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-6">
              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">HEIC</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">JPG</div>
                  </div>
                  <div>
                    <span className="text-gray-700">File Size:</span>
                    <div className="font-medium text-gray-900">{file ? (file.size / (1024 * 1024)).toFixed(2) : '0'} MB</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900">High Quality</div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">📱</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your HEIC image is ready to be converted to JPG format.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Note: HEIC files cannot be previewed in the browser, but conversion will work perfectly.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">📱</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select a HEIC image file to start conversion to JPG format.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Perfect for converting iPhone photos to widely compatible JPG format.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
