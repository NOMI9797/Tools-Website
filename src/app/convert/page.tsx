import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert tools",
  description: "Convert between popular formats: images, video, audio, and documents.",
  alternates: { canonical: "/convert" },
};

export default function ConvertPage() {
  const tools = [
    { id: "image-to-pdf", title: "Image to PDF", desc: "Turn images into a single PDF.", icon: "🖼️", href: "/convert/image-to-pdf" },
    { id: "image-converter", title: "JPG ⇄ PNG ⇄ WEBP ⇄ SVG", desc: "Convert images between formats.", icon: "🧩", href: "/convert/image-converter" },
    { id: "pdf-to-images", title: "PDF to Images", desc: "Split PDF into images.", icon: "📑", href: "/convert/pdf-to-images" },
    { id: "docx-pdf", title: "DOCX ⇄ PDF", desc: "Convert Word docs to and from PDF.", icon: "📄", href: "/convert#docx-pdf" },
    { id: "pdf-excel", title: "PDF ⇄ Excel", desc: "Turn tables between PDF and Excel.", icon: "📊", href: "/convert#pdf-excel" },
    { id: "video-audio", title: "MP4 ⇄ MP3 ⇄ MOV ⇄ OGG", desc: "Convert video and audio formats.", icon: "🎧", href: "/convert#video-audio" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Convert</h1>
        <p className="text-sm text-black/60">Free file conversion utilities covering images, documents, video, and audio.</p>
      </header>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <a key={tool.id} id={tool.id} href={tool.href} className="group rounded-xl border border-black/[.06] p-5 sm:p-6 hover:shadow-sm transition-all bg-white hover:-translate-y-0.5">
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


