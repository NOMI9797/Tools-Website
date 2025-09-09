import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import sharp from "sharp";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RasterFormat = "png" | "jpg" | "webp";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const target = String(form.get("target") || "png").toLowerCase() as RasterFormat;
    const density = String(form.get("density") || "144");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }
    if (!["png", "jpg", "webp"].includes(target)) {
      return NextResponse.json({ error: "Unsupported target format" }, { status: 400 });
    }
    
    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    // Create a specific output directory
    const baseDir = join(process.cwd(), 'tmp');
    const sessionDir = join(baseDir, `convert-${Date.now()}`);
    mkdirSync(sessionDir, { recursive: true });
    
    const inputPath = join(sessionDir, 'input.pdf');
    const outputPrefix = join(sessionDir, 'page');
    
    console.log("Input file size:", inputBuffer.length);
    console.log("Writing to:", inputPath);
    
    // Write PDF to temp file
    writeFileSync(inputPath, inputBuffer);
    
    // Verify file was written
    if (!existsSync(inputPath)) {
      return NextResponse.json({ error: "Failed to write input file" }, { status: 500 });
    }
    
    try {
      // Verify input file size
      const stats = readFileSync(inputPath);
      console.log("Written file size:", stats.length);
      
      if (stats.length === 0) {
        unlinkSync(inputPath);
        return NextResponse.json({ error: "Empty PDF file" }, { status: 400 });
      }
      // First verify PDF is valid using pdfinfo
      try {
        const { stdout: pdfInfo } = await execAsync(`/opt/homebrew/bin/pdfinfo "${inputPath}"`);
        console.log("PDF Info:", pdfInfo);
        
        if (!pdfInfo.includes("Pages:")) {
          throw new Error("Invalid PDF structure");
        }
      } catch (e) {
        console.error("PDF validation failed:", e);
        return NextResponse.json({ error: "Invalid or corrupted PDF file" }, { status: 400 });
      }

      // Use pdftoppm with verbose mode and error checking
      // Always convert to PNG first
      const command = `/opt/homebrew/bin/pdftoppm -singlefile -png "${inputPath}" "${outputPrefix}"`;
      console.log("Executing command:", command);
      
      console.log("Running pdftoppm...");
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, PATH: '/opt/homebrew/bin:' + process.env.PATH },
        cwd: sessionDir
      });
      console.log("pdftoppm stdout:", stdout || "No stdout");
      console.log("pdftoppm stderr:", stderr || "No stderr");
      
      // Wait a moment for files to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Collect all generated images
      const pages: Array<{ filename: string; base64: string; mime: string }> = [];
      let idx = 1;
      
      // Look for PNG output
      const pngFile = `${outputPrefix}.png`;
      if (existsSync(pngFile)) {
        let finalBuffer: Buffer;
        const pngBuffer = readFileSync(pngFile);

        // Convert to target format if not PNG
        try {
          if (target === "webp") {
            finalBuffer = await sharp(pngBuffer)
              .webp({ quality: 90 })
              .toBuffer();
          } else if (target === "jpg") {
            finalBuffer = await sharp(pngBuffer)
              .jpeg({ quality: 90 })
              .toBuffer();
          } else {
            finalBuffer = pngBuffer;
          }
        } catch (conversionError) {
          console.error("Image conversion error:", conversionError);
          throw new Error(`Failed to convert to ${target} format`);
        }

        const mime = target === "png" ? "image/png" : target === "jpg" ? "image/jpeg" : "image/webp";
        pages.push({
          filename: `page-1.${target}`,
          base64: finalBuffer.toString("base64"),
          mime,
        });
        
        // Clean up temp file
        unlinkSync(pngFile);
      }
      
      // Clean up input file
      unlinkSync(inputPath);
      
      if (pages.length === 0) {
        console.log("No output files generated. Command may have failed silently.");
        return NextResponse.json({ error: "Failed to convert PDF. The file may be corrupted or password-protected." }, { status: 400 });
      }

      return NextResponse.json({ pages }, { status: 200 });
    } catch (execError) {
      // Clean up on error
      try { unlinkSync(inputPath); } catch {}
      console.error("Poppler execution error:", execError);
      return NextResponse.json({ error: "PDF conversion failed. Make sure Poppler is installed." }, { status: 500 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to convert PDF" }, { status: 500 });
  }
}


