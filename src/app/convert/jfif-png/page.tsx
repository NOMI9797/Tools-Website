import type { Metadata } from "next";
import JfifToPngClient from "./JfifToPngClient";

export const metadata: Metadata = {
  title: "JFIF to PNG Converter",
  description: "Convert JFIF images to PNG format online. Free and easy to use.",
  alternates: { canonical: "/convert/jfif-png" },
};

export default function JfifToPngPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">JFIF to PNG</h1>
        <p className="text-sm text-black/60">Convert JFIF images to PNG format with high quality.</p>
      </header>

      <JfifToPngClient />
    </div>
  );
}
