import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: 'MP3 Compressor API',
    description: 'Compress MP3 files using FFmpeg',
    supportedFormats: ['mp3'],
    parameters: {
      file: 'MP3 file to compress',
      bitrate: '320 | 256 | 192 | 128 | 96 | 64',
      encodingMode: 'cbr | vbr | abr',
      quality: 'high | medium | low (for VBR)'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bitrate = formData.get('bitrate') as string || '128';
    const encodingMode = formData.get('encodingMode') as string || 'cbr';
    const quality = formData.get('quality') as string || 'medium';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload an MP3 file.' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'mp3-compressor');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.mp3`);
    const outputPath = path.join(tempDir, `output_${timestamp}.mp3`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(inputPath, buffer);

      // Build FFmpeg command
      let command = `ffmpeg -y -i "${inputPath}"`;

      // Audio codec
      command += ' -c:a libmp3lame';

      // Encoding mode and bitrate
      switch (encodingMode) {
        case 'cbr':
          command += ` -b:a ${bitrate}k -joint_stereo 1`;
          break;
        case 'vbr':
          const vbrQuality = quality === 'high' ? '0' : quality === 'medium' ? '4' : '9';
          command += ` -q:a ${vbrQuality}`;
          break;
        case 'abr':
          command += ` -abr 1 -b:a ${bitrate}k -joint_stereo 1`;
          break;
        default:
          command += ` -b:a ${bitrate}k -joint_stereo 1`;
      }

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

      console.log(`MP3 compressed successfully. Original: ${buffer.length} bytes, Compressed: ${compressedSize} bytes`);

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
          'Content-Type': 'audio/mpeg',
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
        error: 'MP3 compression failed. Make sure FFmpeg is installed and the input file is valid.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('MP3 compression error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during MP3 compression' 
    }, { status: 500 });
  }
}
