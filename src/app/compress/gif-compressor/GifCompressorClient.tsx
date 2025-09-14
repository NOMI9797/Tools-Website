"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function GifCompressorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(8);
  const [scale, setScale] = useState<number>(80);
  const [colors, setColors] = useState<number>(64);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [compressedFileName, setCompressedFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMessage("Loading FFmpeg...");
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        const instance = new FFmpeg();
        instance.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        setFFmpeg(instance);
        setReady(true);
        setLoadingMessage("");
      } catch (e) {
        console.error("FFmpeg load failed", e);
        setLoadingMessage("FFmpeg loading failed");
      }
    };
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "image/gif") { 
      setError("Please select a GIF file");
      return; 
    }
    setGifFile(f);
    setOutUrl(null);
    setCompressedFileName("");
    setError(null);
  };

  const compressServer = useCallback(async () => {
    if (!gifFile) return null;
    const form = new FormData();
    form.append("file", gifFile);
    form.append("fps", String(fps));
    form.append("scale", String(scale));
    form.append("colors", String(colors));
    const resp = await fetch("/api/compress/gif", { method: "POST", body: form });
    if (!resp.ok) throw new Error("Server compression failed");
    return await resp.blob();
  }, [gifFile, fps, scale, colors]);

  const compressClient = useCallback(async () => {
    if (!gifFile || !ffmpeg) return null;
    const { fetchFile } = await import("@ffmpeg/util");
    const inName = "input.gif";
    const outName = "output.gif";
    await ffmpeg.writeFile(inName, await fetchFile(gifFile));
    const scaleExpr = scale !== 100 ? `scale=iw*${scale}/100:ih*${scale}/100:flags=lanczos` : "scale=iw:ih";
    const palette = "palette.png";
    await ffmpeg.exec(["-i", inName, "-vf", `${scaleExpr},fps=${fps},palettegen=max_colors=${colors}`, palette]);
    await ffmpeg.exec(["-i", inName, "-i", palette, "-lavfi", `${scaleExpr},fps=${fps}[x];[x][1:v]paletteuse=dither=sierra2_4a`, "-gifflags", "+transdiff", outName]);
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(inName);
    await ffmpeg.deleteFile(outName);
    await ffmpeg.deleteFile(palette);
    return new Blob([data as Uint8Array], { type: "image/gif" });
  }, [gifFile, ffmpeg, fps, scale, colors]);

  const compress = useCallback(async () => {
    if (!gifFile) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      let blob = await compressServer();
      if (!blob) {
        blob = await compressClient();
      }
      if (!blob) throw new Error("Compression failed");
      setOutUrl(URL.createObjectURL(blob));
      setCompressedFileName(gifFile.name.replace(/\.[^/.]+$/, "") + "-compressed.gif");
    } catch (e) {
      console.error(e);
      setError("Failed to compress GIF. Please try again.");
    } finally {
      setIsProcessing(false); 
      setProgress(0);
    }
  }, [gifFile, compressServer, compressClient]);

  const download = () => {
    if (!outUrl || !gifFile) return;
    const a = document.createElement("a");
    a.href = outUrl;
    a.download = compressedFileName || gifFile.name.replace(/\.[^/.]+$/, "") + "-compressed.gif";
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setGifFile(null);
    setOutUrl(null);
    setCompressedFileName("");
    setError(null);
    setProgress(0);
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
            Upload GIF Animation
          </h2>
          
          <div className="space-y-4">
            <input ref={inputRef} type="file" accept="image/gif" onChange={onChange} className="hidden" />
            
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-gray-400 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group"
            >
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-600 group-hover:text-blue-600">
                  Click to upload GIF animation
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports .gif files up to 50MB
                </p>
              </div>
            </button>
            
            {gifFile && (
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800">{gifFile.name}</p>
                      <p className="text-sm text-gray-600">{fmt(gifFile.size)}</p>
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
        {gifFile && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Compression Settings
            </h2>
            
            <div className="space-y-4">
              {/* FPS Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frame Rate: {fps} FPS
                </label>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow (2 FPS)</span>
                  <span>Fast (30 FPS)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Lower FPS = smaller file size, higher FPS = smoother animation
                </p>
              </div>

              {/* Scale Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale: {scale}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Small (10%)</span>
                  <span>Original (100%)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Lower scale = smaller file size, higher scale = better quality
                </p>
              </div>

              {/* Colors Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colors: {colors}
                </label>
                <input
                  type="range"
                  min={2}
                  max={256}
                  step={2}
                  value={colors}
                  onChange={(e) => setColors(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Few (2)</span>
                  <span>Many (256)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Fewer colors = smaller file size, more colors = better quality
                </p>
              </div>
              
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> GIF compression works best with lower FPS, smaller scale, and fewer colors. Server-side compression provides better optimization than client-side.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {gifFile && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex space-x-3">
              <button
                onClick={compress}
                disabled={!gifFile || isProcessing || !ready}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
              >
                {isProcessing ? (
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
                    Compress GIF
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

        {/* Loading Status */}
        {loadingMessage && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center">
              <svg className="animate-spin w-6 h-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Loading</h3>
                <p className="text-blue-600 mt-1">{loadingMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* GIF Preview */}
        {gifFile && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              GIF Preview
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Original GIF</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(gifFile)} alt="Original" className="w-full h-auto max-h-64 object-contain" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Size: {fmt(gifFile.size)}</p>
              </div>
              
              {outUrl && (
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Compressed GIF</h4>
                  <div className="rounded-lg overflow-hidden border border-green-200">
                    <img src={outUrl} alt="Compressed" className="w-full h-auto max-h-64 object-contain" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Size: {fmt((outUrl ? new Blob([outUrl]).size : 0))}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compression Results */}
        {outUrl && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compression Complete
            </h3>
            
            <div className="space-y-4">
              {/* Settings Used */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Settings Used</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frame Rate:</span>
                    <span className="font-medium text-gray-800">{fps} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scale:</span>
                    <span className="font-medium text-gray-800">{scale}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colors:</span>
                    <span className="font-medium text-gray-800">{colors}</span>
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
                Download Compressed GIF
              </button>
            </div>
          </div>
        )}

        {/* Ready State */}
        {!gifFile && (
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm text-center">
            <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Compress</h3>
            <p className="text-gray-600">Upload a GIF animation to get started with compression</p>
          </div>
        )}
      </div>
    </div>
  );
}


