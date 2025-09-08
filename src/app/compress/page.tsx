import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress tools",
  description: "Compress images, PDFs, video, and audio to smaller sizes.",
  alternates: { canonical: "/compress" },
};

export default function CompressPage() {
  const tools = [
    { id: "image-compressor", title: "Image Compressor (JPG/PNG/WebP)", desc: "Reduce image size without losing clarity.", icon: "🗜️" },
    { id: "pdf-compressor", title: "PDF Compressor", desc: "Make PDFs smaller and lighter.", icon: "📚" },
    { id: "video-compressor", title: "Video Compressor (MP4/MOV)", desc: "Shrink videos for easier sharing.", icon: "🎬" },
    { id: "audio-compressor", title: "Audio Compressor (MP3/OGG)", desc: "Reduce audio file sizes.", icon: "🎵" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compress</h1>
        <p className="text-sm text-black/60">Free compression utilities to reduce file sizes, fast and private.</p>
      </header>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <a key={tool.id} id={tool.id} href={`#${tool.id}`} className="group rounded-xl border border-black/[.06] p-5 sm:p-6 hover:shadow-sm transition-all bg-white hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="text-2xl">{tool.icon}</div>
              <div className="space-y-1.5">
                <h2 className="font-medium tracking-tight group-hover:opacity-90">{tool.title}</h2>
                <p className="text-sm text-black/60">{tool.desc}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/90">
                Open
                <span aria-hidden>→</span>
              </span>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}


