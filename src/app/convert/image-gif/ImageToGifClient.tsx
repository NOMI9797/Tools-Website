"use client";

import { useState, useCallback, useEffect } from "react";

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
    setConvertedFileName("");
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

  const handleReset = useCallback(() => {
    setImages([]);
    setGifUrl(null);
    setConvertedFileName("");
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload Images</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Multiple Images
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-gray-700">
                    {images.length > 0 ? `${images.length} images selected` : "Click to select images"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: JPG, PNG, WEBP (multiple files)
                  </div>
                </button>
              </div>
            </div>

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

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={images.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Creating GIF…" : "Create Animated GIF"}
            </button>

            {/* Selected Images Preview */}
            {images.length > 0 && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Selected Images ({images.length})</h4>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(image)} 
                        alt={`Frame ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-300/50"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        ×
                      </button>
                      <p className="text-xs text-center mt-1 truncate text-gray-700">{image.name}</p>
                    </div>
                  ))}
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
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Generated GIF</h3>
          
          {gifUrl ? (
            <div className="space-y-6">
              {/* GIF Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Animated GIF</h4>
                <div className="rounded-lg overflow-hidden border border-gray-300/50">
                  <img 
                    src={gifUrl} 
                    alt="Generated GIF" 
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download GIF</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎬</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: GIF • {images.length} frames</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download GIF
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50"
                    >
                      🔄 Create Another
                    </button>
                  </div>
                </div>
              </div>

              {/* Animation Details */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Animation Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Total Frames:</span>
                    <div className="font-medium text-gray-900">{images.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Frame Delay:</span>
                    <div className="font-medium text-gray-900">{delay}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Loop:</span>
                    <div className="font-medium text-gray-900">{loop ? "Enabled" : "Disabled"}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">GIF</div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-300/50 rounded-lg">
                  <p className="text-xs text-gray-700">
                    High-quality animated GIF created from {images.length} images. 
                    Uses server-side FFmpeg when available, falls back to client-side processing.
                  </p>
                </div>
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="space-y-6">
              {/* Images Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Image Sequence Preview</h4>
                <div className="grid grid-cols-2 gap-3">
                  {images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={URL.createObjectURL(image)} 
                        alt={`Frame ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300/50"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {images.length > 4 && (
                    <div className="flex items-center justify-center bg-gray-300/50 rounded-lg border border-gray-300/50">
                      <span className="text-gray-700 text-sm">+{images.length - 4} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Animation Settings Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Animation Preview</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Total Frames:</span>
                    <div className="font-medium text-gray-900">{images.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Frame Delay:</span>
                    <div className="font-medium text-gray-900">{delay}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Loop:</span>
                    <div className="font-medium text-gray-900">{loop ? "Enabled" : "Disabled"}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Duration:</span>
                    <div className="font-medium text-gray-900">
                      {((images.length * delay) / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">🎬</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create GIF</h4>
                <p className="text-gray-700">
                  Your {images.length} images are ready to be converted into an animated GIF.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🖼️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create GIF</h4>
              <p className="text-gray-700">
                Select multiple images to create an animated GIF with customizable settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
