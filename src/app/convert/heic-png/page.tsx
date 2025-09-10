import type { Metadata } from "next";
import HeicToPngClient from "./HeicToPngClient";

export const metadata: Metadata = {
  title: "HEIC to PNG Converter",
  description: "Convert HEIC images to PNG format online. Free and easy to use.",
  alternates: { canonical: "/convert/heic-png" },
};

export default function HeicToPngPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">HEIC to PNG</h1>
        <p className="text-sm text-black/60">Convert HEIC images to PNG format with high quality.</p>
      </header>

      <HeicToPngClient />
    </div>
  );
}
