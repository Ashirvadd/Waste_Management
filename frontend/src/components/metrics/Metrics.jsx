import React, { useState, useEffect } from 'react'
import { 
  getCollectorPerformance, 
  getWardPerformance 
} from '../../api'

const Metrics = () => {
  const [metrics, setMetrics] = useState({
    collectorPerformance: null,
    wardPerformance: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch all metrics data
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [
        collectorPerformance,
        wardPerformance
      ] = await Promise.all([
        getCollectorPerformance(),
        getWardPerformance()
      ])
      
      setMetrics({
        collectorPerformance,
        wardPerformance
      })
    } catch (err) {
      setError('Failed to fetch metrics. Please try again.')
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate success rate for collector
  const calculateSuccessRate = (housesCollected, totalHouses) => {
    if (totalHouses === 0) return 0
    return Math.round((housesCollected / totalHouses) * 100)
  }

  // Calculate compliance rate for ward
  const calculateComplianceRate = (housesCollected, totalHouses) => {
    if (totalHouses === 0) return 0
    return Math.round((housesCollected / totalHouses) * 100)
  }

  // Initial data fetch
  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>
          <p className="text-gray-600">Detailed analytics and performance metrics</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading metrics...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>
        <p className="text-gray-600">Detailed analytics and performance metrics</p>
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
                    onClick={fetchMetrics}
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

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-body">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'collectors', name: 'Collector Performance' },
                { id: 'wards', name: 'Ward Performance' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Collectors */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Collectors</h3>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.collectorPerformance?.collectors?.length || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Currently active in the system
              </p>
            </div>
          </div>

          {/* Total Wards */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Wards</h3>
              <div className="text-3xl font-bold text-purple-600">
                {metrics.wardPerformance?.wards?.length || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Under management
              </p>
            </div>
          </div>

          {/* Average Performance */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Performance</h3>
              <div className="text-3xl font-bold text-green-600">
                {metrics.collectorPerformance?.collectors?.length > 0 
                  ? Math.round(metrics.collectorPerformance.collectors.reduce((sum, collector) => {
                      const successRate = calculateSuccessRate(collector.housesCollected, collector.totalHouses)
                      return sum + successRate
                    }, 0) / metrics.collectorPerformance.collectors.length)
                  : 0}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Collector success rate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collector Performance Tab */}
      {activeTab === 'collectors' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Collector Performance</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Houses Collected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Houses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conflicts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.collectorPerformance?.collectors?.map((collector) => {
                    const successRate = calculateSuccessRate(collector.housesCollected, collector.totalHouses)
                    return (
                      <tr key={collector.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{collector.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{collector.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{collector.housesCollected}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{collector.totalHouses}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{collector.conflicts}</div>
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
            {(!metrics.collectorPerformance?.collectors || metrics.collectorPerformance.collectors.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No collector performance data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ward Performance Tab */}
      {activeTab === 'wards' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ward Performance</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ward ID
                    </th>
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
                      Conflicts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.wardPerformance?.wards?.map((ward) => {
                    const complianceRate = calculateComplianceRate(ward.housesCollected, ward.totalHouses)
                    return (
                      <tr key={ward.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ward.wardId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ward.collector?.name || 'Unassigned'}</div>
                          <div className="text-sm text-gray-500">{ward.collector?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ward.housesCollected}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ward.totalHouses}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ward.conflicts}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${complianceRate >= 80 ? 'text-green-600' : complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {complianceRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {(!metrics.wardPerformance?.wards || metrics.wardPerformance.wards.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No ward performance data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Metrics 