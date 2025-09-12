import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET() {
  return NextResponse.json({
    message: "PNG Compressor API. POST a PNG with level (0-9) and palette flag.",
    accepts: ["image/png"],
    body: { file: "File (png)", level: "0-9 (default 7)", palette: "boolean (default true)" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const levelStr = (form.get("level") as string) || "7";
    const paletteStr = (form.get("palette") as string) || "true";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.includes("png")) return NextResponse.json({ error: "Only PNG supported" }, { status: 400 });

    const input = Buffer.from(await file.arrayBuffer());
    const compressionLevel = Math.max(0, Math.min(9, parseInt(levelStr, 10) || 7));
    const palette = paletteStr === "true";

    let image = sharp(input, { failOn: "none" });
    image = image.png({ compressionLevel, palette });
    const out = await image.toBuffer();

    return new NextResponse(out, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="compressed.png"`,
      },
    });
  } catch (e) {
    console.error("PNG compress error:", e);
    return NextResponse.json({ error: "Compression failed" }, { status: 500 });
  }
}


