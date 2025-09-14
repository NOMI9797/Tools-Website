'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFileUpload, FileUploadOptions } from '@/hooks/useFileUpload';
import { ChevronDownIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface FileUploadProps extends FileUploadOptions {
  className?: string;
  placeholder?: string;
  icon?: string;
  showFileInfo?: boolean;
  onFileChange?: (file: File | null) => void;
}

export default function FileUpload({
  className = '',
  placeholder = 'Choose Files',
  icon = '📁',
  showFileInfo = true,
  onFileChange,
  ...hookOptions
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const {
    fileInputRef,
    isDropdownOpen,
    setIsDropdownOpen,
    error,
    uploadSources,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    clearError
  } = useFileUpload({
    ...hookOptions,
    onFileSelect: (file) => {
      setSelectedFile(file);
      onFileChange?.(file);
      clearError();
    },
    onError: (error) => {
      console.error('File upload error:', error);
    }
  });


  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearError();
  };

  // Update button position when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [isDropdownOpen]);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className={`space-y-4 relative ${className}`}>
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center hover:border-gray-500 transition-all duration-200 cursor-pointer group bg-white/50 backdrop-blur-sm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept={hookOptions.allowedMimeTypes?.join(',')}
        />
        
        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        
        <div 
          className="relative inline-block" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            ref={buttonRef}
            type="button"
            className={`bg-gray-900 text-white px-8 py-3 font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 mx-auto min-w-[200px] ${isDropdownOpen ? 'rounded-t-lg rounded-b-none' : 'rounded-lg'}`}
          >
            {placeholder}
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* File Info */}
      {selectedFile && showFileInfo && (
        <div className="p-4 bg-gray-100/80 border border-gray-300/50 rounded-xl backdrop-blur-sm relative z-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{selectedFile.name}</div>
              <div className="text-sm text-gray-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <button 
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative z-0" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Portal Dropdown - Rendered at document body level */}
      {isDropdownOpen && buttonRect && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed z-[99999] pointer-events-none"
          style={{
            top: buttonRect.bottom + window.scrollY,
            left: buttonRect.left + window.scrollX,
            width: buttonRect.width,
          }}
        >
          <div 
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-b-lg shadow-2xl border border-gray-700/30 border-t-0 overflow-hidden pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="py-2">
              {uploadSources.map((source) => (
                <button
                  key={source.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    source.action();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-150 flex items-center gap-3 text-gray-300 hover:text-white border-b border-gray-700/30 last:border-b-0"
                >
                  <span className="text-xl flex-shrink-0">{source.icon}</span>
                  <span className="font-medium whitespace-nowrap">{source.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
