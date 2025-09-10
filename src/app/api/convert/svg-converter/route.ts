import { NextResponse } from "next/server";
import sharp from "sharp";
import { optimize } from "svgo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Format = "png" | "jpg" | "svg";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const format = String(form.get("format") || "png").toLowerCase() as Format;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/svg+xml') && !file.name.toLowerCase().endsWith('.svg')) {
      return NextResponse.json({ error: "File must be an SVG image" }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let outputBuffer: Buffer;

    if (format === 'svg') {
      // Optimize SVG using SVGO
      const svgString = buffer.toString('utf8');
      const result = optimize(svgString, {
        multipass: true,
        plugins: [
          'preset-default',
          'removeDimensions',
          'removeViewBox',
          'removeXMLNS',
          'sortAttrs',
        ],
      });
      outputBuffer = Buffer.from(result.data);
    } else {
      // Convert SVG to PNG/JPG using Sharp
      const pipeline = sharp(buffer);
      
      if (format === 'jpg') {
        outputBuffer = await pipeline
          .jpeg({
            quality: 90,
            mozjpeg: true
          })
          .toBuffer();
      } else {
        outputBuffer = await pipeline
          .png({
            quality: 90
          })
          .toBuffer();
      }
    }

    // Return as base64
    return NextResponse.json({
      base64: outputBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Failed to convert image" }, { status: 500 });
  }
}
