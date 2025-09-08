import { NextResponse } from "next/server";
import sharp, { FormatEnum } from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFormats = ["jpg", "jpeg", "png", "webp", "svg"] as const;
type AllowedFormat = typeof allowedFormats[number];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const target = String(formData.get("target") || "png").toLowerCase() as AllowedFormat;
    const quality = Number(formData.get("quality") || 80);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!allowedFormats.includes(target)) {
      return NextResponse.json({ error: "Unsupported target format" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Special handling: if target is svg and input is raster, sharp will embed raster into svg
    // This is acceptable for now per scope, true vectorization can be added later via potrace.
    let pipeline = sharp(inputBuffer, { limitInputPixels: false });

    let outputBuffer: Buffer;
    if (target === "png") {
      outputBuffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
    } else if (target === "jpg" || target === "jpeg") {
      outputBuffer = await pipeline.jpeg({ quality }).toBuffer();
    } else if (target === "webp") {
      outputBuffer = await pipeline.webp({ quality }).toBuffer();
    } else if (target === "svg") {
      // If input is already SVG pass-through; otherwise wrap raster as data URI inside SVG
      const meta = await sharp(inputBuffer, { limitInputPixels: false }).metadata();
      if (meta.format === "svg") {
        outputBuffer = inputBuffer;
      } else {
        // Normalize to PNG for wide browser support and predictable dimensions
        const rasterPng = await sharp(inputBuffer, { limitInputPixels: false })
          .png({ quality })
          .toBuffer();
        const rasterMeta = await sharp(rasterPng).metadata();
        const width = rasterMeta.width || 0;
        const height = rasterMeta.height || 0;
        const base64 = rasterPng.toString("base64");
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="data:image/png;base64,${base64}" width="${width}" height="${height}"/>\n</svg>`;
        outputBuffer = Buffer.from(svg);
      }
    } else {
      return NextResponse.json({ error: "Unsupported target format" }, { status: 400 });
    }

    const ext = target === "jpeg" ? "jpg" : target;
    const contentType =
      ext === "png" ? "image/png" :
      ext === "jpg" ? "image/jpeg" :
      ext === "webp" ? "image/webp" :
      ext === "svg" ? "image/svg+xml" : "application/octet-stream";

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=converted.${ext}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}


