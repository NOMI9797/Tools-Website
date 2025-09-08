import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const input = Buffer.from(arrayBuffer);

      const image = sharp(input).rotate();
      const metadata = await image.metadata();

      // Normalize to PNG for embedding reliability across formats
      const pngBuffer = await image.png({ quality: 90 }).toBuffer();
      const embeddedImage = await pdfDoc.embedPng(pngBuffer);

      const { width, height } = embeddedImage.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=images.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to convert images to PDF" }, { status: 500 });
  }
}


