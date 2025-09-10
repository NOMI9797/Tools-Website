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

    // Validate file type - strictly JFIF only
    if (!file.name.toLowerCase().endsWith('.jfif')) {
      return NextResponse.json({ error: "File must be a JFIF image (with .jfif extension)" }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert to PNG using sharp
    const pngBuffer = await sharp(buffer)
      .png()
      .toBuffer();

    // Return as base64
    return NextResponse.json({
      base64: pngBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Failed to convert image" }, { status: 500 });
  }
}
