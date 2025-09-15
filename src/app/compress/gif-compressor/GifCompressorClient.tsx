"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FileUpload from '@/components/FileUpload';

export default function GifCompressorClient() {
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_MIME_TYPES = ['image/gif'];
  const ALLOWED_EXTENSIONS = ['gif'];

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

  const resetState = () => {
    setGifFile(null);
    setOutUrl(null);
    setCompressedFileName("");
    setError(null);
    setProgress(0);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFileChange = (selectedFile: File) => {
    console.log('File selected:', selectedFile.name); // Debug log
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    
    // Simulate upload progress with a more reliable approach
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 20 + 5; // More predictable increment
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsUploading(false);
          setGifFile(selectedFile);
          setOutUrl(null);
          setCompressedFileName("");
          setProgress(0);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(currentProgress);
    }, 150);

    // Fallback cleanup after 3 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(100);
      setGifFile(selectedFile);
      setOutUrl(null);
      setCompressedFileName("");
      setProgress(0);
      setUploadingFileName("");
    }, 3000);
  };

  const compressServer = useCallback(async () => {
    if (!gifFile) return null;
    const form = new FormData();
    form.append("file", gifFile);
    form.append("fps", String(fps));
    form.append("scale", String(scale));
    form.append("colors", String(colors));
    const resp = await fetch("/api/compress/gif", { method: "POST", body: form });
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Server error:", resp.status, errorText);
      throw new Error(`Server compression failed: ${resp.status} - ${errorText}`);
    }
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
      // Prefer client-side when FFmpeg is ready; otherwise try server first
      const tryClientFirst = ready;

      let blob: Blob | null = null;
      if (tryClientFirst) {
        try {
          blob = await compressClient();
        } catch (clientErr) {
          console.warn("Client compression failed, trying server...", clientErr);
          blob = await compressServer();
        }
      } else {
        try {
          blob = await compressServer();
        } catch (serverErr) {
          console.warn("Server compression failed, trying client...", serverErr);
          blob = await compressClient();
        }
      }

      if (!blob) throw new Error("Compression failed");
      setOutUrl(URL.createObjectURL(blob));
      setCompressedFileName(gifFile.name.replace(/\.[^/.]+$/, "") + "-compressed.gif");
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Failed to compress GIF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [gifFile, ready, compressServer, compressClient]);

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
    <div className="max-w-4xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <FileUpload
            onFileChange={handleFileChange}
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            icon="🎬"
            placeholder="Upload a GIF file to compress"
          />


          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Uploading {uploadingFileName}...</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Compression Settings */}
          {gifFile && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Compression Settings</h3>
              
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
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slow (2 FPS)</span>
                    <span>Fast (30 FPS)</span>
                  </div>
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
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small (10%)</span>
                    <span>Original (100%)</span>
                  </div>
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
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Few (2)</span>
                    <span>Many (256)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Status */}
          {loadingMessage && (
            <div className="bg-blue-200/50 border border-blue-300/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-blue-700 text-sm">{loadingMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Compress Button */}
          {gifFile && (
            <button
              onClick={compress}
              disabled={!gifFile || isProcessing}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Compressing... {progress}%
                  </>
                ) : !ready ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading FFmpeg...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Compress GIF
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button */}
          {outUrl && (
            <button
              onClick={download}
              className="w-full py-4 bg-green-600/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Compressed GIF
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


