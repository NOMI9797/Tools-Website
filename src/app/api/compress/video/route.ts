import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: 'Video Compressor API',
    description: 'Compress video files using FFmpeg',
    supportedFormats: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', '3gp'],
    parameters: {
      file: 'Video file to compress',
      quality: 'high | medium | low',
      resolution: 'original | 720p | 480p | 360p',
      fps: 'original | 30 | 24 | 15',
      bitrate: 'auto | 1000k | 500k | 250k'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quality = formData.get('quality') as string || 'medium';
    const resolution = formData.get('resolution') as string || 'original';
    const fps = formData.get('fps') as string || 'original';
    const bitrate = formData.get('bitrate') as string || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'video/mkv', 'video/flv', 'video/wmv', 'video/3gp'
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a video file.' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'video-compressor');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.${file.name.split('.').pop()}`);
    const outputPath = path.join(tempDir, `output_${timestamp}.mp4`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(inputPath, buffer);

      // Build FFmpeg command
      let command = `ffmpeg -y -i "${inputPath}"`;

      // Video codec and quality
      switch (quality) {
        case 'high':
          command += ' -c:v libx264 -crf 18';
          break;
        case 'medium':
          command += ' -c:v libx264 -crf 23';
          break;
        case 'low':
          command += ' -c:v libx264 -crf 28';
          break;
        default:
          command += ' -c:v libx264 -crf 23';
      }

      // Resolution
      if (resolution !== 'original') {
        switch (resolution) {
          case '720p':
            command += ' -vf scale=1280:720';
            break;
          case '480p':
            command += ' -vf scale=854:480';
            break;
          case '360p':
            command += ' -vf scale=640:360';
            break;
        }
      }

      // FPS
      if (fps !== 'original') {
        command += ` -r ${fps}`;
      }

      // Bitrate
      if (bitrate !== 'auto') {
        command += ` -b:v ${bitrate}`;
      }

      // Audio codec
      command += ' -c:a aac -b:a 128k';

      // Output
      command += ` "${outputPath}"`;

      console.log('FFmpeg command:', command);

      // Execute FFmpeg command
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('frame=') && !stderr.includes('size=')) {
        console.error('FFmpeg stderr:', stderr);
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg failed to create output file');
      }

      // Read compressed file
      const compressedBuffer = fs.readFileSync(outputPath);
      const compressedSize = compressedBuffer.length;

      console.log(`Video compressed successfully. Original: ${buffer.length} bytes, Compressed: ${compressedSize} bytes`);

      // Cleanup temporary files
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary files:', cleanupError);
      }

      // Return compressed file
      return new NextResponse(compressedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': compressedSize.toString(),
          'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
        },
      });

    } catch (ffmpegError) {
      console.error('FFmpeg execution error:', ffmpegError);
      
      // Cleanup on error
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary files:', cleanupError);
      }

      return NextResponse.json({ 
        error: 'Video compression failed. Make sure FFmpeg is installed and the input file is valid.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Video compression error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during video compression' 
    }, { status: 500 });
  }
}
