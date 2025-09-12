import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: 'MP4 Converter API',
    description: 'Convert videos to MP4 format using FFmpeg',
    supportedFormats: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', '3gp'],
    parameters: {
      file: 'Video file to convert',
      quality: 'high | medium | low',
      resolution: 'original | 1080p | 720p | 480p | 360p',
      fps: 'original | 60 | 30 | 24 | 15',
      bitrate: 'auto | 5000k | 3000k | 2000k | 1000k | 500k',
      audioCodec: 'aac | mp3 | copy',
      videoCodec: 'h264 | h265'
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
    const audioCodec = formData.get('audioCodec') as string || 'aac';
    const videoCodec = formData.get('videoCodec') as string || 'h264';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'video/mkv', 'video/flv', 'video/wmv', 'video/3gp',
      'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a video file.' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'mp4-converter');
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

      // Video codec
      if (videoCodec === 'h265') {
        command += ' -c:v libx265';
      } else {
        command += ' -c:v libx264';
      }

      // Quality settings
      switch (quality) {
        case 'high':
          command += ' -crf 18';
          break;
        case 'medium':
          command += ' -crf 23';
          break;
        case 'low':
          command += ' -crf 28';
          break;
      }

      // Resolution
      if (resolution !== 'original') {
        switch (resolution) {
          case '1080p':
            command += ' -vf scale=1920:1080';
            break;
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
      if (audioCodec === 'copy') {
        command += ' -c:a copy';
      } else {
        command += ` -c:a ${audioCodec} -b:a 128k`;
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

      console.log(`Video converted successfully. Original: ${buffer.length} bytes, Converted: ${convertedSize} bytes`);

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
          'Content-Type': 'video/mp4',
          'Content-Length': convertedSize.toString(),
          'Content-Disposition': `attachment; filename="converted_${file.name.replace(/\.[^/.]+$/, '')}.mp4"`,
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
        error: 'Video conversion failed. Make sure FFmpeg is installed and the input file is valid.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('MP4 conversion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during video conversion' 
    }, { status: 500 });
  }
}
