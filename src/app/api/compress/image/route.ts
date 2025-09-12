import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

type Output = "jpg" | "jpeg" | "png" | "webp";

export async function GET() {
  return NextResponse.json({
    message: "Image Compressor API. POST an image with options to compress.",
    accepts: ["image/jpeg", "image/png", "image/webp"],
    outputs: ["jpg", "jpeg", "png", "webp"],
    body: {
      file: "File (jpeg/png/webp)",
      quality: "number 1-100 (default 80)",
      maxWidth: "number px (optional)",
      maxHeight: "number px (optional)",
      output: "jpg|png|webp (default jpg)",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const qualityStr = (form.get("quality") as string) || "80";
    const maxWidthStr = (form.get("maxWidth") as string) || "0";
    const maxHeightStr = (form.get("maxHeight") as string) || "0";
    const output = ((form.get("output") as string) || "jpg").toLowerCase() as Output;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let image = sharp(inputBuffer, { failOn: "none" });
    const metadata = await image.metadata();

    const maxWidth = Math.max(0, parseInt(maxWidthStr, 10) || 0);
    const maxHeight = Math.max(0, parseInt(maxHeightStr, 10) || 0);
    const quality = Math.min(100, Math.max(1, parseInt(qualityStr, 10) || 80));

    // Resize if limits provided
    if (maxWidth > 0 || maxHeight > 0) {
      image = image.resize({
        width: maxWidth > 0 ? maxWidth : undefined,
        height: maxHeight > 0 ? maxHeight : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert and set quality by output
    switch (output) {
      case "png":
        image = image.png({ quality, compressionLevel: 9, palette: true });
        break;
      case "webp":
        image = image.webp({ quality });
        break;
      case "jpg":
      case "jpeg":
      default:
        image = image.jpeg({ quality, mozjpeg: true });
        break;
    }

    const out = await image.toBuffer();

    return new NextResponse(out, {
      headers: {
        "Content-Type": output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg",
        "Content-Disposition": `attachment; filename="compressed.${output}"`,
      },
    });
  } catch (err: any) {
    console.error("Image compress error:", err);
    return NextResponse.json({ error: "Compression failed" }, { status: 500 });
  }
}


