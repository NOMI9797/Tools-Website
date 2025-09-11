import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), "video-gif-" + Date.now());
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputPath = join(tempDir, `input.${fileExtension}`);
    const outputPath = join(tempDir, "output.gif");

    try {
      // Save uploaded file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      writeFileSync(inputPath, buffer);

      console.log('Converting video to GIF...');

      // Use FFmpeg to convert video to high-quality GIF
      const ffmpegCommand = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-vf', '"fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"',
        '-loop', '0',
        '-t', '5', // Limit to 5 seconds
        `"${outputPath}"`
      ].join(' ');

      await execAsync(ffmpegCommand);

      if (!existsSync(outputPath)) {
        throw new Error('GIF conversion failed - output file not created');
      }

      // Read the converted GIF
      const gifBuffer = readFileSync(outputPath);

      // Clean up temporary files
      try {
        unlinkSync(inputPath);
        unlinkSync(outputPath);
        // Try to remove temp directory (will only work if empty)
        try {
          require('fs').rmdirSync(tempDir);
        } catch (e) {
          // Ignore error if directory is not empty or doesn't exist
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      // Return the GIF file
      return new NextResponse(gifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '.gif')}"`,
        },
      });

    } catch (conversionError) {
      // Clean up files in case of error
      try {
        if (existsSync(inputPath)) unlinkSync(inputPath);
        if (existsSync(outputPath)) unlinkSync(outputPath);
        try {
          require('fs').rmdirSync(tempDir);
        } catch (e) {
          // Ignore
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      console.error('Video to GIF conversion error:', conversionError);
      
      // Check if it's an FFmpeg not found error
      if (conversionError instanceof Error && conversionError.message.includes('ffmpeg')) {
        return NextResponse.json({ 
          error: "FFmpeg not available on server. Please use the client-side converter." 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: "Video conversion failed. Please try with a smaller file." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
