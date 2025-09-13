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

    // Check file size (limit to 50MB for PDFs)
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Please select a PDF file smaller than 50MB.');
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

  function handleReset() {
    setFile(null);
    setImages([]);
  }

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Convert PDF to Images</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-gray-700">
                    {file ? file.name : "Click to select PDF file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: PDF format only
                  </div>
                </button>
              </div>
              
              {file && (
                <div className="mt-3 p-4 bg-gray-200/50 border border-gray-300/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["png", "jpg", "webp"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTarget(fmt as Raster)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      target === fmt 
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg" 
                        : "bg-gray-200/50 text-gray-700 hover:bg-gray-300/50 border border-gray-300/50"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Choose your preferred image format for conversion
              </p>
            </div>

            {/* Density Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Image Quality (DPI): {density}
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min={72}
                  max={300}
                  step={12}
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>72 DPI (Fast)</span>
                  <span>300 DPI (High Quality)</span>
                </div>
                <p className="text-sm text-gray-600">
                  Higher density produces sharper images but larger files.
                </p>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isDisabled || !pdfjsLoaded}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert PDF to Images"}
            </button>

            {/* PDF.js Status */}
            {!pdfjsLoaded && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-700">Loading PDF.js...</span>
                </div>
                <div className="mt-2 w-full bg-gray-300/50 rounded-full h-2">
                  <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            )}
            {pdfjsLoaded && (
              <div className="bg-green-100/50 border border-green-300/50 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-700 font-medium">PDF.js ready for conversion</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Results</h3>
          
          {images.length > 0 ? (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Conversion Complete</h4>
                <p className="text-sm text-gray-700">
                  Successfully converted {images.length} page{images.length > 1 ? 's' : ''} to {target.toUpperCase()} format
                </p>
              </div>

              {/* Images Grid */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Generated Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="bg-white/50 rounded-lg overflow-hidden border border-gray-300/50">
                      <img 
                        src={img.url} 
                        alt={img.name} 
                        className="h-32 w-full object-cover" 
                      />
                      <div className="p-3 space-y-2">
                        <p className="text-xs font-medium text-gray-900 truncate" title={img.name}>
                          {img.name}
                        </p>
                        <button
                          onClick={() => handleDownloadImage(img.url, img.name)}
                          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 px-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-xs font-medium"
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download All Button */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download All Images</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      images.forEach((img, index) => {
                        setTimeout(() => handleDownloadImage(img.url, img.name), index * 500);
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                  >
                    📥 Download All ({images.length})
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50"
                  >
                    🔄 Convert Another
                  </button>
                </div>
              </div>

              {/* Conversion Details */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Conversion Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Source Format:</span>
                    <div className="font-medium text-gray-900">PDF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Output Format:</span>
                    <div className="font-medium text-gray-900">{target.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Pages Converted:</span>
                    <div className="font-medium text-gray-900">{images.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality (DPI):</span>
                    <div className="font-medium text-gray-900">{density}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-6">
              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">PDF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">{target.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">File Size:</span>
                    <div className="font-medium text-gray-900">{file ? (file.size / (1024 * 1024)).toFixed(2) : '0'} MB</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality (DPI):</span>
                    <div className="font-medium text-gray-900">{density}</div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">📄</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your PDF is ready to be converted to {target.toUpperCase()} images.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">📄</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select a PDF file to start converting pages to {target.toUpperCase()} images.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


