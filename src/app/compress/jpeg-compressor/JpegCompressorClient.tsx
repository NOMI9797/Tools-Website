"use client";

import { useCallback, useRef, useState } from "react";

export default function JpegCompressorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [progressive, setProgressive] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [origSize, setOrigSize] = useState<number>(0);
  const [outSize, setOutSize] = useState<number>(0);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!f.type.includes("jpeg") && !f.type.includes("jpg") && !(ext === "jpg" || ext === "jpeg")) {
      alert("Please select a JPEG file (.jpg or .jpeg)");
      return;
    }
    setFile(f);
    setResultUrl(null);
    setOrigSize(f.size);
    setPreview(URL.createObjectURL(f));
  };

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setResultUrl(null);
    try {
      // Client-side canvas re-encode to JPEG. Note: Canvas doesn't expose progressive toggle,
      // so progressive will be supported on server API path below. Client gives quick preview.
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

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
      );
      if (!blob) throw new Error("Compression failed");
      setOutSize(blob.size);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e) {
      console.error(e);
      alert("Failed to compress JPEG.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality]);

  const compressViaApi = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("quality", String(Math.round(quality * 100)));
      form.append("progressive", String(progressive));

      const resp = await fetch("/api/compress/jpeg", { method: "POST", body: form });
      if (!resp.ok) throw new Error("API compression failed");
      const blob = await resp.blob();
      setOutSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      alert("Server compression failed");
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality, progressive]);

  // Unified handler: prefer server, fallback to client
  const compress = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      await compressViaApi();
    } catch (e) {
      console.warn('Server compression failed, falling back to client');
      await handleCompress();
    } finally {
      setIsProcessing(false);
    }
  }, [file, compressViaApi, handleCompress]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^/.]+$/, "") + "-compressed.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fmt = (b: number) => {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; let i = 0; let v = b;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(2) + " " + u[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload and Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select JPEG</label>
              <input ref={inputRef} type="file" accept="image/jpeg" onChange={onChange} className="hidden" />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-4xl mb-2">📷</div>
                <div className="text-gray-600">{file ? file.name : "Click to select .jpg/.jpeg"}</div>
                <div className="text-sm text-gray-500 mt-1">Only JPEG files are supported</div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
              <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full" />
              <div className="text-xs text-gray-600">{Math.round(quality * 100)}%</div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={progressive} onChange={(e) => setProgressive(e.target.checked)} />
              Enable progressive JPEG (server)
            </label>

            <div>
              <button onClick={compress} disabled={!file || isProcessing} className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50">
                {isProcessing ? 'Compressing…' : 'Compress'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Preview & Result</h3>
          <div className="space-y-4">
            {preview && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img src={preview} alt="Original" className="w-full h-auto" />
                <div className="text-xs text-gray-600 p-2">Original: {fmt(origSize)}</div>
              </div>
            )}

            {resultUrl && (
              <div className="rounded-lg overflow-hidden border border-green-200">
                <img src={resultUrl} alt="Compressed" className="w-full h-auto" />
                <div className="text-xs text-gray-700 p-2">Compressed: {fmt(outSize)} {origSize ? <>• Saved {(Math.max(0, (1 - outSize / origSize) * 100)).toFixed(1)}%</> : null}</div>
                <div className="p-2">
                  <button onClick={download} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm">Download JPEG</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


