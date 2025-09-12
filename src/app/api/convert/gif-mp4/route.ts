import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const name = (file as any).name || 'input.gif';
    if (!name.toLowerCase().endsWith('.gif')) {
      return NextResponse.json({ error: "Only .gif files are supported" }, { status: 400 });
    }

    const dir = join(tmpdir(), `gif-mp4-${Date.now()}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const input = join(dir, 'input.gif');
    const output = join(dir, 'output.mp4');

    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(input, buf);

    const cmd = [
      'ffmpeg',
      '-i', `"${input}"`,
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', '"scale=trunc(iw/2)*2:trunc(ih/2)*2"',
      `"${output}"`
    ].join(' ');

    try {
      await execAsync(cmd);
    } catch (e: any) {
      if (e?.stderr?.includes('ffmpeg: command not found')) {
        return NextResponse.json({ error: 'FFmpeg not installed on server' }, { status: 500 });
      }
      throw e;
    }

    if (!existsSync(output)) throw new Error('Output not created');
    const out = readFileSync(output);

    try { unlinkSync(input); } catch {}
    try { unlinkSync(output); } catch {}
    try { rmdirSync(dir); } catch {}

    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="output.mp4"',
      }
    });
  } catch (e) {
    console.error('gif-mp4 api error', e);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}


