import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: "GIF Compressor API. POST a GIF with fps, scale (10-100), colors (2-256).",
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const fps = parseInt((form.get("fps") as string) || "10", 10);
    const scale = parseInt((form.get("scale") as string) || "100", 10);
    const colors = parseInt((form.get("colors") as string) || "128", 10);
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const dir = join(tmpdir(), "gif-compressor");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const ts = Date.now();
    const inPath = join(dir, `in_${ts}.gif`);
    const palettePath = join(dir, `palette_${ts}.png`);
    const outPath = join(dir, `out_${ts}.gif`);

    writeFileSync(inPath, Buffer.from(await file.arrayBuffer()));

    const scaleExpr = scale !== 100 ? `scale=iw*${scale}/100:ih*${scale}/100:flags=lanczos` : "scale=iw:ih";
    const genCmd = `ffmpeg -y -i "${inPath}" -vf "${scaleExpr},fps=${fps},palettegen=max_colors=${colors}" "${palettePath}"`;
    const useCmd = `ffmpeg -y -i "${inPath}" -i "${palettePath}" -lavfi "${scaleExpr},fps=${fps}[x];[x][1:v]paletteuse=dither=sierra2_4a" -gifflags +transdiff "${outPath}"`;

    await execAsync(genCmd);
    await execAsync(useCmd);

    const buf = readFileSync(outPath);
    try { unlinkSync(inPath); unlinkSync(outPath); unlinkSync(palettePath); } catch {}
    return new NextResponse(buf, { headers: { "Content-Type": "image/gif", "Content-Disposition": `attachment; filename="compressed.gif"` } });
  } catch (e) {
    console.error("GIF compress error:", e);
    return NextResponse.json({ error: "Compression failed. Ensure ffmpeg is installed." }, { status: 500 });
  }
}


