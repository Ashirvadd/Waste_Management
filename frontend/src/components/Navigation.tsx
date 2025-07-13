'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaRecycle, FaSignOutAlt, FaHome, FaPlus, FaBars, FaTimes, FaBrain, FaMicrophone } from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
}

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const isActivePage = (pagePath: string) => {
    return pathname === pagePath;
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/collector':
        return 'New Collection';
      case '/yolo-detection':
        return 'Waste Classification';
      case '/voice-logging':
        return 'Voice Logging';
      default:
        return 'Waste Samaritan';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl text-green-600">
              <FaRecycle size={24} color="#16a34a" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Waste Samaritan</h1>
              <p className="text-sm text-gray-600">{getPageTitle()}</p>
            </div>
          </div>
          
          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                isActivePage('/dashboard')
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50'
              }`}
            >
              <FaHome size={16} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/collector"
              className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                isActivePage('/collector')
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50'
              }`}
            >
              <FaPlus size={16} />
              <span>New Collection</span>
            </Link>
            <Link
              href="/yolo-detection"
              className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                isActivePage('/yolo-detection')
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50'
              }`}
            >
              <FaBrain size={16} />
              <span>Waste Classification</span>
            </Link>
            <Link
              href="/voice-logging"
              className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                isActivePage('/voice-logging')
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50'
              }`}
            >
              <FaMicrophone size={16} />
              <span>Voice Logging</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-600">{user.role}</p>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-800 transition"
            >
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                  isActivePage('/dashboard')
                    ? 'bg-green-600 text-white'
                    : 'text-green-700 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                <FaHome size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/collector"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                  isActivePage('/collector')
                    ? 'bg-green-600 text-white'
                    : 'text-green-700 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                <FaPlus size={16} />
                <span>New Collection</span>
              </Link>
              <Link
                href="/yolo-detection"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                  isActivePage('/yolo-detection')
                    ? 'bg-green-600 text-white'
                    : 'text-green-700 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                <FaBrain size={16} />
                <span>Waste Classification</span>
              </Link>
              <Link
                href="/voice-logging"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium transition rounded-lg ${
                  isActivePage('/voice-logging')
                    ? 'bg-green-600 text-white'
                    : 'text-green-700 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                <FaMicrophone size={16} />
                <span>Voice Logging</span>
              </Link>
              <div className="px-4 py-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-600">{user.role}</p>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 