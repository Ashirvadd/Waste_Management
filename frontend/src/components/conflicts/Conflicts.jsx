import React, { useState, useEffect } from 'react'
import { getConflicts, resolveConflict, deleteConflict } from '../../api'

const Conflicts = () => {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Resolution modal states
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const [resolutionData, setResolutionData] = useState({
    status: 'RESOLVED',
    notes: ''
  })

  // Fetch conflicts data
  const fetchConflicts = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status !== 'all' && { status })
      }
      
      const response = await getConflicts(params)
      setConflicts(response.conflicts)
      setPagination(response.pagination)
    } catch (err) {
      setError('Failed to fetch conflicts. Please try again.')
      console.error('Error fetching conflicts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchConflicts(1, searchTerm, statusFilter)
  }

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
    fetchConflicts(1, searchTerm, status)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchConflicts(page, searchTerm, statusFilter)
  }

  // Handle resolution modal
  const handleResolveConflict = (conflict) => {
    setSelectedConflict(conflict)
    setResolutionData({
      status: 'RESOLVED',
      notes: ''
    })
    setShowResolutionModal(true)
  }

  // Handle resolution submission
  const handleResolutionSubmit = async (e) => {
    e.preventDefault()
    try {
      await resolveConflict(selectedConflict.id, resolutionData)
      setShowResolutionModal(false)
      fetchConflicts(currentPage, searchTerm, statusFilter)
    } catch (err) {
      setError(err.message || 'Failed to resolve conflict')
    }
  }

  // Handle delete conflict
  const handleDeleteConflict = async (conflictId) => {
    if (window.confirm('Are you sure you want to delete this conflict?')) {
      try {
        await deleteConflict(conflictId)
        fetchConflicts(currentPage, searchTerm, statusFilter)
      } catch (err) {
        setError(err.message || 'Failed to delete conflict')
      }
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchConflicts()
  }, [])

  if (loading && conflicts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conflicts</h1>
          <p className="text-gray-600">Manage and resolve garbage collection conflicts</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading conflicts...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conflicts</h1>
        <p className="text-gray-600">Manage and resolve garbage collection conflicts</p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search conflicts by address or collector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Status Filter</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  statusFilter === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Conflicts
              </button>
              <button
                onClick={() => handleStatusFilter('OPEN')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  statusFilter === 'OPEN' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => handleStatusFilter('RESOLVED')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  statusFilter === 'RESOLVED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => handleStatusFilter('REJECTED')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  statusFilter === 'REJECTED' 
                    ? 'bg-red-100 text-red-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Conflicts:</span>
                <span className="font-semibold">{pagination.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Page:</span>
                <span className="font-semibold">{pagination.page} of {pagination.pages}</span>
              </div>
            </div>
          </div>
        </div>
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
                    onClick={() => fetchConflicts(currentPage, searchTerm, statusFilter)}
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

      {/* Conflicts Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conflicts.map((conflict) => (
                  <tr key={conflict.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {conflict.house ? `${conflict.house.houseNumber} ${conflict.house.street}` : 'Unknown House'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conflict.house ? `Ward ${conflict.house.wardId}` : 'No ward assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {conflict.house?.collector?.name || 'No collector assigned'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conflict.house?.collector?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conflict.status)}`}>
                        {conflict.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(conflict.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(conflict.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {conflict.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolveConflict(conflict)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteConflict(conflict.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {conflicts.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conflicts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search terms or filters.' : 'No conflicts reported yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages} 
                ({pagination.total} total conflicts)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && selectedConflict && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resolve Conflict</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>House:</strong> {selectedConflict.house ? `${selectedConflict.house.houseNumber} ${selectedConflict.house.street}` : 'Unknown House'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Collector:</strong> {selectedConflict.house?.collector?.name || 'No collector assigned'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Reported:</strong> {new Date(selectedConflict.createdAt).toLocaleString()}
                </p>
              </div>
              <form onSubmit={handleResolutionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Status</label>
                  <select
                    value={resolutionData.status}
                    onChange={(e) => setResolutionData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    value={resolutionData.notes}
                    onChange={(e) => setResolutionData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add resolution notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowResolutionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Resolve
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Conflicts 