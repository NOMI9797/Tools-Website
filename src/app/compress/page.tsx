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
        { id: "video-compressor", title: "Video Compressor", desc: "Reduce video bitrate, resolution, and size (client-side)", icon: "📹", href: "/compress/video-compressor", implemented: true },
        { id: "mp3-compressor", title: "MP3 Compressor", desc: "Lower MP3 bitrate to shrink file size (client-side)", icon: "🎧", href: "/compress/mp3-compressor", implemented: true },
        { id: "wav-compressor", title: "WAV Compressor", desc: "Downsample WAV or convert to MP3 for smaller size", icon: "🎼", href: "/compress/wav-compressor", implemented: true },
      ],
    },
    {
      id: "image",
      title: "Image",
      desc: "Compress images with adjustable quality and formats",
      icon: "🖼️",
      tools: [
        { id: "image-compressor", title: "Image Compressor", desc: "Compress JPG/PNG/WEBP in the browser", icon: "🎨", href: "/compress/image-compressor", implemented: true },
        { id: "jpeg-compressor", title: "JPEG Compressor", desc: "Adjust JPEG quality to reduce size", icon: "📸", href: "/compress/jpeg-compressor", implemented: true },
        { id: "png-compressor", title: "PNG Compressor", desc: "Lossy/lossless PNG compression (wasm)", icon: "🧩", href: "/compress/png-compressor", implemented: true },
      ],
    },
    {
      id: "pdf-docs",
      title: "PDF & Documents",
      desc: "Compress PDFs by optimizing embedded images",
      icon: "📄",
      tools: [
        { id: "pdf-compressor", title: "PDF Compressor", desc: "Basic PDF size reduction (images downscale)", icon: "📑", href: "/compress/pdf-compressor", implemented: true },
      ],
    },
    {
      id: "gif",
      title: "GIF",
      desc: "Compress GIFs by reducing colors, fps, and dimensions",
      icon: "🎞️",
      tools: [
        { id: "gif-compressor", title: "GIF Compressor", desc: "Re-encode GIF with fewer colors/fps/scale", icon: "🎥", href: "/compress/gif-compressor", implemented: true },
      ],
    },
  ];

  return (
    <div className="w-full pt-16 pb-6 px-4 sm:px-6 lg:px-8 space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Compress</h1>
        <p className="text-sm text-gray-700">Free compression utilities covering video, audio, images, and PDFs.</p>
      </header>

      {categories.map((category) => (
        <section key={category.id} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-medium tracking-tight flex items-center gap-2 text-gray-900">
              <span>{category.icon}</span>
              {category.title}
            </h2>
            <p className="text-sm text-gray-700">{category.desc}</p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {category.tools.map((tool) => (
              <a
                key={tool.id}
                id={tool.id}
                href={tool.implemented ? tool.href : "#coming-soon"}
                className={`group rounded-2xl border border-gray-300/50 bg-gray-200/50 backdrop-blur-md p-5 sm:p-6 transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 ${
                  tool.implemented ? "hover:-translate-y-0.5 hover:shadow-xl hover:border-gray-500/60" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center text-xl shadow-sm">
                    {tool.icon}
                  </div>
                  <h3 className="text-base font-medium tracking-tight group-hover:opacity-90 text-gray-900">
                    {tool.title}
                    {!tool.implemented && <span className="ml-2 text-xs text-gray-600">(Coming Soon)</span>}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

