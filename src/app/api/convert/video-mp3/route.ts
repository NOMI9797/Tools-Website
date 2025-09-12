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
  }
];

const supportedVideoFormats = [
  "mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v", "3gp", "ogv", 
  "mts", "m2ts", "ts", "vob", "asf", "rm", "rmvb", "divx", "xvid", "f4v"
];

export async function GET() {
  return NextResponse.json({
    qualities: mp3Qualities,
    supportedFormats: supportedVideoFormats,
    message: "Video to MP3 converter API - Use POST for conversions"
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const quality = formData.get("quality") as string || "192";
    const startTime = formData.get("startTime") as string || "0";
    const duration = formData.get("duration") as string || "";
    const normalize = formData.get("normalize") as string === "true";
    const extractMode = formData.get("extractMode") as string || "full";

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!supportedVideoFormats.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: `Unsupported video format: ${fileExtension}. Supported formats: ${supportedVideoFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Validate quality
    const qualityData = mp3Qualities.find(q => q.id === quality);
    if (!qualityData) {
      return NextResponse.json({ 
        error: `Invalid quality setting: ${quality}` 
      }, { status: 400 });
    }

    // Validate time parameters
    const startTimeSeconds = parseFloat(startTime) || 0;
    if (startTimeSeconds < 0) {
      return NextResponse.json({ 
        error: "Start time cannot be negative" 
      }, { status: 400 });
    }

    let durationSeconds = 0;
    if (duration) {
      durationSeconds = parseFloat(duration);
      if (durationSeconds <= 0) {
        return NextResponse.json({ 
          error: "Duration must be positive" 
        }, { status: 400 });
      }
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), 'video-mp3-converter');
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

      // Get video information first
      const videoInfo = await getVideoInfo(inputPath);

      // Build FFmpeg command for Video to MP3 conversion
      let ffmpegCommand = `ffmpeg -i "${inputPath}"`;

      // Add time parameters if specified
      if (startTimeSeconds > 0) {
        ffmpegCommand += ` -ss ${startTimeSeconds}`;
      }

      if (durationSeconds > 0) {
        ffmpegCommand += ` -t ${durationSeconds}`;
      }

      // Add audio normalization if requested
      if (normalize) {
        ffmpegCommand += ` -af "loudnorm=I=-16:TP=-1.5:LRA=11"`;
      }

      // Add MP3 encoding settings
      ffmpegCommand += ` -codec:a libmp3lame -b:a ${qualityData.bitrate}`;
      ffmpegCommand += ` -joint_stereo 1 -reservoir 1`;

      // Extract only audio (no video)
      ffmpegCommand += ` -vn`;

      // Add format specification for better compatibility
      ffmpegCommand += ` -f mp3`;

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

      // Get MP3 file information
      const mp3Info = await getMP3Info(outputPath);

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
        startTime: startTimeSeconds,
        duration: durationSeconds || videoInfo.duration,
        normalize: normalize,
        extractMode: extractMode,
        videoInfo: videoInfo,
        mp3Info: mp3Info,
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
        error: "Video to MP3 conversion failed. Make sure FFmpeg is installed and the input file is valid." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Video to MP3 conversion error:', error);
    return NextResponse.json({ error: "Video to MP3 conversion failed" }, { status: 500 });
  }
}

async function getVideoInfo(filePath: string) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const videoStream = info.streams.find((stream: any) => stream.codec_type === 'video');
    const audioStream = info.streams.find((stream: any) => stream.codec_type === 'audio');
    
    return {
      duration: parseFloat(info.format.duration) || 0,
      bitrate: info.format.bit_rate,
      videoCodec: videoStream?.codec_name,
      audioCodec: audioStream?.codec_name,
      videoResolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
      audioChannels: audioStream?.channels,
      audioSampleRate: audioStream?.sample_rate,
      format: info.format.format_name,
      fileSize: info.format.size,
      frameRate: videoStream?.r_frame_rate
    };
  } catch (error) {
    console.warn('Failed to get video info:', error);
    return {
      duration: 0,
      bitrate: null,
      videoCodec: null,
      audioCodec: null,
      videoResolution: null,
      audioChannels: null,
      audioSampleRate: null,
      format: null,
      fileSize: null,
      frameRate: null
    };
  }
}

async function getMP3Info(filePath: string) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const audioStream = info.streams.find((stream: any) => stream.codec_type === 'audio');
    
    return {
      duration: parseFloat(info.format.duration) || 0,
      bitrate: info.format.bit_rate,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
      codec: audioStream?.codec_name,
      format: info.format.format_name,
      fileSize: info.format.size
    };
  } catch (error) {
    console.warn('Failed to get MP3 info:', error);
    return null;
  }
}
