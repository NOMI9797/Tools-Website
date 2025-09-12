import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress tools",
  description: "Free compression utilities for video, audio, images, and PDFs.",
  alternates: { canonical: "/compress" },
};

type Tool = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  href: string;
  implemented?: boolean;
};

type Category = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  tools: Tool[];
};

export default function CompressPage() {
  const categories: Category[] = [
    {
      id: "video-audio",
      title: "Video & Audio",
      desc: "Compress videos and audio files with adjustable quality",
      icon: "🎵",
      tools: [
        { id: "video-compressor", title: "Video Compressor", desc: "Reduce video bitrate, resolution, and size (client-side)", icon: "📹", href: "/compress/video-compressor", implemented: false },
        { id: "mp3-compressor", title: "MP3 Compressor", desc: "Lower MP3 bitrate to shrink file size (client-side)", icon: "🎧", href: "/compress/mp3-compressor", implemented: false },
        { id: "wav-compressor", title: "WAV Compressor", desc: "Downsample WAV or convert to MP3 for smaller size", icon: "🎼", href: "/compress/wav-compressor", implemented: false },
      ],
    },
    {
      id: "image",
      title: "Image",
      desc: "Compress images with adjustable quality and formats",
      icon: "🖼️",
      tools: [
        { id: "image-compressor", title: "Image Compressor", desc: "Compress JPG/PNG/WEBP in the browser", icon: "🎨", href: "/compress/image-compressor", implemented: true },
        { id: "jpeg-compressor", title: "JPEG Compressor", desc: "Adjust JPEG quality to reduce size", icon: "📸", href: "/compress/jpeg-compressor", implemented: false },
        { id: "png-compressor", title: "PNG Compressor", desc: "Lossy/lossless PNG compression (wasm)", icon: "🧩", href: "/compress/png-compressor", implemented: false },
      ],
    },
    {
      id: "pdf-docs",
      title: "PDF & Documents",
      desc: "Compress PDFs by optimizing embedded images",
      icon: "📄",
      tools: [
        { id: "pdf-compressor", title: "PDF Compressor", desc: "Basic PDF size reduction (images downscale)", icon: "📑", href: "/compress/pdf-compressor", implemented: false },
      ],
    },
    {
      id: "gif",
      title: "GIF",
      desc: "Compress GIFs by reducing colors, fps, and dimensions",
      icon: "🎞️",
      tools: [
        { id: "gif-compressor", title: "GIF Compressor", desc: "Re-encode GIF with fewer colors/fps/scale", icon: "🎥", href: "/compress/gif-compressor", implemented: false },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compress</h1>
        <p className="text-sm text-black/60">Free compression utilities covering video, audio, images, and PDFs.</p>
      </header>

      {categories.map((category) => (
        <section key={category.id} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
              <span>{category.icon}</span>
              {category.title}
            </h2>
            <p className="text-sm text-black/60">{category.desc}</p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {category.tools.map((tool) => (
              <a
                key={tool.id}
                id={tool.id}
                href={tool.implemented ? tool.href : "#coming-soon"}
                className={`group rounded-xl border border-black/[.06] p-5 sm:p-6 transition-all bg-white ${
                  tool.implemented ? "hover:shadow-sm hover:-translate-y-0.5" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{tool.icon}</div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium tracking-tight group-hover:opacity-90">
                      {tool.title}
                      {!tool.implemented && <span className="ml-2 text-xs text-black/40">(Coming Soon)</span>}
                    </h3>
                    <p className="text-sm text-black/60">{tool.desc}</p>
                  </div>
                </div>
                {tool.implemented && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/90">
                      Open
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

