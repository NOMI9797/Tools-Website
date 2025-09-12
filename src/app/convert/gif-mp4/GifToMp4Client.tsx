"use client";

import { useState, useEffect, useCallback } from "react";

export default function GifToMp4Client() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [gif, setGif] = useState<File | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
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
    if (!file.name.toLowerCase().endsWith('.gif')) {
      alert('Please upload a .gif file');
      return;
    }
    setGif(file);
    setMp4Url(null);
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
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [gif, ready, ffmpeg]);

  const handleDownload = () => {
    if (!mp4Url || !gif) return;
    const a = document.createElement('a');
    a.href = mp4Url;
    a.download = gif.name.replace(/\.[^/.]+$/, '.mp4');
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
          <p className="text-sm font-medium text-black/90">Upload GIF</p>
          <input type="file" accept="image/gif" onChange={handleFileChange} className="block w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/[.05] file:text-black hover:file:bg-black/[.08] transition-colors" />
          <p className="text-xs text-black/50">Only .gif files supported.</p>
        </div>

        {gif && (
          <div className="p-3 rounded-lg bg-black/[.02] border border-black/[.05]">
            <p className="text-sm font-medium">{gif.name}</p>
            <p className="text-xs text-black/50">{(gif.size / (1024*1024)).toFixed(1)} MB</p>
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

        {mp4Url && (
          <div>
            <p className="text-sm mb-2">Converted MP4</p>
            <video src={mp4Url} controls className="rounded-lg border w-full" />
            <button onClick={handleDownload} className="mt-2 px-4 py-2 bg-black text-white text-sm rounded-md">Download MP4</button>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <button onClick={handleConvert} disabled={!gif || isLoading} className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50">{isLoading ? 'Converting…' : 'Convert to MP4'}</button>
      </aside>
    </div>
  );
}


