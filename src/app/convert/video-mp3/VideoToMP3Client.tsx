"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { FFmpeg } from "@ffmpeg/ffmpeg";

export default function VideoToMP3Client() {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [mp3, setMp3] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file.");
      return;
    }
    setVideo(file);
    setMp3(null);
  };

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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Extract Audio from Video</h3>
          
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
                    Supports: MP4, MOV, AVI, MKV, WEBM, FLV, WMV, M4V, 3GP, OGV
                  </div>
                </button>
              </div>
              
              {video && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎬</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{video.name}</div>
                      <div className="text-sm text-gray-700">{(video.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <button
              onClick={convertToMp3}
              disabled={!video || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Extract Audio to MP3"}
            </button>

            {/* Progress Bar */}
            {isLoading && (
              <div className="w-full bg-gray-300/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-gray-500 to-gray-700 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Extraction Result</h3>
          
          {mp3 ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-green-700 font-medium">Audio Extraction Successful!</span>
                </div>
              </div>

              {/* Audio Player */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Preview Audio</h4>
                <audio controls src={mp3} className="w-full" />
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                <span>📥</span>
                <span>Download MP3</span>
              </button>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Extract Audio</h4>
              <p className="text-gray-700">
                Select a video file to extract audio and convert to MP3 format.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
