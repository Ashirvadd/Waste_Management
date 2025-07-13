"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

interface Location {
  latitude: number | null;
  longitude: number | null;
  captured: boolean;
}

interface GPSLocationProps {
  location: Location;
  onChange: (location: Location) => void;
}

export default function GPSLocation({ location, onChange }: GPSLocationProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsCapturing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          captured: true
        };
        onChange(newLocation);
        setIsCapturing(false);
      },
      (error) => {
        let errorMessage = 'Unable to capture location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setIsCapturing(false);
        onChange({
          latitude: null,
          longitude: null,
          captured: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [onChange]);

  useEffect(() => {
    // Auto-capture location when component mounts
    captureLocation();
  }, [captureLocation]);

  const retryCapture = () => {
    captureLocation();
  };

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          {isCapturing ? (
            <span className="animate-spin"><FaSpinner size={16} color="#2563eb" /></span>
          ) : location.captured ? (
            <FaCheckCircle size={16} color="#16a34a" />
          ) : (
            <FaTimesCircle size={16} color="#dc2626" />
          )}
          <div>
            <p className="font-medium text-gray-800">
              {isCapturing 
                ? 'Capturing location...' 
                : location.captured 
                  ? 'Location captured ✅' 
                  : 'Unable to capture ❌'
              }
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>
        {!isCapturing && !location.captured && (
          <button
            type="button"
            onClick={retryCapture}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        )}
      </div>

      {/* Coordinates Display */}
      {location.captured && location.latitude && location.longitude && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="mr-1"><FaMapMarkerAlt size={16} color="#16a34a" /></span>
              <span className="font-medium text-green-800">Latitude</span>
            </div>
            <p className="text-lg font-mono text-green-700">
              {location.latitude.toFixed(6)}°
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="mr-1"><FaMapMarkerAlt size={16} color="#16a34a" /></span>
              <span className="font-medium text-green-800">Longitude</span>
            </div>
            <p className="text-lg font-mono text-green-700">
              {location.longitude.toFixed(6)}°
            </p>
          </div>
        </div>
      )}

      {/* Manual Capture Button */}
      {!isCapturing && (
        <div className="text-center">
          <button
            type="button"
            onClick={captureLocation}
            disabled={isCapturing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <span className="inline mr-2"><FaMapMarkerAlt size={16} color="#16a34a" /></span>
            {location.captured ? 'Recapture Location' : 'Capture Location'}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium text-blue-800 mb-1">Location Information:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Location is automatically captured when the page loads</li>
          <li>High accuracy GPS is used for precise coordinates</li>
          <li>Location data is stored locally and sent with your submission</li>
          <li>You can recapture location if needed</li>
        </ul>
      </div>
    </div>
  );
} 