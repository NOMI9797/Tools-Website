"use client";

import { useState, useEffect, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function VideoToGifClient() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [gif, setGif] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
  const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];

  const resetState = () => {
    setVideo(null);
    setGif(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    // Simulate upload progress for UX
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setGif(null);
    setConvertedFileName('');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setVideo(selectedFile);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

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
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="🎬"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            onFileChange={handleFileChange}
            onError={setError}
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
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
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

          {/* Convert Button - Only show after file upload and before conversion */}
          {video && !gif && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to GIF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to GIF
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button - Only show after conversion */}
          {gif && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download GIF File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>

  );
}