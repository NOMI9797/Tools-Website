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
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <p className="text-sm text-black/60">Loading FFmpeg… please wait</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm mt-2"
          />
          <p className="text-xs text-black/50">
            Supports MP4, MOV, AVI. Converts to MP3 audio.
          </p>
        </div>

        {video && (
          <div className="p-3 rounded-lg bg-black/[.02] border border-black/[.05]">
            <p className="text-sm font-medium">{video.name}</p>
            <p className="text-xs text-black/50">
              {(video.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        )}

        {isLoading && (
          <div>
            <p className="text-sm">Converting… {progress}%</p>
            <div className="w-full bg-black/[.08] rounded-full h-2 mt-1">
              <div
                className="bg-black h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {mp3 && (
          <div>
            <p className="text-sm mb-2">Converted MP3</p>
            <audio controls src={mp3} className="w-full mb-2" />
            <button
              onClick={handleDownload}
              className="mt-2 px-4 py-2 bg-black text-white text-sm rounded-md"
            >
              Download MP3
            </button>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <button
          onClick={convertToMp3}
          disabled={!video || isLoading}
          className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? "Converting…" : "Convert to MP3"}
        </button>
      </aside>
    </div>
  );
}
