import type { Metadata } from "next";
import ImageConverterClient from "./ImageConverterClient";

export const metadata: Metadata = {
  title: "Image Converter (JPG/PNG/WEBP/SVG)",
  description: "Convert images between JPG, PNG, WEBP, and SVG with adjustable quality.",
  alternates: { canonical: "/convert/image-converter" },
};

export default function ImageConverterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Image Converter</h1>
        <p className="text-sm text-black/60">Convert JPG, PNG, WEBP, and SVG. Adjust quality for raster outputs.</p>
      </header>
      <ImageConverterClient />
    </div>
  );
}


