import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MapPin, 
  Home, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Award,
  Clock,
  BarChart3
} from 'lucide-react'
import { getDashboardOverview, getTopPerformers } from '../../api'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    topPerformers: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [overviewData, topPerformersData] = await Promise.all([
        getDashboardOverview(),
        getTopPerformers()
      ])
      
      setDashboardData({
        overview: overviewData,
        topPerformers: topPerformersData
      })
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor waste management system performance</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const overview = dashboardData.overview || {}
  const topPerformers = dashboardData.topPerformers || {}

  const stats = [
    {
      name: 'Total Users',
      value: overview.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Wards',
      value: overview.totalWards || 0,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Houses',
      value: overview.totalHouses || 0,
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Total Conflicts',
      value: overview.totalConflicts || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor waste management system performance</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card">
          <div className="card-body">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={fetchDashboardData}
                    className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Conflicts */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Pending Conflicts</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{overview.pendingConflicts || 0}</p>
              <p className="text-sm text-gray-500">Open conflicts</p>
            </div>
          </div>
        </div>

        {/* Completed Houses */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Completed Houses</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{overview.completedHouses || 0}</p>
              <p className="text-sm text-gray-500">Collected</p>
            </div>
          </div>
        </div>

        {/* Pending Houses */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Pending Houses</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{overview.pendingHouses || 0}</p>
              <p className="text-sm text-gray-500">Awaiting collection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Top Collectors</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Houses Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Houses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPerformers.collectors?.map((collector) => {
                  const successRate = collector.totalHouses > 0 
                    ? Math.round((collector.housesCollected / collector.totalHouses) * 100)
                    : 0
                  return (
                    <tr key={collector.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{collector.name}</div>
                        <div className="text-sm text-gray-500">{collector.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{collector.housesCollected}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{collector.totalHouses}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${successRate >= 80 ? 'text-green-600' : successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {successRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {(!topPerformers.collectors || topPerformers.collectors.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">No collector data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 