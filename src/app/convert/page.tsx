import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert tools",
  description: "Free file conversion utilities for images, video, audio, documents, PDFs, and more.",
  alternates: { canonical: "/convert" },
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

export default function ConvertPage() {
  const categories: Category[] = [
    {
      id: "video-audio",
      title: "Video & Audio",
      desc: "Convert between popular audio and video formats",
      icon: "🎵",
      tools: [
        { id: "audio-converter", title: "Audio Converter", desc: "Convert between MP3, WAV, OGG formats", icon: "🎧", href: "/convert/audio-converter", implemented: true },
        { id: "mp3-converter", title: "MP3 Converter", desc: "Convert to and from MP3 format", icon: "🎼", href: "/convert/mp3-converter", implemented: true },
        { id: "mp4-mp3", title: "MP4 to MP3", desc: "Extract audio from video files", icon: "🎞️", href: "/convert/mp4-mp3", implemented: true },
        { id: "video-mp3", title: "Video to MP3", desc: "Convert any video to MP3 audio", icon: "🎥", href: "/convert/video-mp3", implemented: true },
        { id: "mp4-converter", title: "MP4 Converter", desc: "Convert between MP4, WEBM formats", icon: "📹", href: "/convert/mp4-converter", implemented: true },
        { id: "mov-mp4", title: "MOV to MP4", desc: "Convert MOV videos to MP4 format", icon: "🎬", href: "/convert/mov-mp4", implemented: true },
        { id: "mp3-ogg", title: "MP3 to OGG", desc: "Convert MP3 files to OGG format", icon: "🔊", href: "/convert/mp3-ogg", implemented: true },
      ],
    },
    {
      id: "image",
      title: "Image",
      desc: "Convert between various image formats",
      icon: "🖼️",
      tools: [
        { id: "image-converter", title: "Image Converter", desc: "Convert between JPG, PNG, WEBP formats", icon: "🎨", href: "/convert/image-converter", implemented: true },
        { id: "webp-png", title: "WEBP to PNG", desc: "Convert WEBP images to PNG format", icon: "📸", href: "/convert/webp-png", implemented: true },
        { id: "jfif-png", title: "JFIF to PNG", desc: "Convert JFIF images to PNG format", icon: "🖼️", href: "/convert/jfif-png", implemented: true },
        { id: "heic-jpg", title: "HEIC to JPG", desc: "Convert HEIC images to JPG format", icon: "📱", href: "/convert/heic-jpg", implemented: true },
        { id: "heic-png", title: "HEIC to PNG", desc: "Convert HEIC images to PNG format", icon: "📲", href: "/convert/heic-png", implemented: true },
        { id: "webp-jpg", title: "WEBP to JPG", desc: "Convert WEBP images to JPG format", icon: "🌄", href: "/convert/webp-jpg", implemented: true },
        { id: "svg-converter", title: "SVG Converter", desc: "Convert SVG to and from other formats", icon: "✨", href: "/convert/svg-converter", implemented: true },
      ],
    },
    {
      id: "pdf-docs",
      title: "PDF & Documents",
      desc: "Convert PDFs and other document formats",
      icon: "📄",
      tools: [
        { id: "pdf-to-images", title: "PDF to Images", desc: "Convert PDF pages to images", icon: "📑", href: "/convert/pdf-to-images", implemented: true },
        { id: "image-to-pdf", title: "Image to PDF", desc: "Convert images to PDF format", icon: "🖼️", href: "/convert/image-to-pdf", implemented: true },
        { id: "heic-pdf", title: "HEIC to PDF", desc: "Convert HEIC images to PDF format", icon: "📱", href: "/convert/heic-pdf", implemented: true },
        { id: "jpg-pdf", title: "JPG to PDF", desc: "Convert JPG images to PDF format", icon: "🖼️", href: "/convert/jpg-pdf", implemented: true },
      ],
    },
    {
      id: "gif",
      title: "GIF",
      desc: "Convert to and from GIF format",
      icon: "🎞️",
      tools: [
        { id: "video-gif", title: "Video to GIF", desc: "Convert videos to animated GIFs", icon: "🎥", href: "/convert/video-gif", implemented: true },
        { id: "mp4-gif", title: "MP4 to GIF", desc: "Convert MP4 videos to GIF format", icon: "🎬", href: "/convert/mp4-gif", implemented: true },
        { id: "webm-gif", title: "WEBM to GIF", desc: "Convert WEBM videos to GIF format", icon: "🎦", href: "/convert/webm-gif", implemented: true },
        { id: "gif-mp4", title: "GIF to MP4", desc: "Convert GIFs to MP4 video format", icon: "📹", href: "/convert/gif-mp4", implemented: true },
        { id: "image-gif", title: "Image to GIF", desc: "Create GIFs from image sequences", icon: "🖼️", href: "/convert/image-gif", implemented: true },
      ],
    },
    {
      id: "units",
      title: "Unit Conversions",
      desc: "Convert between different units",
      icon: "📏",
      tools: [
        { id: "unit-converter", title: "Unit Converter", desc: "Convert between various units", icon: "📐", href: "/convert/unit-converter", implemented: true },
        { id: "time-converter", title: "Time Converter", desc: "Convert between time formats", icon: "⏰", href: "/convert/time-converter", implemented: true },
        { id: "age-calculator", title: "Age Calculator", desc: "Calculate your age in different units", icon: "🎂", href: "/convert/age-calculator", implemented: true },
      ],
    },
  ];

  return (
    <div className="w-full pt-16 pb-6 px-4 sm:px-6 lg:px-8 space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Convert</h1>
        <p className="text-sm text-gray-700">Free file conversion utilities covering images, documents, video, and audio.</p>
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