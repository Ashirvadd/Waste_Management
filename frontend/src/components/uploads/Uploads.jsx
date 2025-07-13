import React, { useState, useEffect } from 'react'
import { getUploads, createUpload, updateUpload, deleteUpload, getUsers, getHouses } from '../../api'

const Uploads = () => {
  const [uploads, setUploads] = useState([])
  const [users, setUsers] = useState([])
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingUpload, setEditingUpload] = useState(null)
  const [formData, setFormData] = useState({
    fileName: '',
    fileSize: '',
    uploadType: 'WARD_DATA',
    status: 'PROCESSING'
  })

  // Fetch uploads data
  const fetchUploads = async (page = 1, search = '') => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page,
        limit: 10,
        ...(search && { search })
      }
      
      const response = await getUploads(params)
      setUploads(response.uploads)
      setPagination(response.pagination)
    } catch (err) {
      setError('Failed to fetch uploads. Please try again.')
      console.error('Error fetching uploads:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users and houses for dropdowns
  const fetchDropdownData = async () => {
    try {
      const [usersResponse, housesResponse] = await Promise.all([
        getUsers(),
        getHouses()
      ])
      setUsers(usersResponse.users)
      setHouses(housesResponse.houses)
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUploads(1, searchTerm)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchUploads(page, searchTerm)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Open modal for creating new upload
  const handleCreateUpload = () => {
    setEditingUpload(null)
    setFormData({
      fileName: '',
      fileSize: '',
      uploadType: 'WARD_DATA',
      status: 'PROCESSING'
    })
    setShowModal(true)
  }

  // Open modal for editing upload
  const handleEditUpload = (upload) => {
    setEditingUpload(upload)
    setFormData({
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      uploadType: upload.uploadType,
      status: upload.status
    })
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUpload) {
        await updateUpload(editingUpload.id, formData)
      } else {
        await createUpload(formData)
      }
      setShowModal(false)
      fetchUploads(currentPage, searchTerm)
    } catch (err) {
      setError(err.message || 'Failed to save upload')
    }
  }

  // Handle delete upload
  const handleDeleteUpload = async (uploadId) => {
    if (window.confirm('Are you sure you want to delete this upload?')) {
      try {
        await deleteUpload(uploadId)
        fetchUploads(currentPage, searchTerm)
      } catch (err) {
        setError(err.message || 'Failed to delete upload')
      }
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get upload type badge color
  const getUploadTypeColor = (uploadType) => {
    switch (uploadType) {
      case 'WARD_DATA':
        return 'bg-blue-100 text-blue-800'
      case 'PAYMENT_DATA':
        return 'bg-purple-100 text-purple-800'
      case 'HOUSE_DATA':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchUploads()
    fetchDropdownData()
  }, [])

  if (loading && uploads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploads</h1>
          <p className="text-gray-600">View and manage file uploads</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading uploads...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploads</h1>
          <p className="text-gray-600">View and manage file uploads</p>
        </div>
        <button
          onClick={handleCreateUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Upload
        </button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search uploads by filename or type..."
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

        {/* Stats Card */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Uploads:</span>
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
                    onClick={() => fetchUploads(currentPage, searchTerm)}
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

      {/* Uploads Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{upload.fileName}</div>
                      <div className="text-sm text-gray-500">{upload.fileSize}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUploadTypeColor(upload.uploadType)}`}>
                        {upload.uploadType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {upload.uploadedBy ? (
                        <div>
                          <div className="text-sm text-gray-900">{upload.uploadedBy.name}</div>
                          <div className="text-sm text-gray-500">{upload.uploadedBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(upload.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUpload(upload)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUpload(upload.id)}
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
          {uploads.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new upload.'}
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
                ({pagination.total} total uploads)
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUpload ? 'Edit Upload' : 'Create New Upload'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Name</label>
                  <input
                    type="text"
                    name="fileName"
                    value={formData.fileName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Size</label>
                  <input
                    type="text"
                    name="fileSize"
                    value={formData.fileSize}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2.5 MB"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Type</label>
                  <select
                    name="uploadType"
                    value={formData.uploadType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="WARD_DATA">Ward Data</option>
                    <option value="PAYMENT_DATA">Payment Data</option>
                    <option value="HOUSE_DATA">House Data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingUpload ? 'Update' : 'Create'}
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

export default Uploads 