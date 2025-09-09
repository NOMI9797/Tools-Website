"use client";

import { useMemo, useState, useEffect } from "react";

type Raster = "png" | "jpg" | "webp";

export default function PdfToImagesClient() {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<Raster>("png");
  const [density, setDensity] = useState<number>(144);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([]);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const isDisabled = useMemo(() => isLoading || !file, [isLoading, file]);

  useEffect(() => {
    // Load PDF.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.js';
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js';
      setPdfjsLoaded(true);
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleConvert() {
    if (!file) return;
    
    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }
    
    setIsLoading(true);
    setImages([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);
      form.append("density", String(density));
      
      const res = await fetch("/api/convert/pdf-to-images", { method: "POST", body: form });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert PDF");
      }
      const imgs: Array<{ name: string; url: string }> = data.pages.map((p: any) => ({
        name: p.filename,
        url: `data:${p.mime};base64,${p.base64}`,
      }));
      setImages(imgs);
    } catch (e) {
      console.warn("Server conversion failed, trying client-side fallback with PDF.js");
      if (!pdfjsLoaded) {
        alert("PDF.js is still loading. Please wait a moment and try again.");
        return;
      }
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF.js not available");
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const out: Array<{ name: string; url: string }> = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = density / 72; // PDF points are 72 DPI
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          canvas.width = viewport.width as number;
          canvas.height = viewport.height as number;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const url = canvas.toDataURL(target === "jpg" ? "image/jpeg" : target === "webp" ? "image/webp" : "image/png");
          out.push({ name: `page-${i}.${target}`, url });
        }
        setImages(out);
      } catch (clientErr) {
        console.error(clientErr);
        alert("Conversion failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadImage(imageUrl: string, imageName: string) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-black/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/90 file:text-white hover:file:bg-black"
          />
          {file && <div className="text-xs text-black/60 truncate">{file.name}</div>}
        </div>

        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">{images.length} page(s) converted</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="rounded-lg border border-black/[.08] overflow-hidden">
                  <img src={img.url} alt={img.name} className="h-40 w-full object-cover" />
                  <div className="p-2 border-t border-black/[.06] space-y-2">
                    <p className="text-xs font-medium truncate" title={img.name}>
                      {img.name}
                    </p>
                    <button
                      onClick={() => handleDownloadImage(img.url, img.name)}
                      className="w-full text-xs px-2 py-1 rounded bg-black text-white hover:bg-black/80 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Output format</label>
          <div className="grid grid-cols-3 gap-2">
            {["png", "jpg", "webp"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTarget(fmt as Raster)}
                className={`h-9 rounded-md text-sm border ${
                  target === fmt ? "bg-black text-white border-black" : "border-black/[.08] hover:bg-black/[.03]"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Density (DPI): {density}</label>
          <input
            type="range"
            min={72}
            max={300}
            step={12}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-black/50">Higher density produces sharper images but larger files.</p>
        </div>

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
        {!pdfjsLoaded && (
          <p className="text-xs text-black/50">Loading PDF.js for client-side fallback...</p>
        )}
      </aside>
    </div>
  );
}


