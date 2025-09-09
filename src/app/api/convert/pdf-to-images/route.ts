import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RasterFormat = "png" | "jpg" | "webp";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const target = String(form.get("target") || "png").toLowerCase() as RasterFormat;
    const density = Number(form.get("density") || "144");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }
    if (!["png", "jpg", "webp"].includes(target)) {
      return NextResponse.json({ error: "Unsupported target format" }, { status: 400 });
    }
    
    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(inputBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`PDF loaded: ${pageCount} pages`);
    
    if (pageCount === 0) {
      return NextResponse.json({ error: "PDF has no pages" }, { status: 400 });
    }

    const pages: Array<{ filename: string; base64: string; mime: string }> = [];

    // For each page, create a single-page PDF and return it as base64
    // The client will handle the PDF-to-image conversion using PDF.js
    for (let i = 0; i < pageCount; i++) {
      try {
        // Create a new PDF with just this page
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
        singlePagePdf.addPage(copiedPage);
        
        // Get the PDF bytes for this single page with specific format
        const singlePageBytes = await singlePagePdf.save({
          useObjectStreams: false, // More compatible format
          addDefaultPage: false
        });
        
        // Return the single-page PDF as base64
        // The client will convert this to an image using PDF.js
        pages.push({
          filename: `page-${i + 1}.pdf`,
          base64: Buffer.from(singlePageBytes).toString("base64"),
          mime: "application/pdf",
        });
        
        console.log(`Page ${i + 1} extracted successfully`);
      } catch (pageError) {
        console.error(`Error extracting page ${i + 1}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (pages.length === 0) {
      return NextResponse.json({ error: "Failed to extract any pages" }, { status: 400 });
    }

    return NextResponse.json({ pages }, { status: 200 });
  } catch (err) {
    console.error("PDF extraction error:", err);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}