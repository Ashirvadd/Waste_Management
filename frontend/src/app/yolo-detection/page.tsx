"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaRecycle, FaCamera, FaUpload, FaBrain, FaSpinner, FaCheck, FaTimes, FaDownload, FaEye, FaVideo, FaStop, FaPlay } from 'react-icons/fa';
import Navigation from '../../components/Navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: string;
}

interface DetectionResult {
  type: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  area: number;
}

interface DetectionResponse {
  success: boolean;
  detections: DetectionResult[];
  summary: Record<string, any>;
  total_detections: number;
  error?: string;
}

export default function YoloDetectionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<DetectionResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [streamlitStatus, setStreamlitStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setVideoReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check Streamlit app status
  useEffect(() => {
    const checkStreamlitStatus = async () => {
      try {
        const response = await fetch('http://localhost:8501', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        setStreamlitStatus('online');
      } catch (error) {
        setStreamlitStatus('offline');
      }
    };

    checkStreamlitStatus();
    const interval = setInterval(checkStreamlitStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setDetectionResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDetectWaste = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Convert image to blob
      const response = await fetch(imagePreview!);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, selectedImage.name);

      const detectResponse = await fetch('/api/ai/detect-waste', {
        method: 'POST',
        body: formData,
      });

      const data = await detectResponse.json();

      if (detectResponse.ok) {
        setDetectionResults(data);
      } else {
        setError(data.error || 'Detection failed');
      }
    } catch (error) {
      console.error('Detection error:', error);
      setError('Failed to detect waste. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDetectionResults(null);
    setError(null);
  };

  const openStreamlitApp = () => {
    if (streamlitStatus === 'online') {
      window.open('http://localhost:8501', '_blank');
    } else {
      // Try to start Streamlit if it's not running
      fetch('/api/start-streamlit', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setTimeout(() => {
              window.open('http://localhost:8501', '_blank');
            }, 3000); // Wait 3 seconds for Streamlit to start
          } else {
            alert('Failed to start Streamlit app. Please try again.');
          }
        })
        .catch(error => {
          console.error('Error starting Streamlit:', error);
          alert('Failed to start Streamlit app. Please check the backend.');
        });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      setVideoStream(stream);
      setShowCamera(true);
      setShowFileUpload(false);
      setShowUrlInput(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowCamera(false);
    setVideoReady(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(blob));
            setCapturedImage(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'url-image.jpg', { type: blob.type });
      handleImageSelect(file);
      setShowUrlInput(false);
      setImageUrl('');
    } catch (error) {
      alert('Failed to load image from URL. Please check the URL and try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <span className="block mx-auto mb-4"><FaRecycle size={32} color="#16a34a" /></span>
          <p className="text-gray-600">Loading waste classification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Waste Classification</h1>
          <p className="text-gray-600">AI-powered waste detection and classification using YOLOv8</p>
        </div>

        {/* Streamlit App Link */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaBrain size={24} color="#4f46e5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Advanced YOLOv8 Detection</h2>
                <p className="text-gray-600">Use our enhanced Streamlit app for real-time detection</p>
              </div>
            </div>
            <button
              onClick={openStreamlitApp}
              disabled={streamlitStatus !== 'online'}
              className={`px-6 py-3 rounded-lg font-medium transition flex items-center space-x-2 ${
                streamlitStatus === 'online'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              <FaBrain size={16} />
              <span>
                {streamlitStatus === 'online' && 'Open Streamlit App'}
                {streamlitStatus === 'offline' && 'App Offline'}
                {streamlitStatus === 'checking' && 'Checking...'}
              </span>
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              streamlitStatus === 'online' ? 'bg-green-500' :
              streamlitStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              Status: {streamlitStatus === 'online' ? 'Online' : 
                      streamlitStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Upload Image</h2>
          
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                setShowFileUpload(true);
                setShowCamera(false);
                setShowUrlInput(false);
              }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
            >
              <FaUpload size={24} color="#16a34a" />
              <p className="font-medium text-gray-800">Upload File</p>
            </button>
            
            <button
              onClick={startCamera}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
            >
              <FaCamera size={24} color="#16a34a" />
              <p className="font-medium text-gray-800">Use Camera</p>
            </button>
            
            <button
              onClick={() => {
                setShowUrlInput(true);
                setShowFileUpload(false);
                setShowCamera(false);
              }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
            >
              <FaDownload size={24} color="#16a34a" />
              <p className="font-medium text-gray-800">From URL</p>
            </button>
          </div>

          {/* File Upload */}
          {showFileUpload && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
              }`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FaUpload size={48} color="#16a34a" />
              <p className="text-lg font-medium text-gray-800 mb-2">
                Drop your image here or click to browse
              </p>
              <p className="text-gray-600 mb-4">Supports JPG, PNG, GIF up to 10MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Camera */}
          {showCamera && (
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                  onLoadedMetadata={() => setVideoReady(true)}
                />
                {isVideoReady && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                      onClick={captureImage}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <FaCamera size={16} />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      <FaStop size={16} />
                    </button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* URL Input */}
          {showUrlInput && (
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <div className="flex space-x-4">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleUrlSubmit}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Load Image
                </button>
              </div>
            </div>
          )}

          {/* Selected Image Preview */}
          {imagePreview && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Selected Image</h3>
                <button
                  onClick={handleClearImage}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
                <button
                  onClick={handleDetectWaste}
                  disabled={isDetecting}
                  className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isDetecting ? (
                    <FaSpinner size={16} className="animate-spin" />
                  ) : (
                    <FaBrain size={16} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detection Results */}
        {detectionResults && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Detection Results</h2>
            
            {detectionResults.success ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{detectionResults.total_detections}</p>
                      <p className="text-sm text-gray-600">Total Detections</p>
                    </div>
                    {Object.entries(detectionResults.summary).map(([type, data]: [string, any]) => (
                      <div key={type} className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{data.count}</p>
                        <p className="text-sm text-gray-600 capitalize">{type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Results */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Detections</h3>
                  <div className="space-y-3">
                    {detectionResults.detections.map((detection, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{detection.type}</p>
                            <p className="text-sm text-gray-600">
                              Confidence: {(detection.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Area: {detection.area}px²</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaTimes size={48} color="#dc2626" className="mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-800 mb-2">Detection Failed</p>
                <p className="text-gray-600">{detectionResults.error || 'No objects detected'}</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-center space-x-3">
              <FaTimes size={20} color="#dc2626" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 