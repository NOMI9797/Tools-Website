import { NextResponse } from "next/server";
import heicConvert from "heic-convert";

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

    // Convert HEIC to PNG using heic-convert
    const pngBuffer = await heicConvert({
      buffer: buffer,
      format: 'PNG', // Convert to PNG instead of JPEG
      quality: 1 // Maximum quality
    });

    // Return as base64
    return NextResponse.json({
      base64: Buffer.from(pngBuffer).toString("base64"),
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Failed to convert image" }, { status: 500 });
  }
}
