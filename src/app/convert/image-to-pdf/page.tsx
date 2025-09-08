"use client";

import { useEffect, useMemo, useState } from "react";

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = useMemo(() => isLoading || files.length === 0, [isLoading, files.length]);

  function addFiles(newFiles: FileList | File[]) {
    const incoming = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/convert/image-to-pdf", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Conversion failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Revoke created object URLs when files list changes
  useEffect(() => {
    return () => {
      // no persistent URLs to revoke here as we create per render in img src
    };
  }, [files]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Image to PDF</h1>
        <p className="text-sm text-black/60">Upload images and we’ll combine them into a single PDF.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border border-dashed p-8 bg-white transition-colors ${
            isDragging ? "border-black/40" : "border-black/10"
          }`}
        >
          <div className="text-center space-y-3">
            <div className="text-5xl">⬆️</div>
            <div className="text-sm text-black/70">
              Drag and drop images here, or
              <label className="ml-1 font-medium underline cursor-pointer">
                browse
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-black/50">Supported: JPG, PNG, WEBP, SVG</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/70">{files.length} file(s) selected</p>
              <button
                type="button"
                onClick={() => setFiles([])}
                className="h-9 px-4 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03]"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={index} className="group relative rounded-lg border border-black/[.08] bg-white overflow-hidden">
                    <img src={url} alt={file.name} className="h-32 w-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                    <div className="p-2 border-t border-black/[.06]">
                      <p className="truncate text-xs text-black/70" title={file.name}>{file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 rounded-md bg-white/90 text-xs px-2 py-1 border border-black/[.1] hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isDisabled}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting…" : "Convert to PDF"}
          </button>
          <a href="/convert" className="h-10 px-5 rounded-md border border-black/[.08] text-sm hover:bg-black/[.03] inline-flex items-center">
            Back to Convert
          </a>
        </div>
        <p className="text-xs text-black/50">Files are processed server-side and never stored.</p>
      </form>
    </div>
  );
}


