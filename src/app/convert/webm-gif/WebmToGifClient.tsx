"use client";

import { useState, useEffect, useCallback } from "react";

export default function WebmToGifClient() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [gif, setGif] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
      }
    };
    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.webm')) {
      alert('Please upload a .webm file');
      return;
    }
    setVideo(file);
    setGif(null);
  };

  const handleConvert = useCallback(async () => {
    if (!video) return;
    setIsLoading(true);
    setProgress(0);

    // Try server route first
    try {
      const form = new FormData();
      form.append('file', video);
      const res = await fetch('/api/convert/webm-gif', { method: 'POST', body: form });
      if (res.ok) {
        const blob = await res.blob();
        setGif(URL.createObjectURL(blob));
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
      const input = 'input.webm';
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
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [video, ready, ffmpeg]);

  const handleDownload = () => {
    if (!gif || !video) return;
    const a = document.createElement('a');
    a.href = gif;
    a.download = video.name.replace(/\.[^/.]+$/, '.gif');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!ready) {
    return (
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <p className="text-sm text-black/60">Loading converter…</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-black/90">Upload WEBM</p>
          <input type="file" accept="video/webm" onChange={handleFileChange} className="block w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/[.05] file:text-black hover:file:bg-black/[.08] transition-colors" />
          <p className="text-xs text-black/50">Only .webm files supported here. Max output 5s.</p>
        </div>

        {video && (
          <div className="p-3 rounded-lg bg-black/[.02] border border-black/[.05]">
            <p className="text-sm font-medium">{video.name}</p>
            <p className="text-xs text-black/50">{(video.size / (1024*1024)).toFixed(1)} MB</p>
          </div>
        )}

        {isLoading && (
          <div>
            <p className="text-sm">Converting… {progress}%</p>
            <div className="w-full bg-black/[.08] rounded-full h-2 mt-1">
              <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {gif && (
          <div>
            <p className="text-sm mb-2">Converted GIF</p>
            <img src={gif} alt="GIF" className="rounded-lg border" />
            <button onClick={handleDownload} className="mt-2 px-4 py-2 bg-black text-white text-sm rounded-md">Download GIF</button>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <button onClick={handleConvert} disabled={!video || isLoading} className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50">{isLoading ? 'Converting…' : 'Convert to GIF'}</button>
      </aside>
    </div>
  );
}


