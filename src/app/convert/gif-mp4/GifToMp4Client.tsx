"use client";

import { useState, useEffect, useCallback } from "react";

export default function GifToMp4Client() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [gif, setGif] = useState<File | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");

        const instance = new FFmpeg();
        instance.on("log", ({ message }) => console.log(message));
        instance.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setFFmpeg(instance);
        setReady(true);
        setLoadingMessage("");
        console.log('FFmpeg loaded successfully');
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
        setLoadingMessage("Failed to load FFmpeg. Please refresh the page.");
      }
    };
    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.gif')) {
      alert('Please upload a .gif file');
      return;
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Please select a GIF file smaller than 50MB.");
      return;
    }
    
    setGif(file);
    setMp4Url(null);
    setConvertedFileName("");
  };

  const handleConvert = useCallback(async () => {
    if (!gif) return;
    setIsLoading(true);
    setProgress(0);

    // Try server route first
    try {
      const form = new FormData();
      form.append('file', gif);
      const res = await fetch('/api/convert/gif-mp4', { method: 'POST', body: form });
      if (res.ok) {
        const blob = await res.blob();
        setMp4Url(URL.createObjectURL(blob));
        setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".mp4"));
        setIsLoading(false);
        setProgress(0);
        return;
      }
    } catch {}

    // Fallback to client-side
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait or refresh.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const input = 'input.gif';
      const output = 'output.mp4';
      await ffmpeg.writeFile(input, await fetchFile(gif));
      await ffmpeg.exec([
        '-i', input,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        output,
      ]);
      const data = await ffmpeg.readFile(output);
      const blob = new Blob([data], { type: 'video/mp4' });
      setMp4Url(URL.createObjectURL(blob));
      setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".mp4"));
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [gif, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!mp4Url || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = mp4Url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [mp4Url, convertedFileName]);

  const handleReset = useCallback(() => {
    setGif(null);
    setMp4Url(null);
    setConvertedFileName("");
  }, []);

  if (!ready) {
    return (
      <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">⚙️</div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading FFmpeg</h4>
        <p className="text-gray-700 mb-4">{loadingMessage || "Loading FFmpeg… please wait"}</p>
        <div className="w-full bg-gray-300/50 rounded-full h-2">
          <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload GIF File</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select GIF File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/gif"
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
                  <div className="text-4xl mb-2">🎞️</div>
                  <div className="text-gray-700">
                    {gif ? gif.name : "Click to select GIF file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: GIF format only (max 50MB)
                  </div>
                </button>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!gif || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert to MP4"}
            </button>

            {/* File Information */}
            {gif && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Selected GIF File</h4>
                <div className="flex items-center space-x-3 p-3 bg-gray-300/50 rounded-lg">
                  <span className="text-2xl">🎞️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{gif.name}</div>
                    <div className="text-sm text-gray-700">
                      {(gif.size / (1024 * 1024)).toFixed(2)} MB • {gif.type}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isLoading && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Converting GIF</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Processing...</span>
                    <span className="text-sm font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-300/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-gray-600 to-gray-700 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Converting GIF to MP4 video with optimized settings...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {mp4Url ? (
            <div className="space-y-6">
              {/* MP4 Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Generated MP4</h4>
                <div className="rounded-lg overflow-hidden border border-gray-300/50">
                  <video 
                    src={mp4Url} 
                    controls 
                    className="w-full h-auto"
                    preload="metadata"
                  />
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download MP4</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎬</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: MP4</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download MP4
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

              {/* Conversion Details */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Conversion Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Source Format:</span>
                    <div className="font-medium text-gray-900">GIF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Output Format:</span>
                    <div className="font-medium text-gray-900">MP4</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900">High Quality</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Compatibility:</span>
                    <div className="font-medium text-gray-900">Universal</div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-300/50 rounded-lg">
                  <p className="text-xs text-gray-700">
                    High-quality MP4 video created with optimized encoding. 
                    Uses server-side FFmpeg when available, falls back to client-side processing.
                  </p>
                </div>
              </div>
            </div>
          ) : gif ? (
            <div className="space-y-6">
              {/* GIF Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">GIF Preview</h4>
                <div className="rounded-lg overflow-hidden border border-gray-300/50">
                  <img 
                    src={URL.createObjectURL(gif)} 
                    alt="GIF Preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">GIF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">MP4</div>
                  </div>
                  <div>
                    <span className="text-gray-700">File Size:</span>
                    <div className="font-medium text-gray-900">
                      {(gif.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Type:</span>
                    <div className="font-medium text-gray-900">{gif.type}</div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">🎞️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your GIF is ready to be converted to an MP4 video.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎞️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select a GIF file to start converting it to an MP4 video.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


