"use client";

import { useState, useEffect, useCallback } from "react";

export default function VideoToGifClient() {
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
        // Dynamic imports to avoid SSR issues
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
        
        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on("log", ({ message }) => console.log(message));
        ffmpegInstance.on("progress", ({ progress }) =>
          setProgress(Math.round(progress * 100))
        );

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        
        setFFmpeg(ffmpegInstance);
        setReady(true);
        setLoadingMessage("");
        console.log('FFmpeg loaded successfully');
      } catch (err) {
        console.error("FFmpeg failed to load:", err);
        setLoadingMessage("Failed to load FFmpeg. Please refresh the page.");
      }
    };

    loadFFmpeg();
  }, []);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file.");
      return;
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Please select a video file smaller than 50MB.");
      return;
    }
    
    setVideo(file);
    setGif(null);
    setConvertedFileName("");
  };

  // Convert video -> gif (try server-side first, fallback to client-side)
  const handleConvert = useCallback(async () => {
    if (!video) return;
    setIsLoading(true);
    setProgress(0);

    try {
      // First try server-side conversion
      console.log('Trying server-side conversion...');
      const formData = new FormData();
      formData.append('file', video);

      const response = await fetch('/api/convert/video-gif', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Server-side conversion successful');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGif(url);
        setConvertedFileName(video.name.replace(/\.[^/.]+$/, ".gif"));
        setIsLoading(false);
        setProgress(0);
        return;
      } else {
        console.log('Server-side conversion failed, trying client-side...');
      }
    } catch (serverError) {
      console.log('Server-side conversion error, trying client-side...', serverError);
    }

    // Fallback to client-side conversion
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait for it to load or refresh the page.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      console.log('Using client-side FFmpeg conversion...');
      const { fetchFile } = await import("@ffmpeg/util");
      
      const inputName = "input." + video.name.split(".").pop();
      const outputName = "output.gif";

      // Write input video
      await ffmpeg.writeFile(inputName, await fetchFile(video));

      // Run FFmpeg with optimized GIF settings
      await ffmpeg.exec([
        "-i", inputName,
        "-vf", "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-loop", "0",
        "-t", "5", // limit 5s for demo
        outputName,
      ]);

      // Read output
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: "image/gif" });
      const url = URL.createObjectURL(blob);

      setGif(url);
      setConvertedFileName(video.name.replace(/\.[^/.]+$/, ".gif"));
      console.log('Client-side conversion successful');
    } catch (err) {
      console.error("Both server and client conversion failed:", err);
      alert("Failed to convert video. Please try with a smaller file or refresh the page.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [video, ready, ffmpeg]);

  // Download gif
  const handleDownload = useCallback(() => {
    if (!gif || !convertedFileName) return;
    const link = document.createElement("a");
    link.href = gif;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload Video File</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Video File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
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
                    {video ? video.name : "Click to select video file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: MP4, MOV, AVI, and other video formats (max 50MB)
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
                <h4 className="font-semibold text-gray-900 mb-3">Selected Video File</h4>
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
                <h4 className="font-semibold text-gray-900 mb-3">Converting Video</h4>
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
                    Converting video to animated GIF with optimized settings...
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
                    <div className="font-medium text-gray-900">Video</div>
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
                <h4 className="font-semibold text-gray-900 mb-3">Video Preview</h4>
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
                    <div className="font-medium text-gray-900">Video</div>
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
                  Your video is ready to be converted to an animated GIF.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select a video file to start converting it to an animated GIF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}