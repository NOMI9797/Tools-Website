"use client";

import { useCallback, useRef, useState } from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageCompressorClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file (JPG/PNG/WEBP).");
      return;
    }
    setFile(f);
    setOriginalSize(f.size);
    setCompressedUrl(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const drawToCanvas = async (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    if (maxWidth > 0 || maxHeight > 0) {
      const ratioW = maxWidth > 0 ? maxWidth / targetW : 1;
      const ratioH = maxHeight > 0 ? maxHeight / targetH : 1;
      const ratio = Math.min(ratioW || 1, ratioH || 1);
      if (ratio > 0 && ratio < 1) {
        targetW = Math.floor(targetW * ratio);
        targetH = Math.floor(targetH * ratio);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas;
  };

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setCompressedUrl(null);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = await drawToCanvas(img);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), format, quality)
      );
      if (!blob) throw new Error("Compression failed");

      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
    } catch (e) {
      console.error(e);
      alert("Failed to compress image.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, format, quality, maxWidth, maxHeight]);

  const handleDownload = () => {
    if (!compressedUrl || !file) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
    a.download = file.name.replace(/\.[^/.]+$/, "") + "-compressed." + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload and Configure</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-gray-600">
                  {file ? file.name : "Click to select image"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Supports: JPG, PNG, WEBP
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="image/jpeg">JPG (best size)</option>
                  <option value="image/webp">WEBP (modern)</option>
                  <option value="image/png">PNG (lossless)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600">{Math.round(quality * 100)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Width (px)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 = original"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value || "0"))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Height (px)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 = original"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(parseInt(e.target.value || "0"))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Compressing..." : "Compress Image"}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Preview & Result</h3>
          <div className="space-y-4">
            {preview && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img src={preview} alt="Original preview" className="w-full h-auto" />
                <div className="text-xs text-gray-600 p-2">Original size: {formatBytes(originalSize)}</div>
              </div>
            )}

            {compressedUrl && (
              <div className="rounded-lg overflow-hidden border border-green-200">
                <img src={compressedUrl} alt="Compressed preview" className="w-full h-auto" />
                <div className="text-xs text-gray-700 p-2">
                  Compressed size: {formatBytes(compressedSize)}
                  {originalSize > 0 && compressedSize > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      Saved {Math.max(0, (1 - compressedSize / originalSize) * 100).toFixed(1)}%
                    </>
                  )}
                </div>
                <div className="p-2">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Download Compressed Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


