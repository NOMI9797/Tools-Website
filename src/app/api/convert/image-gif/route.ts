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
    const delay = parseInt(formData.get('delay') as string) || 500;
    const loop = formData.get('loop') === 'true';
    
    // Extract all image files
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (imageFiles.length < 2) {
      return NextResponse.json({ error: "At least 2 images are required for GIF animation" }, { status: 400 });
    }

    const dir = join(tmpdir(), `image-gif-${Date.now()}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    try {
      // Save all images to temp directory
      const imagePaths: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const imagePath = join(dir, `frame_${i.toString().padStart(3, '0')}.png`);
        
        try {
          // Convert to PNG using sharp for consistency
          const sharp = require('sharp');
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          
          // Process with sharp - ensure proper format conversion
          const pngBuffer = await sharp(buffer)
            .ensureAlpha() // Ensure alpha channel for PNG
            .png({ 
              quality: 100,
              compressionLevel: 0,
              adaptiveFiltering: false
            })
            .toBuffer();
          
          writeFileSync(imagePath, pngBuffer);
          imagePaths.push(imagePath);
        } catch (sharpError) {
          console.error(`Error processing image ${i}:`, sharpError);
          throw new Error(`Failed to process image ${imageFile.name}: ${sharpError.message}`);
        }
      }

      const outputPath = join(dir, 'output.gif');
      
      // Create GIF using FFmpeg
      const loopFlag = loop ? '-loop 0' : '-loop 1';
      const cmd = [
        'ffmpeg',
        '-y', // Overwrite output file
        '-framerate', `${1000 / delay}`, // Convert delay to framerate
        '-i', `"${join(dir, 'frame_%03d.png')}"`,
        loopFlag,
        '-vf', '"scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos"', // Ensure even dimensions with better scaling
        '-f', 'gif', // Force GIF format
        `"${outputPath}"`
      ].join(' ');

      try {
        console.log('Running FFmpeg command:', cmd);
        const { stdout, stderr } = await execAsync(cmd);
        console.log('FFmpeg stdout:', stdout);
        if (stderr) console.log('FFmpeg stderr:', stderr);
      } catch (e: any) {
        console.error('FFmpeg execution error:', e);
        if (e?.stderr?.includes('ffmpeg: command not found')) {
          return NextResponse.json({ error: 'FFmpeg not installed on server' }, { status: 500 });
        }
        throw e;
      }

      if (!existsSync(outputPath)) {
        throw new Error('GIF output not created');
      }

      const gifBuffer = readFileSync(outputPath);

      // Cleanup
      imagePaths.forEach(path => {
        try { unlinkSync(path); } catch {}
      });
      try { unlinkSync(outputPath); } catch {}
      try { rmdirSync(dir); } catch {}

      return new NextResponse(gifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': 'attachment; filename="animated.gif"',
        }
      });

    } catch (error) {
      // Cleanup on error
      try {
        const files = require('fs').readdirSync(dir);
        files.forEach((file: string) => {
          try { unlinkSync(join(dir, file)); } catch {}
        });
        try { rmdirSync(dir); } catch {}
      } catch {}
      
      throw error;
    }

  } catch (error) {
    console.error('Image to GIF conversion error:', error);
    return NextResponse.json({ error: 'Failed to create GIF' }, { status: 500 });
  }
}
