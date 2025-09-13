"use client";

import { useState, useCallback } from "react";

export default function JpgToPdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedPdf, setConvertedPdf] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(
      file => !file.type.startsWith('image/jpeg') && !file.name.toLowerCase().match(/\.(jpg|jpeg)$/)
    );
    
    if (invalidFiles.length > 0) {
      alert('Please select only JPG/JPEG image files');
      return;
    }

    // Check file sizes (limit to 10MB per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Please select files smaller than 10MB each.`);
      return;
    }

    setFiles(selectedFiles);
    // Reset converted PDF
    setConvertedPdf(null);
    setConvertedFileName("");
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await fetch('/api/convert/jpg-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert images');
      }

      const data = await res.json();
      setConvertedPdf(`data:application/pdf;base64,${data.base64}`);
      setConvertedFileName(files.length === 1 
        ? files[0].name.replace(/\.(jpg|jpeg)$/i, '.pdf')
        : 'converted.pdf');
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        alert(`Conversion failed: ${error.message}`);
      } else {
        alert('Failed to convert images. Please ensure all files are valid JPG/JPEG images and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedPdf || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedPdf;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedPdf, convertedFileName]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setConvertedPdf(null);
    setConvertedFileName("");
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setConvertedPdf(null);
    setConvertedFileName("");
  }, []);

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload JPG Images</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select JPG Files
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-gray-500 hover:bg-gray-200/50 transition-all duration-200 text-center"
                >
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-gray-700">
                    {files.length > 0 ? `${files.length} JPG file(s) selected` : "Click to select JPG files"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Supports: JPG/JPEG format only (max 10MB each)
                  </div>
                </button>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={files.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              {isLoading ? "Converting…" : "Convert to PDF"}
            </button>

            {/* File Information */}
            {files.length > 0 && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Selected JPG Files ({files.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-300/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">📷</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-sm text-gray-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Result</h3>
          
          {convertedPdf ? (
            <div className="space-y-6">
              {/* PDF Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Generated PDF</h4>
                <div className="flex justify-center">
                  <div className="bg-white/50 rounded-lg p-8 border border-gray-300/50">
                    <div className="text-6xl mb-3">📄</div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{convertedFileName}</div>
                      <div className="text-sm text-gray-700">{files.length} page(s)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Download PDF</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-300/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📁</span>
                      <div>
                        <div className="font-medium text-gray-900">{convertedFileName}</div>
                        <div className="text-sm text-gray-700">Format: PDF</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold"
                    >
                      📥 Download PDF
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50"
                    >
                      🔄 Convert Another
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversion Details */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Conversion Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Source Format:</span>
                    <div className="font-medium text-gray-900">JPG/JPEG</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Output Format:</span>
                    <div className="font-medium text-gray-900">PDF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Images Combined:</span>
                    <div className="font-medium text-gray-900">{files.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Quality:</span>
                    <div className="font-medium text-gray-900">High Quality</div>
                  </div>
                </div>
              </div>
            </div>
          ) : files.length > 0 ? (
            <div className="space-y-6">
              {/* Images Preview */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Selected Images Preview</h4>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {files.map((file, index) => {
                    const url = URL.createObjectURL(file);
                    return (
                      <div key={index} className="bg-white/50 rounded-lg overflow-hidden border border-gray-300/50">
                        <img 
                          src={url} 
                          alt={file.name} 
                          className="h-20 w-full object-cover" 
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File Information */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">Format:</span>
                    <div className="font-medium text-gray-900">JPG/JPEG</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Target Format:</span>
                    <div className="font-medium text-gray-900">PDF</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Files Selected:</span>
                    <div className="font-medium text-gray-900">{files.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Total Size:</span>
                    <div className="font-medium text-gray-900">
                      {(files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready to Convert */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
                <div className="text-6xl mb-4">📷</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
                <p className="text-gray-700">
                  Your {files.length} JPG image{files.length > 1 ? 's are' : ' is'} ready to be combined into a PDF.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">📷</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Convert</h4>
              <p className="text-gray-700">
                Select JPG image files to start combining them into a PDF document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
