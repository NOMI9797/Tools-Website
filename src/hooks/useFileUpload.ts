import { useState, useRef, useCallback } from 'react';

export interface FileUploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
}

export interface UploadSource {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const {
    maxFileSize = 100 * 1024 * 1024, // 100MB default
    allowedMimeTypes = [],
    allowedExtensions = [],
    onFileSelect,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size exceeds the limit of ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB.`;
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    // Check MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      const errorMsg = 'Invalid file type. Please select a supported file format.';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        const errorMsg = 'Invalid file extension. Please select a supported file format.';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    }

    setError(null);
    return true;
  }, [maxFileSize, allowedMimeTypes, allowedExtensions, onError]);

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect?.(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDeviceUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDropboxUpload = useCallback(() => {
    // TODO: Implement Dropbox integration
    console.log('Dropbox upload clicked');
    onError?.('Dropbox integration coming soon!');
  }, [onError]);

  const handleGoogleDriveUpload = useCallback(() => {
    // TODO: Implement Google Drive integration
    console.log('Google Drive upload clicked');
    onError?.('Google Drive integration coming soon!');
  }, [onError]);

  const handleOneDriveUpload = useCallback(() => {
    // TODO: Implement OneDrive integration
    console.log('OneDrive upload clicked');
    onError?.('OneDrive integration coming soon!');
  }, [onError]);

  const uploadSources: UploadSource[] = [
    {
      id: 'device',
      label: 'From Device',
      icon: '💻',
      action: handleDeviceUpload
    },
    {
      id: 'dropbox',
      label: 'From Dropbox',
      icon: '📦',
      action: handleDropboxUpload
    },
    {
      id: 'google-drive',
      label: 'From Google Drive',
      icon: '☁️',
      action: handleGoogleDriveUpload
    },
    {
      id: 'onedrive',
      label: 'From OneDrive',
      icon: '📁',
      action: handleOneDriveUpload
    }
  ];

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fileInputRef,
    isDropdownOpen,
    setIsDropdownOpen,
    error,
    uploadSources,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    toggleDropdown,
    clearError,
    validateFile
  };
};
