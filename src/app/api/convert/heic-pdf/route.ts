import { NextResponse } from "next/server";
import heicConvert from "heic-convert";
import sharp from "sharp";
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
    let processedCount = 0;

    // Process each HEIC file
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Debug: Log file info
        console.log('File name:', file.name);
        console.log('File size:', file.size);
        console.log('Buffer length:', buffer.length);
        console.log('First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'));

        let jpegBuffer: Buffer;

        // Try to convert HEIC to JPEG using heic-convert first
        try {
          jpegBuffer = await heicConvert({
            buffer: buffer,
            format: 'JPEG',
            quality: 1 // Maximum quality
          });
        } catch (heicError) {
          console.log('heic-convert failed, trying sharp as fallback:', heicError);
          
          // Fallback: Try using sharp if heic-convert fails
          try {
            jpegBuffer = await sharp(buffer)
              .jpeg({ quality: 95 })
              .toBuffer();
          } catch (sharpError) {
            console.log('Sharp also failed:', sharpError);
            throw heicError; // Throw the original error
          }
        }

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
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // Continue with other files
      }
    }

    // Check if any images were successfully processed
    if (processedCount === 0) {
      return NextResponse.json({ 
        error: "Failed to process any images. Please ensure all files are valid HEIC images or try with different files." 
      }, { status: 400 });
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
