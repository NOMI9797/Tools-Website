import { NextResponse } from "next/server";
import heicConvert from "heic-convert";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.heic')) {
      return NextResponse.json({ error: "File must be a HEIC image" }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Debug: Log file info
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('Buffer length:', buffer.length);
    console.log('First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'));

    // Try to convert HEIC to PNG using heic-convert first
    try {
      const pngBuffer = await heicConvert({
        buffer: buffer,
        format: 'PNG', // Convert to PNG instead of JPEG
        quality: 1 // Maximum quality
      });

      // Return as base64
      return NextResponse.json({
        base64: Buffer.from(pngBuffer).toString("base64"),
      });
    } catch (heicError) {
      console.log('heic-convert failed, trying sharp as fallback:', heicError);
      
      // Fallback: Try using sharp if heic-convert fails
      try {
        const pngBuffer = await sharp(buffer)
          .png({ quality: 95 })
          .toBuffer();

        return NextResponse.json({
          base64: pngBuffer.toString("base64"),
        });
      } catch (sharpError) {
        console.log('Sharp also failed:', sharpError);
        throw heicError; // Throw the original error
      }
    }
  } catch (err) {
    console.error("Conversion error:", err);
    
    // Provide more specific error messages
    if (err instanceof Error) {
      if (err.message.includes('input buffer is not a HEIC image')) {
        return NextResponse.json({ 
          error: "The file doesn't appear to be a valid HEIC image. This could be because:\n• The file is not actually a HEIC file (despite having .heic extension)\n• The file is corrupted\n• The HEIC format is not supported\n\nPlease try with a fresh HEIC photo from an iPhone or compatible device." 
        }, { status: 400 });
      }
      if (err.message.includes('unsupported format')) {
        return NextResponse.json({ 
          error: "This HEIC format is not supported. Please try a different HEIC file or convert it using another tool first." 
        }, { status: 400 });
      }
      if (err.message.includes('Invalid file')) {
        return NextResponse.json({ 
          error: "The file appears to be corrupted or not a valid HEIC image. Please try with a different file." 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to convert image. Please ensure the file is a valid HEIC image. You can try:\n• Using a fresh HEIC photo from an iPhone\n• Converting the file using another tool first\n• Checking if the file is corrupted" 
    }, { status: 500 });
  }
}
