"use client";

import { useState, useEffect, useCallback } from "react";

export default function Mp4ToGifClient() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [gif, setGif] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");

  // Load FFmpeg dynamically on client side only
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
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.mp4')) {
      alert('Please upload an .mp4 file');
      return;
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Please select an MP4 file smaller than 50MB.");
      return;
    }
    
    setVideo(file);
    setGif(null);
    setConvertedFileName("");
  };

  const handleConvert = useCallback(async () => {
    if (!video) return;
    setIsLoading(true);
    setProgress(0);

    // Try server route first
    try {
      const form = new FormData();
      form.append('file', video);
      const res = await fetch('/api/convert/mp4-gif', { method: 'POST', body: form });
      if (res.ok) {
        const blob = await res.blob();
        setGif(URL.createObjectURL(blob));
        setConvertedFileName(video.name.replace(/\.[^/.]+$/, ".gif"));
        setIsLoading(false);
        setProgress(0);
        return;
      }
    } catch {}

    // Fallback to client-side ffmpeg
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait or refresh.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const input = 'input.mp4';
      const output = 'output.gif';
      await ffmpeg.writeFile(input, await fetchFile(video));
      await ffmpeg.exec([
        '-i', input,
        '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', '0',
        '-t', '5',
        output,
      ]);
      const data = await ffmpeg.readFile(output);
      const blob = new Blob([data], { type: 'image/gif' });
      setGif(URL.createObjectURL(blob));
      setConvertedFileName(video.name.replace(/\.[^/.]+$/, ".gif"));
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [video, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!gif || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = gif;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [gif, convertedFileName]);

  const handleReset = useCallback(() => {
    setVideo(null);
    setGif(null);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload MP4 File</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select MP4 File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/mp4"
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
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-gray-700">
                    {video ? video.name : "Click to select MP4 file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: MP4 format only (max 50MB)
                  </div>
                </button>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!video || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert to GIF"}
            </button>

            {/* File Information */}
            {video && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Selected MP4 File</h4>
                <div className="flex items-center space-x-3 p-3 bg-gray-300/50 rounded-lg">
                  <span className="text-2xl">🎬</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{video.name}</div>
                    <div className="text-sm text-gray-700">
                      {(video.size / (1024 * 1024)).toFixed(2)} MB • {video.type}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isLoading && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Converting MP4</h4>
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
                    Converting MP4 to animated GIF with optimized settings...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {gif ? (
            <div className="space-y-6">
              {/* GIF Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Generated GIF</h4>
                <div className="rounded-lg overflow-hidden border border-gray-300/50">
                  <img 
                    src={gif} 
                    alt="Converted GIF"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download GIF</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎞️</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: GIF</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download GIF
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
                    <div className="font-medium text-gray-900">MP4</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Output Format:</span>
                    <div className="font-medium text-gray-900">GIF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Frame Rate:</span>
                    <div className="font-medium text-gray-900">10 FPS</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900">Optimized</div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-300/50 rounded-lg">
                  <p className="text-xs text-gray-700">
                    High-quality GIF created with optimized palette generation. 
                    Uses server-side FFmpeg when available, falls back to client-side processing.
                  </p>
                </div>
              </div>
            </div>
          ) : video ? (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">MP4 Preview</h4>
                <div className="rounded-lg overflow-hidden border border-gray-300/50">
                  <video 
                    src={URL.createObjectURL(video)} 
                    controls 
                    className="w-full h-auto"
                    preload="metadata"
                  />
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">MP4</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">GIF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">File Size:</span>
                    <div className="font-medium text-gray-900">
                      {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Type:</span>
                    <div className="font-medium text-gray-900">{video.type}</div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">🎬</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your MP4 video is ready to be converted to an animated GIF.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select an MP4 file to start converting it to an animated GIF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


