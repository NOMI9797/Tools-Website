import { NextResponse } from "next/server";
import heicConvert from "heic-convert";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Invalid file upload" }, { status: 400 });
      }

      if (!file.name.toLowerCase().endsWith('.heic')) {
        return NextResponse.json({ error: "All files must be HEIC images" }, { status: 400 });
      }

      // Check file size (limit to 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} too large (max 10MB)` }, { status: 400 });
      }
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Process each HEIC file
    for (const file of files) {
      try {
        // Convert HEIC to JPEG
        const buffer = Buffer.from(await file.arrayBuffer());
        const jpegBuffer = await heicConvert({
          buffer: buffer,
          format: 'JPEG',
          quality: 1 // Maximum quality
        });

        // Embed the JPEG into the PDF
        const image = await pdfDoc.embedJpg(jpegBuffer);
        
        // Add a new page with the image
        const page = pdfDoc.addPage();
        
        // Calculate dimensions to fit the image properly
        const { width, height } = image.scale(1);
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        
        // Calculate scaling to fit the image within the page
        const scale = Math.min(
          pageWidth / width,
          pageHeight / height
        );
        
        // Calculate position to center the image
        const x = (pageWidth - width * scale) / 2;
        const y = (pageHeight - height * scale) / 2;
        
        // Draw the image
        page.drawImage(image, {
          x,
          y,
          width: width * scale,
          height: height * scale,
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // Continue with other files
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Return as base64
    return NextResponse.json({
      base64: Buffer.from(pdfBytes).toString("base64"),
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Failed to convert images" }, { status: 500 });
  }
}
