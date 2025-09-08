export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          Clean tools to convert and compress
        </h1>
        <p className="text-sm sm:text-base text-black/60 max-w-2xl mx-auto">
          A minimal, fast, and privacy-friendly toolbox. Convert formats and compress files
          with a distraction-free interface.
        </p>
      </section>

      <section id="convert" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Convert</h2>
          <a href="/convert" className="text-sm text-black/70 hover:opacity-80">
            View all
          </a>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { url: "/convert/image-to-pdf", title: "Image to PDF", desc: "Turn images into a single PDF.", icon: "🖼️" },
            { url: "/convert/image-converter", title: "JPG ⇄ PNG ⇄ WEBP ⇄ SVG", desc: "Convert images between formats.", icon: "🧩" },
            { url: "/convert#pdf-to-images", title: "PDF to Images", desc: "Split PDF into images.", icon: "🧩" },
          ].map((tool) => (
            <a
              key={tool.title}
              href={tool.url}
              className="group rounded-xl border border-black/[.06] p-5 sm:p-6 hover:shadow-sm transition-all bg-white hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{tool.icon}</div>
                <div className="space-y-1.5">
                  <h3 className="font-medium tracking-tight group-hover:opacity-90">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-black/60">
                    {tool.desc}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/90">
                  Try it
                  <span aria-hidden>→</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="compress" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Compress</h2>
          <a href="/compress" className="text-sm text-black/70 hover:opacity-80">
            View all
          </a>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { url: "/compress#image-compressor", title: "Compress Images", desc: "Reduce image size without quality loss.", icon: "🗜️" },
            { url: "/compress#pdf-compressor", title: "Compress PDF", desc: "Make PDFs smaller and lighter.", icon: "📚" },
            { url: "/compress#video-compressor", title: "Compress Video", desc: "Shrink videos for sharing.", icon: "🎬" },
          ].map((tool) => (
            <a
              key={tool.title}
              href={tool.url}
              className="group rounded-xl border border-black/[.06] p-5 sm:p-6 hover:shadow-sm transition-all bg-white hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{tool.icon}</div>
                <div className="space-y-1.5">
                  <h3 className="font-medium tracking-tight group-hover:opacity-90">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-black/60">
                    {tool.desc}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/90">
                  Try it
                  <span aria-hidden>→</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
