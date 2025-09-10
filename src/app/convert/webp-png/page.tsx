import type { Metadata } from "next";
import WebpToPngClient from "./WebpToPngClient";

export const metadata: Metadata = {
  title: "WEBP to PNG Converter",
  description: "Convert WEBP images to PNG format online. Free, fast, and secure.",
  alternates: { canonical: "/convert/webp-png" },
};

export default function WebpToPngPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">WEBP to PNG</h1>
        <p className="text-sm text-black/60">Convert WEBP images to PNG format. Maintains quality and transparency.</p>
      </header>

      <WebpToPngClient />
    </div>
  );
}
