"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function GifCompressorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(10);
  const [scale, setScale] = useState<number>(100);
  const [colors, setColors] = useState<number>(128);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        const instance = new FFmpeg();
        instance.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        setFFmpeg(instance);
        setReady(true);
      } catch (e) {
        console.error("FFmpeg load failed", e);
      }
    };
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "image/gif") { alert("Please select a GIF file"); return; }
    setGifFile(f);
    setOutUrl(null);
  };

  const compressServer = useCallback(async () => {
    if (!gifFile) return null;
    const form = new FormData();
    form.append("file", gifFile);
    form.append("fps", String(fps));
    form.append("scale", String(scale));
    form.append("colors", String(colors));
    const resp = await fetch("/api/compress/gif", { method: "POST", body: form });
    if (!resp.ok) return null;
    return await resp.blob();
  }, [gifFile, fps, scale, colors]);

  const compressClient = useCallback(async () => {
    if (!gifFile || !ffmpeg) return null;
    const { fetchFile } = await import("@ffmpeg/util");
    const inName = "input.gif";
    const outName = "output.gif";
    await ffmpeg.writeFile(inName, await fetchFile(gifFile));
    const scaleExpr = scale !== 100 ? `scale=iw*${scale}/100:ih*${scale}/100:flags=lanczos` : "scale=iw:ih";
    const palette = "palette.png";
    await ffmpeg.exec(["-i", inName, "-vf", `${scaleExpr},fps=${fps},palettegen=max_colors=${colors}`, palette]);
    await ffmpeg.exec(["-i", inName, "-i", palette, "-lavfi", `${scaleExpr},fps=${fps}[x];[x][1:v]paletteuse=dither=sierra2_4a`, "-gifflags", "+transdiff", outName]);
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(inName);
    await ffmpeg.deleteFile(outName);
    await ffmpeg.deleteFile(palette);
    return new Blob([data as Uint8Array], { type: "image/gif" });
  }, [gifFile, ffmpeg, fps, scale, colors]);

  const compress = useCallback(async () => {
    if (!gifFile) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      let blob = await compressServer();
      if (!blob) {
        blob = await compressClient();
      }
      if (!blob) throw new Error("Compression failed");
      setOutUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e); alert("Failed to compress");
    } finally {
      setIsProcessing(false); setProgress(0);
    }
  }, [gifFile, compressServer, compressClient]);

  const download = () => {
    if (!outUrl || !gifFile) return;
    const a = document.createElement("a");
    a.href = outUrl;
    a.download = gifFile.name.replace(/\.[^/.]+$/, "") + "-compressed.gif";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload and Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select GIF</label>
              <input ref={inputRef} type="file" accept="image/gif" onChange={onChange} className="hidden" />
              <button type="button" onClick={() => inputRef.current?.click()} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <div className="text-4xl mb-2">🎞️</div>
                <div className="text-gray-600">{gifFile ? gifFile.name : "Click to select .gif"}</div>
                <div className="text-sm text-gray-500 mt-1">Only GIF files are supported</div>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">FPS</label>
                <input type="number" min={2} max={30} value={fps} onChange={(e) => setFps(parseInt(e.target.value || "10"))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scale %</label>
                <input type="number" min={10} max={100} value={scale} onChange={(e) => setScale(parseInt(e.target.value || "100"))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                <input type="number" min={2} max={256} value={colors} onChange={(e) => setColors(parseInt(e.target.value || "128"))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
            </div>
            <div>
              <button onClick={compress} disabled={!gifFile || isProcessing} className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50">
                {isProcessing ? `Compressing… ${progress}%` : 'Compress'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Result</h3>
          <div className="space-y-4">
            {outUrl && (
              <div className="rounded-lg overflow-hidden border border-green-200">
                <img src={outUrl} alt="Compressed" className="w-full h-auto" />
                <div className="p-2">
                  <button onClick={download} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm">Download GIF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


