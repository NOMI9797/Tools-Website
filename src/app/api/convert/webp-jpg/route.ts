import { NextResponse } from "next/server";
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
    if (!file.type.startsWith('image/webp')) {
      return NextResponse.json({ error: "File must be a WEBP image" }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert to JPG using sharp
    const jpgBuffer = await sharp(buffer)
      .jpeg({
        quality: 90, // High quality
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toBuffer();

    // Return as base64
    return NextResponse.json({
      base64: jpgBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Failed to convert image" }, { status: 500 });
  }
}
