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
    // Load PDF.js from CDN
    const loadPdfJs = () => {
      return new Promise<void>((resolve, reject) => {
        // First load the main PDF.js library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          // Then load the worker
          const workerScript = document.createElement('script');
          workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          workerScript.onload = () => {
            // Set up worker and mark as loaded
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = workerScript.src;
            setPdfjsLoaded(true);
            console.log('PDF.js and worker loaded successfully');
            resolve();
          };
          workerScript.onerror = () => {
            console.error('Failed to load PDF.js worker');
            reject(new Error('Failed to load PDF.js worker'));
          };
          document.head.appendChild(workerScript);
        };
        script.onerror = () => {
          console.error('Failed to load PDF.js');
          reject(new Error('Failed to load PDF.js'));
        };
        document.head.appendChild(script);
      });
    };

    loadPdfJs().catch(error => {
      console.error('Error loading PDF.js:', error);
    });

    return () => {
      // Clean up scripts on unmount
      const scripts = document.querySelectorAll('script[src*="pdf.js"]');
      scripts.forEach(script => script.remove());
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
      // Convert single-page PDFs to images using PDF.js
      const imgs: Array<{ name: string; url: string }> = [];
      
      // Get PDF.js from window (dynamically loaded)
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error("PDF.js not loaded yet. Please wait a moment and try again.");
      }
      
      for (const page of data.pages) {
        try {
          // Convert base64 to Uint8Array
          const binaryString = window.atob(page.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          
          // Load the single-page PDF
          const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
          const pageObj = await pdf.getPage(1);
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error("Canvas context not available");
          
          // Calculate dimensions based on density
          const viewport = pageObj.getViewport({ scale: density / 72 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render PDF page to canvas
          await pageObj.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise;
          
          // Convert canvas to image
          const imageDataUrl = canvas.toDataURL(`image/${target}`, 0.9);
          
          // Update filename to match target format
          const imageName = page.filename.replace('.pdf', `.${target}`);
          
          imgs.push({
            name: imageName,
            url: imageDataUrl,
          });
        } catch (pageError) {
          console.error(`Error converting page ${page.filename}:`, pageError);
        }
      }
      
      setImages(imgs);
    } catch (e) {
      console.warn("Server conversion failed, trying client-side fallback with PDF.js");
      if (!pdfjsLoaded) {
        alert("PDF.js is still loading. Please wait a moment and try again.");
        return;
      }
      try {
        // Get PDF.js from window (dynamically loaded)
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
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
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
            disabled={isDisabled || !pdfjsLoaded}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">Back</a>
        </div>
        {!pdfjsLoaded && (
          <div className="space-y-2">
            <p className="text-xs text-black/50">Loading PDF.js...</p>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-black h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        )}
        {pdfjsLoaded && (
          <p className="text-xs text-green-600">✓ PDF.js ready</p>
        )}
      </aside>
    </div>
  );
}


