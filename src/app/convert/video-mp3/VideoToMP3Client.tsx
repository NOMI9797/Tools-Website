"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import FileUpload from '@/components/FileUpload';

export default function VideoToMP3Client() {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [mp3, setMp3] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
    'video/mkv', 'video/3gp', 'video/ogv', 'video/m4v'
  ];
  const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv', 'm4v'];

  const resetState = () => {
    setVideo(null);
    setMp3(null);
    setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setVideo(selectedFile);
      setError(null);
      setMp3(null);
    } else {
      resetState();
    }
  };

  // Initialize ffmpeg ONLY in browser
  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return; // ⛔ prevent SSR
      
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const instance = new FFmpeg();

        instance.on("log", ({ message }) => console.log(message));
        instance.on("progress", ({ progress }) =>
          setProgress(Math.round(progress * 100))
        );

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        setFfmpeg(instance);
        setReady(true);
      } catch (err) {
        console.error("FFmpeg failed to load:", err);
      }
    };

    init();
  }, []);


  // Convert video → mp3
  const convertToMp3 = useCallback(async () => {
    if (!video || !ready || !ffmpeg) return;
    setIsLoading(true);
    setProgress(0);

    try {
      // Use simple, consistent file names
      const inputName = "input.mp4";
      const outputName = "output.mp3";

      // Write input file to FFmpeg filesystem
      await ffmpeg.writeFile(inputName, await fetchFile(video));

      // Execute FFmpeg command
      await ffmpeg.exec([
        "-i", inputName,
        "-vn",                    // No video
        "-c:a", "libmp3lame",     // Audio codec
        "-ar", "44100",           // Sample rate
        "-ac", "2",               // Stereo
        "-b:a", "192k",           // Bitrate
        "-y",                     // Overwrite output
        outputName
      ]);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setMp3(url);

      // Cleanup temporary files
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temporary files:", cleanupError);
      }
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert video. Please try again with a different file.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [video, ready, ffmpeg]);

  const handleDownload = () => {
    if (!mp3 || !video) return;
    const link = document.createElement("a");
    link.href = mp3;
    link.download = video.name.replace(/\.[^/.]+$/, ".mp3");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ready) {
    return (
      <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
        <p className="text-sm text-gray-700">Loading FFmpeg… please wait</p>
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Convert Button - Only show after file upload and before conversion */}
          {video && !mp3 && (
            <button
              onClick={convertToMp3}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to MP3...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to MP3
                  </>
                )}
              </span>
            </button>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="w-full bg-gray-300/50 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-gray-500 to-gray-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Download Button - Only show after conversion */}
          {mp3 && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download MP3 File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
