"use client";
import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaMapMarkerAlt, FaHome, FaClipboardCheck } from 'react-icons/fa';

interface House {
  id: string;
  name: string;
  address: string;
  ward: string;
}

interface WardCollectionProps {
  completedHouses?: string[];
  onWardComplete?: (wardName: string, completedHouses: string[]) => void;
  onHouseToggle?: (houseId: string, isCompleted: boolean) => void;
  onClearAll?: () => void;
}

// Mock data organized by wards
const mockWards = {
  "Malleshwaram Ward": [
    { id: 'house-101', name: 'House 101', address: '15th Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-102', name: 'House 102', address: '8th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-103', name: 'House 103', address: 'Sampige Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-104', name: 'House 104', address: 'Margosa Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-105', name: 'House 105', address: 'Link Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-106', name: 'House 106', address: '10th Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-107', name: 'House 107', address: '12th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-108', name: 'House 108', address: '14th Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-109', name: 'House 109', address: '16th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-110', name: 'House 110', address: '18th Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-111', name: 'House 111', address: '20th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-112', name: 'House 112', address: '22nd Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-113', name: 'House 113', address: '24th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-114', name: 'House 114', address: '26th Cross, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
    { id: 'house-115', name: 'House 115', address: '28th Main Road, Malleshwaram, Bangalore - 560003', ward: 'Malleshwaram Ward' },
  ],
  "Indiranagar Ward": [
    { id: 'house-201', name: 'House 201', address: 'Indiranagar 1st Stage, Bangalore - 560038', ward: 'Indiranagar Ward' },
    { id: 'house-202', name: 'House 202', address: 'Koramangala 1st Block, Bangalore - 560034', ward: 'Indiranagar Ward' },
    { id: 'house-203', name: 'House 203', address: 'JP Nagar 1st Phase, Bangalore - 560078', ward: 'Indiranagar Ward' },
    { id: 'house-204', name: 'House 204', address: 'HSR Layout Sector 1, Bangalore - 560102', ward: 'Indiranagar Ward' },
    { id: 'house-205', name: 'House 205', address: 'Whitefield Main Road, Bangalore - 560066', ward: 'Indiranagar Ward' },
  ]
};

export default function WardCollection({ completedHouses: initialCompletedHouses = [], onWardComplete, onHouseToggle, onClearAll }: WardCollectionProps) {
  const [completedHouses, setCompletedHouses] = useState<Set<string>>(new Set(initialCompletedHouses));
  const [completedWards, setCompletedWards] = useState<Set<string>>(new Set());

  // Sync local state with props
  useEffect(() => {
    setCompletedHouses(new Set(initialCompletedHouses));
  }, [initialCompletedHouses]);

  // Check if a ward is complete
  const isWardComplete = (wardName: string) => {
    const wardHouses = mockWards[wardName as keyof typeof mockWards] || [];
    return wardHouses.every(house => completedHouses.has(house.id));
  };

  // Get completion percentage for a ward
  const getWardProgress = (wardName: string) => {
    const wardHouses = mockWards[wardName as keyof typeof mockWards] || [];
    if (wardHouses.length === 0) return 0;
    const completed = wardHouses.filter(house => completedHouses.has(house.id)).length;
    return Math.round((completed / wardHouses.length) * 100);
  };

  // Handle house toggle
  const handleHouseToggle = (houseId: string) => {
    const newCompletedHouses = new Set(completedHouses);
    const isCurrentlyCompleted = newCompletedHouses.has(houseId);
    
    if (isCurrentlyCompleted) {
      newCompletedHouses.delete(houseId);
    } else {
      newCompletedHouses.add(houseId);
    }
    setCompletedHouses(newCompletedHouses);

    // Call the parent callback
    onHouseToggle?.(houseId, !isCurrentlyCompleted);

    // Check if any ward is now complete
    Object.keys(mockWards).forEach(wardName => {
      if (isWardComplete(wardName) && !completedWards.has(wardName)) {
        const wardHouses = mockWards[wardName as keyof typeof mockWards];
        const completedHouseIds = wardHouses.map(house => house.id);
        setCompletedWards(prev => new Set([...prev, wardName]));
        onWardComplete?.(wardName, completedHouseIds);
      }
    });
  };

  // Handle ward toggle (toggle all houses in ward)
  const handleWardToggle = (wardName: string) => {
    const wardHouses = mockWards[wardName as keyof typeof mockWards] || [];
    const newCompletedHouses = new Set(completedHouses);
    
    if (isWardComplete(wardName)) {
      // Uncheck all houses in ward
      wardHouses.forEach(house => {
        newCompletedHouses.delete(house.id);
        onHouseToggle?.(house.id, false);
      });
      setCompletedWards(prev => {
        const newSet = new Set(prev);
        newSet.delete(wardName);
        return newSet;
      });
    } else {
      // Check all houses in ward
      wardHouses.forEach(house => {
        newCompletedHouses.add(house.id);
        onHouseToggle?.(house.id, true);
      });
      setCompletedWards(prev => new Set([...prev, wardName]));
      onWardComplete?.(wardName, wardHouses.map(house => house.id));
    }
    
    setCompletedHouses(newCompletedHouses);
  };

  return (
    <div className="space-y-6">
      {Object.entries(mockWards).map(([wardName, houses]) => {
        const isComplete = isWardComplete(wardName);
        const progress = getWardProgress(wardName);
        const completedCount = houses.filter(house => completedHouses.has(house.id)).length;
        
        return (
          <div key={wardName} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Ward Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl text-green-600">
                    <FaMapMarkerAlt size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{wardName}</h3>
                    <p className="text-sm text-gray-600">
                      {completedCount} of {houses.length} houses completed
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Progress Bar */}
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Ward Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleWardToggle(wardName)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isComplete
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isComplete ? (
                      <>
                        <FaCheck size={14} />
                        <span>Complete</span>
                      </>
                    ) : (
                      <>
                        <FaClipboardCheck size={14} />
                        <span>Mark All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Houses List */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {houses.map((house) => {
                  const isHouseComplete = completedHouses.has(house.id);
                  
                  return (
                    <div
                      key={house.id}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isHouseComplete
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleHouseToggle(house.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isHouseComplete
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-400'
                        }`}>
                          {isHouseComplete && (
                            <FaCheck size={10} color="white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${
                            isHouseComplete ? 'text-green-800' : 'text-gray-800'
                          }`}>
                            {house.name}
                          </p>
                          <p className={`text-xs ${
                            isHouseComplete ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {house.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ward Status */}
            {isComplete && (
              <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <FaCheck size={16} color="#16a34a" />
                  <span className="font-medium">Ward collection completed!</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaHome size={16} color="#2563eb" />
            <span className="font-medium text-blue-800">Collection Summary</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-blue-600">
                {completedHouses.size} houses completed
              </p>
              <p className="text-sm text-blue-600">
                {completedWards.size} wards completed
              </p>
            </div>
            {completedHouses.size > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 