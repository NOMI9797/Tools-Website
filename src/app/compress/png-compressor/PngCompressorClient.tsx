"use client";

import { useCallback, useRef, useState } from "react";

export default function PngCompressorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(6); // 0-9
  const [palette, setPalette] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [origSize, setOrigSize] = useState<number>(0);
  const [outSize, setOutSize] = useState<number>(0);
  const [compressedFileName, setCompressedFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.includes("png")) {
      setError("Please select a PNG file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOrigSize(f.size);
    setResultUrl(null);
    setCompressedFileName("");
    setError(null);
  };

  // Client-side canvas path: re-encode to PNG. Note: canvas PNG compression is limited.
  const handleClient = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("Compression failed");
      setOutSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setCompressedFileName(file.name.replace(/\.[^/.]+$/, "") + "-compressed.png");
    } catch (e) {
      console.error(e);
      setError("Failed to compress PNG. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const handleServer = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("level", String(level));
      form.append("palette", String(palette));
      const resp = await fetch("/api/compress/png", { method: "POST", body: form });
      if (!resp.ok) throw new Error("API compression failed");
      const blob = await resp.blob();
      setOutSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setCompressedFileName(file.name.replace(/\.[^/.]+$/, "") + "-compressed.png");
    } catch (e) {
      console.error(e);
      setError("Server compression failed, falling back to client-side compression");
      throw e;
    } finally {
      setIsProcessing(false);
    }
  }, [file, level, palette]);

  const compress = useCallback(async () => {
    setError(null);
    try {
      await handleServer();
    } catch (e) {
      console.warn('Server compression failed, falling back to client');
      await handleClient();
    }
  }, [handleServer, handleClient]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = compressedFileName || file.name.replace(/\.[^/.]+$/, "") + "-compressed.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setCompressedFileName("");
    setError(null);
    setOrigSize(0);
    setOutSize(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const fmt = (b: number) => {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; let i = 0; let v = b;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(2) + " " + u[i];
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
            Upload PNG Image
          </h2>
          
          <div className="space-y-4">
            <input ref={inputRef} type="file" accept="image/png" onChange={onChange} className="hidden" />
            
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-gray-400 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group"
            >
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-600 group-hover:text-blue-600">
                  Click to upload PNG image
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports .png files up to 50MB
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
                      <p className="text-sm text-gray-600">{fmt(file.size)}</p>
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
              {/* Compression Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Level: {level} / 9
                </label>
                <input
                  type="range"
                  min={0}
                  max={9}
                  step={1}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fast (0)</span>
                  <span>Best (9)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Higher levels = better compression but slower processing
                </p>
              </div>

              {/* Palette Optimization Option */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={palette}
                    onChange={(e) => setPalette(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Enable Palette Optimization</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Reduces colors to optimize file size while maintaining visual quality
                    </p>
                  </div>
                </label>
              </div>
              
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> PNG compression works best on images with solid colors, graphics, and transparency. Server-side compression provides better optimization than client-side.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex space-x-3">
              <button
                onClick={compress}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Compressing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Compress PNG
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

        {/* Image Preview */}
        {file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image Preview
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Original PNG</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={preview || ''} alt="Original" className="w-full h-auto max-h-64 object-contain" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Size: {fmt(origSize)}</p>
              </div>
              
              {resultUrl && (
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Compressed PNG</h4>
                  <div className="rounded-lg overflow-hidden border border-green-200">
                    <img src={resultUrl} alt="Compressed" className="w-full h-auto max-h-64 object-contain" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Size: {fmt(outSize)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compression Results */}
        {resultUrl && (
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
                    <p className="text-2xl font-bold text-gray-800">{fmt(origSize)}</p>
                    <p className="text-sm text-gray-600">Original</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{fmt(outSize)}</p>
                    <p className="text-sm text-gray-600">Compressed</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-lg font-semibold text-green-600">
                    {Math.max(0, (1 - outSize / origSize) * 100).toFixed(1)}% smaller
                  </p>
                  <p className="text-sm text-gray-600">
                    {fmt(origSize - outSize)} saved
                  </p>
                </div>
              </div>

              {/* Settings Used */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Settings Used</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compression Level:</span>
                    <span className="font-medium text-gray-800">{level} / 9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Palette Optimization:</span>
                    <span className="font-medium text-gray-800">{palette ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium text-gray-800">PNG</span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={download}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Compressed PNG
              </button>
            </div>
          </div>
        )}

        {/* Ready State */}
        {!file && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm text-center">
            <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Compress</h3>
            <p className="text-gray-600">Upload a PNG image to get started with compression</p>
          </div>
        )}
      </div>
    </div>
  );
}


