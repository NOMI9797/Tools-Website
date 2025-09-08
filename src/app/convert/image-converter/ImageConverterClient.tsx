"use client";

import { useMemo, useState } from "react";

type Target = "png" | "jpg" | "webp" | "svg";

export default function ImageConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<Target>("png");
  const [quality, setQuality] = useState<number>(80);
  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = useMemo(() => isLoading || !file, [isLoading, file]);

  async function handleConvert() {
    if (!file) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);
      form.append("quality", String(quality));

      const res = await fetch("/api/convert/image", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${target}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Conversion failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Upload image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-black/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/90 file:text-white hover:file:bg-black"
          />
          {file && (
            <div className="mt-2 text-xs text-black/60 truncate">{file.name}</div>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Output format</label>
          <div className="grid grid-cols-4 gap-2">
            {["png", "jpg", "webp", "svg"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTarget(fmt as Target)}
                className={`h-9 rounded-md text-sm border ${
                  target === fmt ? "bg-black text-white border-black" : "border-black/[.08] hover:bg-black/[.03]"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {target !== "svg" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Quality: {quality}</label>
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-black/50">Higher quality yields larger files.</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={isDisabled}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">Back</a>
        </div>
      </aside>
    </div>
  );
}


