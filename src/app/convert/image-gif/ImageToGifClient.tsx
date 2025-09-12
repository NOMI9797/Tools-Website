"use client";

import { useState, useCallback, useEffect } from "react";

export default function ImageToGifClient() {
  const [images, setImages] = useState<File[]>([]);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [delay, setDelay] = useState(500); // milliseconds between frames
  const [loop, setLoop] = useState(true);
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);

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
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
      }
    };
    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    if (imageFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP). GIF files are not supported for creating animations.');
      return;
    }
    
    setImages(imageFiles);
    setGifUrl(null);
  };

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
      console.log('Client-side conversion successful');
    } catch (err) {
      console.error("Both server and client conversion failed:", err);
      alert("Failed to convert images to GIF. Please try with fewer images or refresh the page.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [images, delay, loop, ready, ffmpeg]);

  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = 'animated.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-black/[.06] bg-white p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-black/90">Upload Images</p>
          <input 
            type="file" 
            accept="image/jpeg,image/jpg,image/png,image/webp" 
            multiple 
            onChange={handleFileChange} 
            className="block w-full text-sm text-black/70 
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-black/[.05] file:text-black
              hover:file:bg-black/[.08]
              transition-colors cursor-pointer" 
          />
          <p className="text-xs text-black/50">Select multiple images to create an animated GIF. Supported: JPG, PNG, WEBP</p>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-black/90">Selected Images ({images.length})</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Frame ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-xs text-center mt-1 truncate">{image.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}


        {isLoading && (
          <div>
            <p className="text-sm">Creating GIF... {progress}%</p>
            <div className="w-full bg-black/[.08] rounded-full h-2 mt-1">
              <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {gifUrl && (
          <div>
            <p className="text-sm mb-2">Generated GIF</p>
            <img src={gifUrl} alt="Generated GIF" className="rounded-lg border w-full max-w-md" />
            <button 
              onClick={handleDownload} 
              className="mt-2 px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-black/80 transition-colors"
            >
              Download GIF
            </button>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-black/[.06] bg-white p-6">
        <button 
          onClick={handleConvert} 
          disabled={images.length === 0 || isLoading || !ready}
          className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          {!ready ? 'Loading...' : isLoading ? 'Creating GIF...' : 'Create GIF'}
        </button>
        
        <div className="mt-4 text-xs text-black/60">
          <p>• Upload 2+ images for animation</p>
          <p>• Images will be converted to GIF</p>
          <p>• Default settings: 500ms delay, loop enabled</p>
        </div>
      </aside>
    </div>
  );
}
