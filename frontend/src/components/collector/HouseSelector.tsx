"use client";
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface HouseSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const mockHouses = [
  // Malleshwaram Area - Bangalore
  { id: 'house-101', name: 'House 101', address: '15th Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-102', name: 'House 102', address: '8th Main Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-103', name: 'House 103', address: 'Sampige Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-104', name: 'House 104', address: 'Margosa Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-105', name: 'House 105', address: 'Link Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-106', name: 'House 106', address: '10th Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-107', name: 'House 107', address: '12th Main Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-108', name: 'House 108', address: '14th Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-109', name: 'House 109', address: '16th Main Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-110', name: 'House 110', address: '18th Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-111', name: 'House 111', address: '20th Main Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-112', name: 'House 112', address: '22nd Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-113', name: 'House 113', address: '24th Main Road, Malleshwaram, Bangalore - 560003' },
  { id: 'house-114', name: 'House 114', address: '26th Cross, Malleshwaram, Bangalore - 560003' },
  { id: 'house-115', name: 'House 115', address: '28th Main Road, Malleshwaram, Bangalore - 560003' },
  // Additional areas in Bangalore
  { id: 'house-201', name: 'House 201', address: 'Indiranagar 1st Stage, Bangalore - 560038' },
  { id: 'house-202', name: 'House 202', address: 'Koramangala 1st Block, Bangalore - 560034' },
  { id: 'house-203', name: 'House 203', address: 'JP Nagar 1st Phase, Bangalore - 560078' },
  { id: 'house-204', name: 'House 204', address: 'HSR Layout Sector 1, Bangalore - 560102' },
  { id: 'house-205', name: 'House 205', address: 'Whitefield Main Road, Bangalore - 560066' },
];

export default function HouseSelector({ value, onChange }: HouseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedHouse = mockHouses.find(house => house.id === value);
  const filteredHouses = mockHouses.filter(house =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (houseId: string) => {
    onChange(houseId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search or Select House (Bangalore addresses)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2"><FaSearch size={16} color="#6b7280" /></span>
      </div>

      {/* Selected House Display */}
      {selectedHouse && !isOpen && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium text-green-800">{selectedHouse.name}</p>
          <p className="text-sm text-green-600">{selectedHouse.address}</p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredHouses.length > 0 ? (
            filteredHouses.map((house) => (
              <button
                key={house.id}
                onClick={() => handleSelect(house.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                  value === house.id ? 'bg-green-50 text-green-800' : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{house.name}</div>
                <div className="text-sm text-gray-500">{house.address}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              No houses found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
} 