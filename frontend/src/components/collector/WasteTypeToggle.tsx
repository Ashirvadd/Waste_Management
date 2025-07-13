"use client";
import { FaRecycle, FaLeaf, FaExclamationTriangle } from 'react-icons/fa';

interface WasteTypeToggleProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
}

const wasteTypes = [
  {
    id: 'wet',
    name: 'Wet Waste',
    description: 'Organic waste, food scraps, etc.',
    icon: FaLeaf,
    color: 'green',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    bgLight: 'bg-green-50',
    bgIcon: 'bg-green-100',
    textColor: 'text-green-800',
    textLight: 'text-green-600',
    textDark: 'text-green-700'
  },
  {
    id: 'dry',
    name: 'Dry Waste',
    description: 'Recyclable materials, paper, plastic, etc.',
    icon: FaRecycle,
    color: 'brown',
    bgColor: 'bg-amber-600',
    borderColor: 'border-amber-600',
    bgLight: 'bg-amber-50',
    bgIcon: 'bg-amber-100',
    textColor: 'text-amber-800',
    textLight: 'text-amber-600',
    textDark: 'text-amber-700'
  },
  {
    id: 'reject',
    name: 'Reject Waste',
    description: 'Non-recyclable, hazardous waste, etc.',
    icon: FaExclamationTriangle,
    color: 'red',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    bgLight: 'bg-red-50',
    bgIcon: 'bg-red-100',
    textColor: 'text-red-800',
    textLight: 'text-red-600',
    textDark: 'text-red-700'
  }
];

export default function WasteTypeToggle({ selectedTypes, onChange }: WasteTypeToggleProps) {
  const handleToggle = (typeId: string) => {
    const newSelectedTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onChange(newSelectedTypes);
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {wasteTypes.map((type) => {
        const IconComponent = type.icon;
        const isSelected = selectedTypes.includes(type.id);
        
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => handleToggle(type.id)}
            className={`p-4 border-2 rounded-lg transition-all duration-200 ${
              isSelected
                ? `${type.borderColor} ${type.bgLight}`
                : `${type.borderColor} ${type.bgLight} opacity-60 hover:opacity-100`
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected ? type.bgIcon : type.bgIcon
              }`}>
                <IconComponent size={20} color={type.color} />
              </div>
              <div className="text-left">
                <h4 className={`font-semibold ${isSelected ? type.textColor : type.textColor}`}>{type.name}</h4>
                <p className={`text-sm ${isSelected ? type.textLight : type.textLight}`}>{type.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? type.textDark : type.textDark}`}>{isSelected ? 'Selected' : 'Not Selected'}</span>
              <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? `${type.bgColor} ${type.borderColor}` : `${type.borderColor} bg-white`}`}>{isSelected && (
                <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
} 