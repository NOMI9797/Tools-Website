"use client";

import { useState, useCallback } from "react";

export default function WebpToJpgClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/webp')) {
      alert('Please select a WEBP image');
      return;
    }

    setFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    // Reset converted image
    setConvertedImage(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/webp-jpg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      setConvertedImage(`data:image/jpeg;base64,${data.base64}`);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedImage) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = file?.name.replace(/\.webp$/i, '.jpg') || 'converted.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImage, file]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload WEBP</label>
          <input
            type="file"
            accept="image/webp"
            onChange={handleFileChange}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/[.05] hover:file:bg-black/[.075] file:text-black/70"
          />
          {file && <div className="text-xs text-black/60 truncate">{file.name}</div>}
        </div>

        {preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Original WEBP</p>
            </div>
            <div className="rounded-lg border border-black/[.08] overflow-hidden">
              <img src={preview} alt="Preview" className="max-h-[300px] w-full object-contain bg-[url('/grid.svg')]" />
            </div>
          </div>
        )}

        {convertedImage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">Converted JPG</p>
              <button
                onClick={handleDownload}
                className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-black/80 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="rounded-lg border border-black/[.08] overflow-hidden">
              <img src={convertedImage} alt="Converted" className="max-h-[300px] w-full object-contain bg-[url('/grid.svg')]" />
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleConvert}
            disabled={!file || isLoading}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert to JPG"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">Back</a>
        </div>
      </aside>
    </div>
  );
}
