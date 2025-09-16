"use client";

import { useMemo, useState, useEffect } from "react";
import FileUpload from '@/components/FileUpload';


export default function PdfToImagesClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([]);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['application/pdf'];
  const ALLOWED_EXTENSIONS = ['pdf'];

  const resetState = () => {
    setFile(null);
    setImages([]);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    setConvertProgress(0);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    // Simulate upload progress UI
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setImages([]);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFile(selectedFile);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

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
    
    setIsLoading(true);
    setConvertProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);
    setImages([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", "png");
      form.append("density", "144");
      
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
          const viewport = pageObj.getViewport({ scale: 144 / 72 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Render PDF page to canvas
          await pageObj.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise;
          
          // Convert canvas to image
          const imageDataUrl = canvas.toDataURL(`image/png`, 0.9);
          
          // Update filename to match target format
          const imageName = page.filename.replace('.pdf', `.png`);
          
          imgs.push({
            name: imageName,
            url: imageDataUrl,
          });
        } catch (pageError) {
          console.error(`Error converting page ${page.filename}:`, pageError);
        }
      }
      
      setImages(imgs);
      setConvertProgress(100);
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
          const scale = 144 / 72; // PDF points are 72 DPI
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          canvas.width = viewport.width as number;
          canvas.height = viewport.height as number;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const url = canvas.toDataURL("image/png");
          out.push({ name: `page-${i}.png`, url });
        }
        setImages(out);
        setConvertProgress(100);
      } catch (clientErr) {
        console.error(clientErr);
        alert("Conversion failed. Please try again.");
      }
    } finally {
      clearInterval(interval);
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="📄"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            onFileChange={handleFileChange}
            onError={setError}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Uploading {uploadingFileName}...</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

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

          {/* Convert Button - Only show after file upload and before conversion */}
          {file && images.length === 0 && (
            <button
              onClick={handleConvert}
              disabled={isLoading || !pdfjsLoaded}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to Images...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to Images
                  </>
                )}
              </span>
            </button>
          )}

          {/* Converting Progress */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                <span>Converting PDF...</span>
                <span>{Math.round(convertProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${convertProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Download All Button - Only show after conversion */}
          {images.length > 0 && (
            <button
              onClick={() => {
                images.forEach((img, index) => {
                  setTimeout(() => handleDownloadImage(img.url, img.name), index * 500);
                });
              }}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download All Images ({images.length})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


