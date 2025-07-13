"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaRecycle, FaTrash, FaCamera, FaMapMarkerAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import WardCollection from '../../components/collector/WardCollection';
import WasteTypeToggle from '../../components/collector/WasteTypeToggle';
import ImageUploader from '../../components/collector/ImageUploader';
import GPSLocation from '../../components/collector/GPSLocation';
import Navigation from '../../components/Navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: string;
}

interface CollectionData {
  completedHouses: string[];
  completedWards: string[];
  wasteTypes: string[];
  image: File | null;
  segregationViolation: boolean;
  timestamp: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    captured: boolean;
  };
  remarks: string;
  wasteWeight: number;
}

export default function CollectorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<CollectionData>({
    completedHouses: [],
    completedWards: [],
    wasteTypes: [],
    image: null,
    segregationViolation: false,
    timestamp: new Date().toLocaleString(),
    location: {
      latitude: null,
      longitude: null,
      captured: false
    },
    remarks: '',
    wasteWeight: 0
  });

  // Load completed houses from localStorage on component mount
  useEffect(() => {
    const savedCompletedHouses = localStorage.getItem('completedHouses');
    if (savedCompletedHouses) {
      try {
        const parsed = JSON.parse(savedCompletedHouses);
        setCollectionData(prev => ({
          ...prev,
          completedHouses: parsed
        }));
      } catch (error) {
        console.error('Error parsing saved completed houses:', error);
      }
    }
  }, []);
  const [submitting, setSubmitting] = useState(false);
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
      
      if (user.role !== 'COLLECTOR' && user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleStartCollection = useCallback(() => {
    router.push('/collector');
  }, [router]);

  const updateCollectionData = useCallback((field: keyof CollectionData, value: string | string[] | File | null | boolean | number | { latitude: number | null; longitude: number | null; captured: boolean }) => {
    setCollectionData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleWardComplete = useCallback((wardName: string, completedHouseIds: string[]) => {
    setCollectionData(prev => ({
      ...prev,
      completedHouses: [...new Set([...prev.completedHouses, ...completedHouseIds])],
      completedWards: [...new Set([...prev.completedWards, wardName])]
    }));
  }, []);

  const handleHouseToggle = useCallback((houseId: string, isCompleted: boolean) => {
    setCollectionData(prev => {
      const newCompletedHouses = isCompleted 
        ? [...new Set([...prev.completedHouses, houseId])]
        : prev.completedHouses.filter(id => id !== houseId);
      
      // Save to localStorage
      localStorage.setItem('completedHouses', JSON.stringify(newCompletedHouses));
      
      return {
        ...prev,
        completedHouses: newCompletedHouses
      };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (confirm('Are you sure you want to clear all completed houses? This action cannot be undone.')) {
      setCollectionData(prev => ({
        ...prev,
        completedHouses: [],
        completedWards: []
      }));
      localStorage.removeItem('completedHouses');
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log current state
    console.log('Current collection data:', collectionData);
    
    // Validation
    if (collectionData.completedHouses.length === 0) {
      alert('Please select at least one house');
      return;
    }
    if (collectionData.wasteTypes.length === 0) {
      alert('Please select at least one waste type');
      return;
    }
    if (collectionData.wasteWeight < 0) {
      alert('Please enter a valid waste weight (cannot be negative)');
      return;
    }

    setSubmitting(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login again.');
        router.push('/login');
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...collectionData,
        image: collectionData.image ? {
          name: collectionData.image.name,
          type: collectionData.image.type,
          data: await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(collectionData.image!);
          })
        } : null
      };

      // Debug: Log the submission data
      console.log('Submitting collection data:', submissionData);

      // Submit to API
      const response = await fetch('/api/collector/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        const weightMessage = data.totalWeight > 0 ? ` Total weight: ${data.totalWeight} kgs` : '';
        alert(`Collection log submitted successfully!${weightMessage}`);
        
        // Mark houses as completed and save to localStorage
        const newCompletedHouses = [...new Set([...collectionData.completedHouses])];
        localStorage.setItem('completedHouses', JSON.stringify(newCompletedHouses));
        
        // Keep the completed houses but reset other form data
        setCollectionData(prev => ({
          completedHouses: newCompletedHouses, // Keep completed houses
          completedWards: [],
          wasteTypes: [],
          image: null,
          segregationViolation: false,
          timestamp: new Date().toLocaleString(),
          location: {
            latitude: null,
            longitude: null,
            captured: false
          },
          remarks: '',
          wasteWeight: 0
        }));
      } else {
        alert(data.error || 'Failed to submit collection log');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit collection log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [collectionData, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <span className="block mx-auto mb-4"><FaRecycle size={32} color="#16a34a" /></span>
          <p className="text-gray-600">Loading collector dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ward Collection</h1>
          <p className="text-gray-600">Select houses and wards, upload images, and submit collection data</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Ward Collection Component */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaMapMarkerAlt size={20} color="#16a34a" />
              <span className="ml-3">Ward & House Selection</span>
            </h2>
            <WardCollection
              completedHouses={collectionData.completedHouses}
              onHouseToggle={handleHouseToggle}
              onWardComplete={handleWardComplete}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Waste Type Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaTrash size={20} color="#16a34a" />
              <span className="ml-3">Waste Type Classification</span>
            </h2>
            <WasteTypeToggle
              selectedTypes={collectionData.wasteTypes}
              onChange={(types) => updateCollectionData('wasteTypes', types)}
            />
          </div>

          {/* Waste Weight */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaTrash size={20} color="#16a34a" />
              <span className="ml-3">Waste Weight</span>
            </h2>
            <div className="max-w-md">
              <label htmlFor="wasteWeight" className="block text-sm font-medium text-gray-700 mb-2">
                Total Waste Weight (in kgs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="wasteWeight"
                  min="0"
                  step="0.1"
                  value={collectionData.wasteWeight === 0 ? '' : collectionData.wasteWeight}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 0 : parseFloat(value);
                    const finalValue = isNaN(numValue) ? 0 : numValue;
                    console.log('Waste weight input:', { value, numValue, finalValue });
                    updateCollectionData('wasteWeight', finalValue);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter weight in kgs"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">kgs</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Enter the total weight of waste collected from all selected houses
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaCamera size={20} color="#16a34a" />
              <span className="ml-3">Image Upload</span>
            </h2>
            <ImageUploader
              image={collectionData.image}
              onChange={(file: File | null) => updateCollectionData('image', file)}
            />
          </div>

          {/* GPS Location */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaMapMarkerAlt size={20} color="#16a34a" />
              <span className="ml-3">GPS Location</span>
            </h2>
            <GPSLocation
              location={collectionData.location}
              onChange={(location: { latitude: number | null; longitude: number | null; captured: boolean }) => updateCollectionData('location', location)}
            />
          </div>

          {/* Segregation Violation */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaExclamationTriangle size={20} color="#dc2626" />
              <span className="ml-3">Segregation Violation</span>
            </h2>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="segregationViolation"
                checked={collectionData.segregationViolation}
                onChange={(e) => updateCollectionData('segregationViolation', e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="segregationViolation" className="text-gray-700 font-medium">
                Report segregation violation
              </label>
            </div>
            {collectionData.segregationViolation && (
              <div className="mt-4">
                <textarea
                  placeholder="Describe the segregation violation..."
                  value={collectionData.remarks}
                  onChange={(e) => updateCollectionData('remarks', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-3"><FaRecycle size={20} color="#ffffff" /></span>
                  Submitting...
                </>
              ) : (
                'Submit Collection Log'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 