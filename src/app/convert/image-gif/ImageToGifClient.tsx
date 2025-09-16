"use client";

import { useState, useCallback, useEffect } from "react";
import FileUpload from '@/components/FileUpload';

export default function ImageToGifClient() {
  const [images, setImages] = useState<File[]>([]);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [delay, setDelay] = useState(500); // milliseconds between frames
  const [loop, setLoop] = useState(true);
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  const resetState = () => {
    setImages([]);
    setGifUrl(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFiles: File[] | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      resetState();
      return;
    }
    const first = selectedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(first.name + (selectedFiles.length > 1 ? ` +${selectedFiles.length - 1}` : ''));
    setError(null);
    setGifUrl(null);
    setConvertedFileName('');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setImages(prev => {
            const existing = new Set(prev.map(f => `${f.name}:${f.size}`));
            const toAdd = selectedFiles.filter(f => !existing.has(`${f.name}:${f.size}`));
            return [...prev, ...toAdd];
          });
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");

        const instance = new FFmpeg();
        instance.on("log", ({ message }) => console.log(message));
        instance.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setFFmpeg(instance);
        setReady(true);
        setLoadingMessage("");
        console.log('FFmpeg loaded successfully');
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
        setLoadingMessage("Failed to load FFmpeg. Please refresh the page.");
      }
    };
    loadFFmpeg();
  }, []);


  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    
    setIsLoading(true);
    setProgress(0);

    // Try server-side conversion first
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      formData.append('delay', delay.toString());
      formData.append('loop', loop.toString());

      const response = await fetch('/api/convert/image-gif', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGifUrl(url);
        setConvertedFileName("animated.gif");
        setIsLoading(false);
        setProgress(0);
        return;
      } else {
        console.log('Server-side conversion failed, trying client-side...');
      }
    } catch (serverError) {
      console.log('Server-side conversion error, trying client-side...', serverError);
    }

    // Fallback to client-side conversion
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait for it to load or refresh the page.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      
      // Write all images to FFmpeg filesystem with correct extensions
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const extension = image.type === 'image/jpeg' ? 'jpg' : 
                         image.type === 'image/png' ? 'png' : 
                         image.type === 'image/webp' ? 'webp' : 'png';
        const inputName = `input_${i.toString().padStart(3, '0')}.${extension}`;
        const fileData = await fetchFile(image);
        await ffmpeg.writeFile(inputName, fileData);
      }

      // Convert all images to PNG first
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const extension = image.type === 'image/jpeg' ? 'jpg' : 
                         image.type === 'image/png' ? 'png' : 
                         image.type === 'image/webp' ? 'webp' : 'png';
        const inputName = `input_${i.toString().padStart(3, '0')}.${extension}`;
        const outputName = `frame_${i.toString().padStart(3, '0')}.png`;
        
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos',
          outputName
        ]);
      }

      // Create GIF from PNG frames
      const outputName = "output.gif";
      const loopFlag = loop ? "0" : "1";
      
      await ffmpeg.exec([
        '-y',
        '-framerate', `${1000 / delay}`,
        '-i', 'frame_%03d.png',
        '-loop', loopFlag,
        '-f', 'gif',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: "image/gif" });
      const url = URL.createObjectURL(blob);

      setGifUrl(url);
      setConvertedFileName("animated.gif");
      console.log('Client-side conversion successful');
    } catch (err) {
      console.error("Both server and client conversion failed:", err);
      alert("Failed to convert images to GIF. Please try with fewer images or refresh the page.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [images, delay, loop, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!gifUrl || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [gifUrl, convertedFileName]);


  if (!ready) {
    return (
      <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">⚙️</div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading FFmpeg</h4>
        <p className="text-gray-700 mb-4">{loadingMessage || "Loading FFmpeg… please wait"}</p>
        <div className="w-full bg-gray-300/50 rounded-full h-2">
          <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <FileUpload
            placeholder="Choose Files"
            icon="🖼️"
            maxFileSize={MAX_FILE_SIZE}
            allowedMimeTypes={ALLOWED_MIME_TYPES}
            allowedExtensions={ALLOWED_EXTENSIONS}
            onFileChange={(files) => handleFileChange(files ? Array.isArray(files) ? files : [files] : null)}
            onError={setError}
            multiple={true}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Uploading {uploadingFileName}...</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Animation Settings */}
          {images.length > 0 && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
              <h4 className="font-semibold text-gray-900 mb-3">Animation Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Delay: {delay}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Fast (100ms)</span>
                    <span>Slow (2000ms)</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="loop"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                    className="w-4 h-4 text-gray-600 bg-gray-300/50 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <label htmlFor="loop" className="text-sm font-medium text-gray-700">
                    Loop animation
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
              <h4 className="font-semibold text-gray-900 mb-3">Creating Animated GIF</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Processing {images.length} images...</span>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-300/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-600 to-gray-700 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Converting images to animated GIF with {delay}ms frame delay...
                </p>
              </div>
            </div>
          )}

          {/* Convert Button - Only show after file upload and before conversion */}
          {images.length > 0 && !gifUrl && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating GIF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Create Animated GIF
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button - Only show after conversion */}
          {gifUrl && (
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-green-600/80 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-green-700/90 transition-all duration-300 shadow-lg hover:shadow-xl relative z-10"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download GIF File
              </span>
            </button>
          )}
        </div>
      </div>
    </div>

  );
}
