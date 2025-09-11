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
    const name = (file as any).name || 'input.webm';
    if (!name.toLowerCase().endsWith('.webm')) {
      return NextResponse.json({ error: "Only .webm files are supported" }, { status: 400 });
    }

    const dir = join(tmpdir(), `webm-gif-${Date.now()}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const input = join(dir, 'input.webm');
    const output = join(dir, 'output.gif');

    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(input, buf);

    const cmd = [
      'ffmpeg',
      '-i', `"${input}"`,
      '-vf', '"fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"',
      '-loop', '0',
      '-t', '5',
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
        'Content-Type': 'image/gif',
        'Content-Disposition': 'attachment; filename="output.gif"',
      }
    });
  } catch (e) {
    console.error('webm-gif api error', e);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}


