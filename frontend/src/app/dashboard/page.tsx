"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaRecycle, FaUser, FaChartBar, FaMapMarkerAlt, FaClock, FaTrash, FaPlus, FaBrain, FaMicrophone } from 'react-icons/fa';
import Navigation from '../../components/Navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: string;
}

interface DashboardStats {
  todayCollections: number;
  totalCollections: number;
  violations: number;
  efficiency: string;
  todayWeight: number;
  totalWeight: number;
  weightChange: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
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

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/collector/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch stats');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user && (user.role === 'COLLECTOR' || user.role === 'ADMIN')) {
      fetchStats();
    } else {
      setStatsLoading(false);
    }
  }, [user]);

  const handleStartCollection = () => {
    console.log('handleStartCollection called - navigating to /collector');
    try {
      router.push('/collector');
      console.log('Navigation initiated');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try window.location
      window.location.href = '/collector';
    }
  }

  const testNavigation = () => {
    console.log('Testing navigation...');
    router.push('/collector');
  };

  const handleViewRoute = () => {
    // TODO: Implement route view functionality
    alert('Route view feature coming soon!');
  };

  const handleViewReports = () => {
    // TODO: Implement reports view functionality
    alert('Reports feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl text-green-600 mx-auto mb-4 animate-spin"><FaRecycle size={32} color="#16a34a" /></span>
          <p className="text-gray-600">Loading dashboard...</p>
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
        {/* Welcome Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-green-600"><FaUser size={24} color="#16a34a" /></span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}!</h2>
              <p className="text-gray-600">Here&apos;s your waste collection overview for today</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Collections</p>
                <p className="text-3xl font-bold text-green-600">
                  {statsLoading ? '...' : (stats?.todayCollections || 0)}
                </p>
              </div>
              <span className="text-2xl text-green-500"><FaTrash size={24} color="#16a34a" /></span>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500">Total: {stats?.totalCollections || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Weight</p>
                <p className="text-3xl font-bold text-blue-600">
                  {statsLoading ? '...' : `${(stats?.todayWeight || 0).toFixed(1)} kg`}
                </p>
              </div>
              <span className="text-2xl text-blue-500"><FaChartBar size={24} color="#2563eb" /></span>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                {stats?.weightChange && parseFloat(stats.weightChange) > 0 ? (
                  <span className="text-blue-500">↑ {stats.weightChange}%</span>
                ) : stats?.weightChange && parseFloat(stats.weightChange) < 0 ? (
                  <span className="text-red-500">↓ {Math.abs(parseFloat(stats.weightChange))}%</span>
                ) : (
                  <span className="text-gray-500">No change</span>
                )}
                <span className="ml-1">from yesterday</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Route Progress</p>
                <p className="text-3xl font-bold text-purple-600">75%</p>
              </div>
              <span className="text-2xl text-purple-500"><FaMapMarkerAlt size={24} color="#7c3aed" /></span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Weight</p>
                <p className="text-3xl font-bold text-purple-600">
                  {statsLoading ? '...' : `${(stats?.totalWeight || 0).toFixed(1)} kg`}
                </p>
              </div>
              <span className="text-2xl text-purple-500"><FaChartBar size={24} color="#7c3aed" /></span>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>All time collected</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-3xl font-bold text-orange-600">
                  {statsLoading ? '...' : `${stats?.efficiency || 100}%`}
                </p>
              </div>
              <span className="text-2xl text-orange-500"><FaRecycle size={24} color="#ea580c" /></span>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>Violations: {stats?.violations || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handleStartCollection}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                <FaPlus size={24} color="#16a34a" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Start Collection</h3>
                <p className="text-gray-600">Begin new waste collection round</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/yolo-detection')}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
                <span className="text-indigo-600"><FaBrain size={20} color="#4f46e5" /></span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Classify Waste</h3>
                <p className="text-gray-600">Use AI to identify waste types</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/voice-logging')}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                <FaMicrophone size={20} color="#7c3aed" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Voice Logging</h3>
                <p className="text-gray-600">Record voice notes and translate</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Collections */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Collections</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FaTrash size={16} color="#16a34a" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">House #123 - Ward 5</p>
                  <p className="text-sm text-gray-600">Mixed waste • 2.5 kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">10:30 AM</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaRecycle size={16} color="#2563eb" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">House #456 - Ward 3</p>
                  <p className="text-sm text-gray-600">Recyclable • 1.8 kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">09:15 AM</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <FaTrash size={16} color="#ea580c" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">House #789 - Ward 7</p>
                  <p className="text-sm text-gray-600">Organic waste • 3.2 kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">08:45 AM</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 