import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

type AudioFormat = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
};

const supportedFormats: AudioFormat[] = [
  {
    id: "mp3",
    name: "MP3",
    extension: "mp3",
    mimeType: "audio/mpeg",
    description: "MPEG Audio Layer III - Most common audio format"
  },
  {
    id: "wav",
    name: "WAV",
    extension: "wav",
    mimeType: "audio/wav",
    description: "Waveform Audio File Format - Uncompressed audio"
  },
  {
    id: "ogg",
    name: "OGG",
    extension: "ogg",
    mimeType: "audio/ogg",
    description: "Ogg Vorbis - Open source audio format"
  },
  {
    id: "flac",
    name: "FLAC",
    extension: "flac",
    mimeType: "audio/flac",
    description: "Free Lossless Audio Codec - Lossless compression"
  },
  {
    id: "aac",
    name: "AAC",
    extension: "aac",
    mimeType: "audio/aac",
    description: "Advanced Audio Coding - High quality compression"
  },
  {
    id: "m4a",
    name: "M4A",
    extension: "m4a",
    mimeType: "audio/mp4",
    description: "MPEG-4 Audio - Apple's audio format"
  },
  {
    id: "wma",
    name: "WMA",
    extension: "wma",
    mimeType: "audio/x-ms-wma",
    description: "Windows Media Audio - Microsoft's audio format"
  }
];

export async function GET() {
  return NextResponse.json({
    formats: supportedFormats,
    message: "Audio converter API - Use POST for conversions"
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetFormat = formData.get("targetFormat") as string;
    const quality = formData.get("quality") as string || "high";

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!targetFormat) {
      return NextResponse.json({ error: "Target format not specified" }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const sourceFormat = supportedFormats.find(f => f.extension === fileExtension);
    
    if (!sourceFormat) {
      return NextResponse.json({ 
        error: `Unsupported source format: ${fileExtension}. Supported formats: ${supportedFormats.map(f => f.extension).join(', ')}` 
      }, { status: 400 });
    }

    // Validate target format
    const targetFormatData = supportedFormats.find(f => f.id === targetFormat);
    if (!targetFormatData) {
      return NextResponse.json({ 
        error: `Unsupported target format: ${targetFormat}. Supported formats: ${supportedFormats.map(f => f.id).join(', ')}` 
      }, { status: 400 });
    }

    // Check if conversion is needed
    if (sourceFormat.id === targetFormat) {
      return NextResponse.json({ 
        error: "Source and target formats are the same" 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), 'audio-converter');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputFileName = `input_${timestamp}.${sourceFormat.extension}`;
    const outputFileName = `output_${timestamp}.${targetFormatData.extension}`;
    const inputPath = join(tempDir, inputFileName);
    const outputPath = join(tempDir, outputFileName);

    try {
      // Write uploaded file to temporary location
      const fileBuffer = await file.arrayBuffer();
      writeFileSync(inputPath, Buffer.from(fileBuffer));

      // Build FFmpeg command based on target format and quality
      let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
      
      // Add format-specific options
      switch (targetFormat) {
        case "mp3":
          const mp3Quality = quality === "high" ? "320k" : quality === "medium" ? "192k" : "128k";
          ffmpegCommand += ` -codec:a libmp3lame -b:a ${mp3Quality}`;
          break;
        case "wav":
          ffmpegCommand += ` -codec:a pcm_s16le`;
          break;
        case "ogg":
          const oggQuality = quality === "high" ? "9" : quality === "medium" ? "6" : "3";
          ffmpegCommand += ` -codec:a libvorbis -q:a ${oggQuality}`;
          break;
        case "flac":
          ffmpegCommand += ` -codec:a flac -compression_level 5`;
          break;
        case "aac":
          const aacQuality = quality === "high" ? "320k" : quality === "medium" ? "192k" : "128k";
          ffmpegCommand += ` -codec:a aac -b:a ${aacQuality}`;
          break;
        case "m4a":
          const m4aQuality = quality === "high" ? "320k" : quality === "medium" ? "192k" : "128k";
          ffmpegCommand += ` -codec:a aac -b:a ${m4aQuality}`;
          break;
        case "wma":
          const wmaQuality = quality === "high" ? "320k" : quality === "medium" ? "192k" : "128k";
          ffmpegCommand += ` -codec:a wmav2 -b:a ${wmaQuality}`;
          break;
      }

      ffmpegCommand += ` "${outputPath}" -y`;

      console.log(`Executing FFmpeg command: ${ffmpegCommand}`);

      // Execute FFmpeg command
      const { stdout, stderr } = await execAsync(ffmpegCommand);

      console.log(`FFmpeg stdout: ${stdout}`);
      if (stderr) {
        console.log(`FFmpeg stderr: ${stderr}`);
      }

      // Check if output file was created
      if (!existsSync(outputPath)) {
        throw new Error("FFmpeg conversion failed - no output file generated");
      }

      // Read the converted file
      const convertedBuffer = require('fs').readFileSync(outputPath);
      const base64Audio = convertedBuffer.toString('base64');

      // Clean up temporary files
      try {
        unlinkSync(inputPath);
        unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError);
      }

      return NextResponse.json({
        success: true,
        originalFormat: sourceFormat.name,
        targetFormat: targetFormatData.name,
        originalSize: file.size,
        convertedSize: convertedBuffer.length,
        quality: quality,
        audioData: base64Audio,
        mimeType: targetFormatData.mimeType,
        fileName: `${file.name.split('.')[0]}.${targetFormatData.extension}`
      });

    } catch (ffmpegError) {
      console.error('FFmpeg execution error:', ffmpegError);
      
      // Clean up temporary files on error
      try {
        if (existsSync(inputPath)) unlinkSync(inputPath);
        if (existsSync(outputPath)) unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files after error:', cleanupError);
      }

      return NextResponse.json({ 
        error: "Audio conversion failed. Make sure FFmpeg is installed and the input file is valid." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Audio conversion error:', error);
    return NextResponse.json({ error: "Audio conversion failed" }, { status: 500 });
  }
}
