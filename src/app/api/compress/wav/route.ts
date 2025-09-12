import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({
    message: 'WAV Compressor API',
    description: 'Compress WAV files using FFmpeg',
    supportedFormats: ['wav'],
    parameters: {
      file: 'WAV file to compress',
      compressionType: 'downsample | convert',
      bitDepth: '16 | 8 (for downsampling)',
      sampleRate: '44100 | 22050 | 11025 (for downsampling)',
      mp3Bitrate: '320 | 256 | 192 | 128 | 96 | 64 (for conversion)',
      mp3EncodingMode: 'cbr | vbr | abr (for conversion)'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const compressionType = formData.get('compressionType') as string || 'downsample';
    const bitDepth = formData.get('bitDepth') as string || '16';
    const sampleRate = formData.get('sampleRate') as string || '44100';
    const mp3Bitrate = formData.get('mp3Bitrate') as string || '128';
    const mp3EncodingMode = formData.get('mp3EncodingMode') as string || 'cbr';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'audio/wav' && !file.name.toLowerCase().endsWith('.wav')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a WAV file.' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'wav-compressor');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `input_${timestamp}.wav`);
    const outputPath = path.join(tempDir, `output_${timestamp}.${compressionType === 'downsample' ? 'wav' : 'mp3'}`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(inputPath, buffer);

      // Build FFmpeg command
      let command = `ffmpeg -y -i "${inputPath}"`;

      if (compressionType === 'downsample') {
        // WAV downsampling
        command += ` -ar ${sampleRate} -ac 2`; // Sample rate and stereo
        
        // Bit depth handling
        if (bitDepth === '8') {
          command += ' -acodec pcm_u8';
        } else {
          command += ' -acodec pcm_s16le';
        }
      } else {
        // Convert to MP3
        command += ' -c:a libmp3lame';
        
        // MP3 encoding settings
        switch (mp3EncodingMode) {
          case 'cbr':
            command += ` -b:a ${mp3Bitrate}k -joint_stereo 1`;
            break;
          case 'vbr':
            const vbrQuality = mp3Bitrate === '320' ? '0' : 
                              mp3Bitrate === '256' ? '2' :
                              mp3Bitrate === '192' ? '4' :
                              mp3Bitrate === '128' ? '6' :
                              mp3Bitrate === '96' ? '8' : '9';
            command += ` -q:a ${vbrQuality}`;
            break;
          case 'abr':
            command += ` -abr 1 -b:a ${mp3Bitrate}k -joint_stereo 1`;
            break;
          default:
            command += ` -b:a ${mp3Bitrate}k -joint_stereo 1`;
        }
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

      console.log(`WAV compressed successfully. Original: ${buffer.length} bytes, Compressed: ${compressedSize} bytes`);

      // Cleanup temporary files
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary files:', cleanupError);
      }

      // Return compressed file
      const contentType = compressionType === 'downsample' ? 'audio/wav' : 'audio/mpeg';
      const outputExtension = compressionType === 'downsample' ? 'wav' : 'mp3';
      
      return new NextResponse(compressedBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': compressedSize.toString(),
          'Content-Disposition': `attachment; filename="compressed_${file.name.replace('.wav', '')}.${outputExtension}"`,
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
        error: 'WAV compression failed. Make sure FFmpeg is installed and the input file is valid.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('WAV compression error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during WAV compression' 
    }, { status: 500 });
  }
}
