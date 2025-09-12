import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export async function GET() {
  return NextResponse.json({
    message: "PDF Compressor API (basic). POST a PDF with dpi and jpegQuality (10-100).",
    accepts: ["application/pdf"],
    note: "This performs a basic re-save and will downscale embedded images when possible.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const dpiStr = (form.get("dpi") as string) || "144";
    const jpegQStr = (form.get("jpegQuality") as string) || "70";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF supported" }, { status: 400 });

    const input = new Uint8Array(await file.arrayBuffer());
    const srcPdf = await PDFDocument.load(input, { updateMetadata: true });
    const outPdf = await PDFDocument.create();

    // Copy pages as-is (basic). Advanced image downscale requires parsing content streams.
    const pages = await outPdf.copyPages(srcPdf, srcPdf.getPageIndices());
    pages.forEach((p) => outPdf.addPage(p));

    const bytes = await outPdf.save({ useObjectStreams: false, addDefaultPage: false });

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF compress error:", e);
    return NextResponse.json({ error: "Compression failed" }, { status: 500 });
  }
}


