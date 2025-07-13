"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { FaCamera, FaUpload, FaTimes, FaVideo, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import Image from 'next/image';

interface ImageUploaderProps {
  image: File | null;
  onChange: (file: File | null) => void;
}

export default function ImageUploader({ image, onChange }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>('');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Memoize handlers to prevent unnecessary re-renders
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onChange(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    // Silently ignore invalid files without showing alert
  }, [onChange]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(() => {
    onChange(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, previewUrl]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openCamera = useCallback(async (liveMode = false) => {
    try {
      setCameraStatus('Opening camera...');
      setIsVideoReady(false);
      setIsLiveMode(liveMode);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
        setShowLivePreview(liveMode);
        
        console.log('Video element set up, waiting for metadata...');
        
        // Set up video event handlers
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          setCameraStatus('Starting video...');
          video.play().then(() => {
            console.log('Video started playing successfully');
            setCameraStatus('Camera active');
            setIsVideoReady(true);
          }).catch((error) => {
            console.error('Failed to play video:', error);
            setCameraStatus('Failed to start video');
          });
        };

        const handleCanPlay = () => {
          console.log('Video can play');
        };

        const handlePlay = () => {
          console.log('Video play event fired');
          setCameraStatus('Camera active');
          setIsVideoReady(true);
        };

        const handleError = (e: Event) => {
          console.error('Video error:', e);
          setCameraStatus('Camera error');
        };

        // Remove existing listeners to prevent duplicates
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);

        // Add new listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('play', handlePlay);
        video.addEventListener('error', handleError);
        
        // Force load if metadata is already available
        if (video.readyState >= 1) {
          console.log('Video already has metadata, triggering play');
          handleLoadedMetadata();
        }
      } else {
        console.error('Video ref is null');
        setCameraStatus('Video element not found');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraStatus('Camera access denied');
      // Remove alert - let user see the status message instead
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCapturing(false);
    setCameraStatus('');
    setIsVideoReady(false);
    setShowLivePreview(false);
    setIsLiveMode(false);
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && streamRef.current && isVideoReady) {
      setIsCapturing(true);
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `waste-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelect(file);
            if (!isLiveMode) {
              closeCamera();
            }
          }
          setIsCapturing(false);
        }, 'image/jpeg', 0.9);
      }
    }
  }, [handleFileSelect, closeCamera, isVideoReady, isLiveMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Live Camera Preview */}
      {showLivePreview && isCameraOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaVideo size={16} color="#16a34a" />
              <span className="font-medium text-gray-800">Live Camera Feed</span>
              {cameraStatus && (
                <span className="text-sm text-green-600">• {cameraStatus}</span>
              )}
            </div>
            <button
              type="button"
              onClick={closeCamera}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <FaStop size={16} />
            </button>
          </div>
          
          <div className="relative">
            {/* Video Container */}
            <div className="w-full h-80 bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="w-full h-full object-cover"
                style={{ 
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: 'black',
                  transform: 'scaleX(-1)' // Mirror the video for better UX
                }}
                onLoadedData={() => {
                  console.log('Video data loaded');
                  if (videoRef.current && videoRef.current.readyState >= 2) {
                    setCameraStatus('Camera active');
                    setIsVideoReady(true);
                  }
                }}
              />
              
              {/* Loading overlay */}
              {!isVideoReady && cameraStatus !== 'Camera error' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>{cameraStatus}</p>
                  </div>
                </div>
              )}
              
              {/* Error overlay */}
              {cameraStatus === 'Camera error' && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-center">
                    <p>Camera feed not available</p>
                    <p className="text-sm mt-1">Please check camera permissions</p>
                  </div>
                </div>
              )}
              
              {/* Capture overlay */}
              {isVideoReady && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                    Live Preview
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <button
                      onClick={captureImage}
                      disabled={isCapturing}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <FaCamera size={18} />
                      <span>{isCapturing ? 'Capturing...' : 'Capture Image'}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Debug overlay - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm text-xs">
                  <div>Ready: {isVideoReady ? 'Yes' : 'No'}</div>
                  <div>Status: {cameraStatus}</div>
                  {videoRef.current && (
                    <div>State: {videoRef.current.readyState}</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <p>Position the waste in the camera view and click "Capture Image"</p>
          </div>
        </div>
      )}

      {/* Camera Modal (for non-live mode) */}
      {isCameraOpen && !showLivePreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Capture Waste Image</h3>
              <p className="text-sm text-gray-600">Position the waste in the camera view</p>
            </div>
            
            <div className="relative">
              {/* Video Container */}
              <div className="w-full h-64 bg-black rounded-lg overflow-hidden relative video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-full object-cover"
                  style={{ 
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: 'black',
                    transform: 'scaleX(-1)' // Mirror the video for better UX
                  }}
                  onLoadedData={() => {
                    console.log('Modal video data loaded');
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                      setCameraStatus('Camera active');
                      setIsVideoReady(true);
                    }
                  }}
                />
                
                {/* Loading overlay - only show when not ready */}
                {!isVideoReady && cameraStatus !== 'Camera error' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>{cameraStatus}</p>
                    </div>
                  </div>
                )}
                
                {/* Error overlay */}
                {cameraStatus === 'Camera error' && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div className="text-white text-center">
                      <p>Camera feed not available</p>
                      <p className="text-sm mt-1">Please check camera permissions</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Camera Status - only show when not ready */}
              {!isVideoReady && cameraStatus && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">{cameraStatus}</p>
                </div>
              )}
              
              {/* Camera Controls */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={captureImage}
                  disabled={isCapturing || !isVideoReady}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaCamera size={16} />
                  <span>{isCapturing ? 'Capturing...' : 'Capture'}</span>
                </button>
                
                <button
                  onClick={closeCamera}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaStop size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!image && !showLivePreview && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragOver
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FaCamera size={24} color="#6b7280" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragOver ? 'Drop image here' : 'Upload or capture waste image'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PNG, JPG, JPEG up to 10MB
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={openFileDialog}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <span className="inline mr-2"><FaUpload size={16} color="#fff" /></span>
                Choose File
              </button>
              
              <button
                type="button"
                onClick={() => openCamera(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <span className="inline mr-2"><FaCamera size={16} color="#fff" /></span>
                Quick Capture
              </button>
              
              <button
                type="button"
                onClick={() => openCamera(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <span className="inline mr-2"><FaVideo size={16} color="#fff" /></span>
                Live Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {image && previewUrl && (
        <div className="relative">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FaCamera size={16} color="#16a34a" />
                <span className="font-medium text-gray-800">Selected Image</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <FaTimes size={16} color="#dc2626" />
              </button>
            </div>
            <div className="relative">
              <Image
                src={previewUrl}
                alt="Waste preview"
                width={400}
                height={267}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {image.name}
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Type: {image.type}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 