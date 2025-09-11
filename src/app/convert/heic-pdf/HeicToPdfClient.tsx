"use client";

import { useState, useCallback } from "react";

export default function HeicToPdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedPdf, setConvertedPdf] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(
      file => !file.name.toLowerCase().endsWith('.heic')
    );
    
    if (invalidFiles.length > 0) {
      alert('Please select only HEIC images');
      return;
    }

    setFiles(selectedFiles);
    // Reset converted PDF
    setConvertedPdf(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await fetch('/api/convert/heic-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert images');
      }

      const data = await res.json();
      setConvertedPdf(`data:application/pdf;base64,${data.base64}`);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedPdf) return;

    const link = document.createElement('a');
    link.href = convertedPdf;
    link.download = files.length === 1 
      ? files[0].name.replace(/\.heic$/i, '.pdf')
      : 'converted.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedPdf, files]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload HEIC Images</label>
          <input
            type="file"
            accept=".heic"
            onChange={handleFileChange}
            multiple
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/[.05] hover:file:bg-black/[.075] file:text-black/70"
          />
          {files.length > 0 && (
            <div className="text-xs text-black/60">
              {files.length} file{files.length > 1 ? 's' : ''} selected:
              <ul className="mt-1 space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="truncate">• {file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {convertedPdf && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Converted PDF</p>
              <button
                onClick={handleDownload}
                className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-black/80 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="rounded-lg border border-black/[.08] overflow-hidden">
              <iframe 
                src={convertedPdf} 
                className="w-full h-[400px] border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleConvert}
            disabled={files.length === 0 || isLoading}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert to PDF"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">Back</a>
        </div>
      </aside>
    </div>
  );
}
