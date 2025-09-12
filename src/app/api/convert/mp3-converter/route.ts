import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

type MP3Quality = {
  id: string;
  name: string;
  bitrate: string;
  description: string;
};

type MP3Mode = {
  id: string;
  name: string;
  description: string;
};

const mp3Qualities: MP3Quality[] = [
  {
    id: "320",
    name: "320 kbps",
    bitrate: "320k",
    description: "Highest quality - CD quality audio"
  },
  {
    id: "256",
    name: "256 kbps",
    bitrate: "256k",
    description: "Very high quality - Near CD quality"
  },
  {
    id: "192",
    name: "192 kbps",
    bitrate: "192k",
    description: "High quality - Good for most uses"
  },
  {
    id: "160",
    name: "160 kbps",
    bitrate: "160k",
    description: "Good quality - Balanced size and quality"
  },
  {
    id: "128",
    name: "128 kbps",
    bitrate: "128k",
    description: "Standard quality - Most common bitrate"
  },
  {
    id: "96",
    name: "96 kbps",
    bitrate: "96k",
    description: "Lower quality - Smaller file size"
  },
  {
    id: "64",
    name: "64 kbps",
    bitrate: "64k",
    description: "Low quality - Very small file size"
  }
];

const mp3Modes: MP3Mode[] = [
  {
    id: "cbr",
    name: "CBR (Constant Bitrate)",
    description: "Constant bitrate throughout the file"
  },
  {
    id: "vbr",
    name: "VBR (Variable Bitrate)",
    description: "Variable bitrate for better quality/size ratio"
  },
  {
    id: "abr",
    name: "ABR (Average Bitrate)",
    description: "Average bitrate with some variation"
  }
];

const supportedInputFormats = [
  "mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff", "au", "ra", "amr", "3gp"
];

export async function GET() {
  return NextResponse.json({
    qualities: mp3Qualities,
    modes: mp3Modes,
    supportedFormats: supportedInputFormats,
    message: "MP3 converter API - Use POST for conversions"
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const quality = formData.get("quality") as string || "192";
    const mode = formData.get("mode") as string || "cbr";
    const normalize = formData.get("normalize") as string === "true";
    const removeSilence = formData.get("removeSilence") as string === "true";

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!supportedInputFormats.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: `Unsupported source format: ${fileExtension}. Supported formats: ${supportedInputFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Validate quality
    const qualityData = mp3Qualities.find(q => q.id === quality);
    if (!qualityData) {
      return NextResponse.json({ 
        error: `Invalid quality setting: ${quality}` 
      }, { status: 400 });
    }

    // Validate mode
    const modeData = mp3Modes.find(m => m.id === mode);
    if (!modeData) {
      return NextResponse.json({ 
        error: `Invalid mode setting: ${mode}` 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), 'mp3-converter');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const inputFileName = `input_${timestamp}.${fileExtension}`;
    const outputFileName = `output_${timestamp}.mp3`;
    const inputPath = join(tempDir, inputFileName);
    const outputPath = join(tempDir, outputFileName);

    try {
      // Write uploaded file to temporary location
      const fileBuffer = await file.arrayBuffer();
      writeFileSync(inputPath, Buffer.from(fileBuffer));

      // Build FFmpeg command for MP3 conversion
      let ffmpegCommand = `ffmpeg -i "${inputPath}"`;

      // Add audio normalization if requested
      if (normalize) {
        ffmpegCommand += ` -af "loudnorm=I=-16:TP=-1.5:LRA=11"`;
      }

      // Add silence removal if requested
      if (removeSilence) {
        ffmpegCommand += ` -af "silenceremove=start_periods=1:start_duration=1:start_threshold=-60dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=1:start_threshold=-60dB:detection=peak,aformat=dblp,areverse"`;
      }

      // Add MP3 encoding settings based on mode
      switch (mode) {
        case "cbr":
          ffmpegCommand += ` -codec:a libmp3lame -b:a ${qualityData.bitrate}`;
          break;
        case "vbr":
          const vbrQuality = quality === "320" ? "0" : quality === "256" ? "1" : quality === "192" ? "2" : 
                           quality === "160" ? "3" : quality === "128" ? "4" : quality === "96" ? "5" : "6";
          ffmpegCommand += ` -codec:a libmp3lame -q:a ${vbrQuality}`;
          break;
        case "abr":
          ffmpegCommand += ` -codec:a libmp3lame -b:a ${qualityData.bitrate} -abr 1`;
          break;
      }

      // Add additional MP3-specific options
      ffmpegCommand += ` -joint_stereo 1 -reservoir 1`;

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

      // Get file information
      const fileInfo = await getMP3Info(outputPath);

      // Clean up temporary files
      try {
        unlinkSync(inputPath);
        unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError);
      }

      return NextResponse.json({
        success: true,
        originalFormat: fileExtension?.toUpperCase(),
        targetFormat: "MP3",
        originalSize: file.size,
        convertedSize: convertedBuffer.length,
        quality: qualityData.name,
        mode: modeData.name,
        normalize: normalize,
        removeSilence: removeSilence,
        fileInfo: fileInfo,
        audioData: base64Audio,
        mimeType: "audio/mpeg",
        fileName: `${file.name.split('.')[0]}.mp3`
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
        error: "MP3 conversion failed. Make sure FFmpeg is installed and the input file is valid." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('MP3 conversion error:', error);
    return NextResponse.json({ error: "MP3 conversion failed" }, { status: 500 });
  }
}

async function getMP3Info(filePath: string) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const audioStream = info.streams.find((stream: any) => stream.codec_type === 'audio');
    
    return {
      duration: info.format.duration,
      bitrate: info.format.bit_rate,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
      codec: audioStream?.codec_name,
      format: info.format.format_name
    };
  } catch (error) {
    console.warn('Failed to get MP3 info:', error);
    return null;
  }
}
