import type { Metadata } from "next";
import JpgToPdfClient from "./JpgToPdfClient";

export const metadata: Metadata = {
  title: "JPG to PDF Converter",
  description: "Convert JPG images to PDF format online. Free and easy to use.",
  alternates: { canonical: "/convert/jpg-pdf" },
};

export default function JpgToPdfPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">JPG to PDF</h1>
        <p className="text-sm text-black/60">Convert JPG images to PDF format with high quality.</p>
      </header>

      <JpgToPdfClient />
    </div>
  );
}
