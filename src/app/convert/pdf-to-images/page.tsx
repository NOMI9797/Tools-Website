import type { Metadata } from "next";
import PdfToImagesClient from "./PdfToImagesClient";

export const metadata: Metadata = {
  title: "PDF to Images",
  description: "Convert each PDF page to PNG/JPG/WEBP with adjustable density.",
  alternates: { canonical: "/convert/pdf-to-images" },
};

export default function PdfToImagesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">PDF to Images</h1>
        <p className="text-sm text-black/60">Convert each PDF page to images. Choose format and density (DPI).</p>
      </header>
      <PdfToImagesClient />
    </div>
  );
}


