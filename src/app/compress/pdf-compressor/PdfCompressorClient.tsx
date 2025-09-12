"use client";

import { useCallback, useRef, useState } from "react";

export default function PdfCompressorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dpi, setDpi] = useState<number>(144); // target image DPI
  const [jpegQuality, setJpegQuality] = useState<number>(0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [origSize, setOrigSize] = useState<number>(0);
  const [outSize, setOutSize] = useState<number>(0);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }
    setFile(f);
    setResultUrl(null);
    setOrigSize(f.size);
  };

  // Server compression: basic re-save for now
  const compressViaApi = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dpi", String(dpi));
      form.append("jpegQuality", String(Math.round(jpegQuality * 100)));
      const resp = await fetch("/api/compress/pdf", { method: "POST", body: form });
      if (!resp.ok) throw new Error("API compression failed");
      const blob = await resp.blob();
      setOutSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      alert("Compression failed");
    } finally {
      setIsProcessing(false);
    }
  }, [file, dpi, jpegQuality]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf";
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Select PDF</label>
              <input ref={inputRef} type="file" accept="application/pdf" onChange={onChange} className="hidden" />
              <button type="button" onClick={() => inputRef.current?.click()} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <div className="text-4xl mb-2">📄</div>
                <div className="text-gray-600">{file ? file.name : "Click to select .pdf"}</div>
                <div className="text-sm text-gray-500 mt-1">Only PDF files are supported</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Image DPI</label>
                <input type="number" min={72} max={300} value={dpi} onChange={(e) => setDpi(parseInt(e.target.value || "144"))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                <div className="text-xs text-gray-600">Lower DPI → smaller size</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">JPEG Quality (images)</label>
                <input type="range" min={0.1} max={1} step={0.05} value={jpegQuality} onChange={(e) => setJpegQuality(parseFloat(e.target.value))} className="w-full" />
                <div className="text-xs text-gray-600">{Math.round(jpegQuality * 100)}%</div>
              </div>
            </div>

            <div>
              <button onClick={compressViaApi} disabled={!file || isProcessing} className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50">
                {isProcessing ? 'Compressing…' : 'Compress'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Result</h3>
          <div className="space-y-4">
            {file && (
              <div className="rounded-lg border p-3 text-sm text-gray-700">
                Original size: {fmt(origSize)}
              </div>
            )}
            {resultUrl && (
              <div className="rounded-lg border p-3 text-sm text-gray-700">
                Compressed size: {fmt(outSize)} {origSize ? <>• Saved {(Math.max(0, (1 - outSize / origSize) * 100)).toFixed(1)}%</> : null}
                <div className="mt-3">
                  <button onClick={download} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm">Download PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


