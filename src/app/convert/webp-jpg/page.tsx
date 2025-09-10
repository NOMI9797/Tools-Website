import type { Metadata } from "next";
import WebpToJpgClient from "./WebpToJpgClient";

export const metadata: Metadata = {
  title: "WEBP to JPG Converter",
  description: "Convert WEBP images to JPG format online. Free and easy to use.",
  alternates: { canonical: "/convert/webp-jpg" },
};

export default function WebpToJpgPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">WEBP to JPG</h1>
        <p className="text-sm text-black/60">Convert WEBP images to JPG format with high quality.</p>
      </header>

      <WebpToJpgClient />
    </div>
  );
}
