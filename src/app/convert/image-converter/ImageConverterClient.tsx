"use client";

import { useMemo, useState } from "react";

type Target = "png" | "jpg" | "webp" | "svg";

export default function ImageConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<Target>("png");
  const [quality, setQuality] = useState<number>(80);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const isDisabled = useMemo(() => isLoading || !file, [isLoading, file]);

  async function handleConvert() {
    if (!file) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);
      form.append("quality", String(quality));

      const res = await fetch("/api/convert/image", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Set the converted image for preview
      setConvertedImageUrl(url);
      setConvertedFileName(`converted.${target}`);
    } catch (e) {
      console.error(e);
      alert("Conversion failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownload() {
    if (!convertedImageUrl || !convertedFileName) return;
    
    const a = document.createElement("a");
    a.href = convertedImageUrl;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleReset() {
    setConvertedImageUrl(null);
    setConvertedFileName("");
    setFile(null);
  }

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert Image Format</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-gray-700">
                    {file ? file.name : "Click to select image file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: JPG, PNG, WEBP, SVG, GIF, BMP, TIFF
                  </div>
                </button>
              </div>
              
              {file && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🖼️</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Output Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["png", "jpg", "webp", "svg"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTarget(fmt as Target)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      target === fmt 
                        ? "bg-gray-600 text-white border-gray-600" 
                        : "bg-gray-200/50 text-gray-900 border-gray-300/50 hover:bg-gray-300/50 backdrop-blur-sm"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Settings */}
            {target !== "svg" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-3 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-600 mt-1">Higher quality yields larger files</p>
              </div>
            )}

            {/* Convert Button */}
            <button
              type="button"
              onClick={handleConvert}
              disabled={isDisabled}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert Image"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {convertedImageUrl ? (
            <div className="space-y-6">
              {/* Converted Image Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Converted Image Preview</h4>
                <div className="flex justify-center">
                  <img
                    src={convertedImageUrl}
                    alt="Converted Preview"
                    className="max-w-full max-h-64 rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download Converted Image</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📁</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: {target.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download Image
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
                    <div className="font-medium text-gray-900">{file?.name.split('.').pop()?.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Converted Format:</span>
                    <div className="font-medium text-gray-900">{target.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Original Size:</span>
                    <div className="font-medium text-gray-900">{file ? (file.size / (1024 * 1024)).toFixed(2) : '0'} MB</div>
                  </div>
                  {target !== "svg" && (
                    <div>
                      <span className="text-gray-700">Quality Used:</span>
                      <div className="font-medium text-gray-900">{quality}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-6">
              {/* Original Image Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Original Image Preview</h4>
                <div className="flex justify-center">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Original Preview"
                    className="max-w-full max-h-64 rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Original Format:</span>
                    <div className="font-medium text-gray-900">{file.name.split('.').pop()?.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">{target.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">File Size:</span>
                    <div className="font-medium text-gray-900">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                  </div>
                  {target !== "svg" && (
                    <div>
                      <span className="text-gray-700">Quality:</span>
                      <div className="font-medium text-gray-900">{quality}%</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">🖼️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your image is ready to be converted to {target.toUpperCase()} format.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🖼️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select an image file and choose your target format to start conversion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


