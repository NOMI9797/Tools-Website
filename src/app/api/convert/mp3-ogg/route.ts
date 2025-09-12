import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: 'MP3 to OGG Converter API',
    description: 'Convert MP3 files to OGG format using FFmpeg',
    supportedFormats: ['mp3'],
    parameters: {
      file: 'MP3 file to convert',
      quality: 'high | medium | low',
      bitrate: 'auto | 320 | 256 | 192 | 128 | 96 | 64',
      sampleRate: 'original | 48000 | 44100 | 22050 | 11025',
      channels: 'original | stereo | mono',
      encodingMode: 'vbr | cbr | abr'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quality = formData.get('quality') as string || 'medium';
    const bitrate = formData.get('bitrate') as string || 'auto';
    const sampleRate = formData.get('sampleRate') as string || 'original';
    const channels = formData.get('channels') as string || 'original';
    const encodingMode = formData.get('encodingMode') as string || 'vbr';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - specifically for MP3 files
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload an MP3 file.' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'mp3-ogg-converter');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.mp3`);
    const outputPath = path.join(tempDir, `output_${timestamp}.ogg`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(inputPath, buffer);

      // Build FFmpeg command
      let command = `ffmpeg -y -i "${inputPath}"`;

      // Audio codec
      command += ' -c:a libvorbis';

      // Quality settings
      switch (quality) {
        case 'high':
          command += ' -q:a 6';
          break;
        case 'medium':
          command += ' -q:a 4';
          break;
        case 'low':
          command += ' -q:a 2';
          break;
      }

      // Sample rate
      if (sampleRate !== 'original') {
        command += ` -ar ${sampleRate}`;
      }

      // Channels
      if (channels !== 'original') {
        if (channels === 'mono') {
          command += ' -ac 1';
        } else {
          command += ' -ac 2';
        }
      }

      // Encoding mode and bitrate
      if (encodingMode === 'cbr' && bitrate !== 'auto') {
        command += ` -b:a ${bitrate}k`;
      } else if (encodingMode === 'abr' && bitrate !== 'auto') {
        command += ` -abr 1 -b:a ${bitrate}k`;
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

      // Read converted file
      const convertedBuffer = fs.readFileSync(outputPath);
      const convertedSize = convertedBuffer.length;

      console.log(`MP3 to OGG conversion successful. Original: ${buffer.length} bytes, Converted: ${convertedSize} bytes`);

      // Cleanup temporary files
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary files:', cleanupError);
      }

      // Return converted file
      return new NextResponse(convertedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/ogg',
          'Content-Length': convertedSize.toString(),
          'Content-Disposition': `attachment; filename="converted_${file.name.replace(/\.[^/.]+$/, '')}.ogg"`,
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
        error: 'MP3 to OGG conversion failed. Make sure FFmpeg is installed and the input file is valid.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('MP3 to OGG conversion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during MP3 to OGG conversion' 
    }, { status: 500 });
  }
}
