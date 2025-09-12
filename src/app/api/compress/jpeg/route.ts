import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET() {
  return NextResponse.json({
    message: "JPEG Compressor API. POST a JPEG with quality and progressive options.",
    accepts: ["image/jpeg"],
    body: {
      file: "File (jpeg)",
      quality: "number 1-100 (default 80)",
      progressive: "boolean (default true)",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const qualityStr = (form.get("quality") as string) || "80";
    const progressiveStr = (form.get("progressive") as string) || "true";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      return NextResponse.json({ error: "Only JPEG is supported" }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const quality = Math.min(100, Math.max(1, parseInt(qualityStr, 10) || 80));
    const progressive = progressiveStr === "true";

    const out = await sharp(input).jpeg({ quality, mozjpeg: true, progressive }).toBuffer();

    return new NextResponse(out, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="compressed.jpg"`,
      },
    });
  } catch (e) {
    console.error("JPEG compress error:", e);
    return NextResponse.json({ error: "Compression failed" }, { status: 500 });
  }
}


