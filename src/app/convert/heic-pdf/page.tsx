import type { Metadata } from "next";
import HeicToPdfClient from "./HeicToPdfClient";

export const metadata: Metadata = {
  title: "HEIC to PDF Converter",
  description: "Convert HEIC images to PDF format online. Free and easy to use.",
  alternates: { canonical: "/convert/heic-pdf" },
};

export default function HeicToPdfPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">HEIC to PDF</h1>
        <p className="text-sm text-black/60">Convert HEIC images to PDF format with high quality.</p>
      </header>

      <HeicToPdfClient />
    </div>
  );
}
