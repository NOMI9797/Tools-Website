"use client";

import { useState, useEffect, useCallback } from "react";

export default function VideoToGifClient() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [gif, setGif] = useState<string | null>(null);
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
    setVideo(file);
    setGif(null);
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
  const handleDownload = () => {
    if (!gif || !video) return;
    const link = document.createElement("a");
    link.href = gif;
    link.download = video.name.replace(/\.[^/.]+$/, ".gif");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ready) {
    return (
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <p className="text-sm text-black/60">{loadingMessage || "Loading FFmpeg… please wait"}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-black/90">Upload Video</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/[.05] file:text-black hover:file:bg-black/[.08] transition-colors"
          />
          <p className="text-xs text-black/50">
            Supports MP4, MOV, AVI, and other video formats. Max 5 seconds output.
          </p>
        </div>

        {video && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Selected File</p>
              <p className="text-xs text-black/50">
                {(video.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/[.02] border border-black/[.05]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/[.05] flex items-center justify-center">
                  <svg className="w-5 h-5 text-black/40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black/90 truncate">
                    {video.name}
                  </p>
                  <p className="text-xs text-black/50">
                    Video • {video.type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Converting...</p>
              <p className="text-xs text-black/50">{progress}%</p>
            </div>
            <div className="w-full bg-black/[.08] rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {gif && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Converted GIF</p>
              <button
                onClick={handleDownload}
                className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-black/80 transition-colors"
              >
                Download GIF
              </button>
            </div>
            <div className="rounded-lg border border-black/[.08] overflow-hidden">
              <img 
                src={gif} 
                alt="Converted GIF"
                className="w-full"
              />
            </div>
            <p className="text-xs text-black/50">
              High-quality GIF created with 10 FPS and optimized palette generation. Uses server-side FFmpeg when available, falls back to client-side processing.
            </p>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleConvert}
            disabled={!video || isLoading}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert to GIF"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">Back</a>
        </div>
      </aside>
    </div>
  );
}