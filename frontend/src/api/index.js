// Configuration - set to false to use real backend
const USE_MOCK_DATA = true;

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Mock data for development
const mockUsers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1234567890',
    role: 'ADMIN',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1234567891',
    role: 'COLLECTOR',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@example.com',
    phone: '+1234567892',
    role: 'COLLECTOR',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    name: 'Lisa Wilson',
    email: 'lisa.wilson@example.com',
    phone: '+1234567893',
    role: 'COLLECTOR',
    createdAt: '2024-01-18T11:45:00Z'
  }
];

const mockWards = [
  {
    id: '1',
    wardId: 'W001',
    collectorId: '2',
    collector: mockUsers[1],
    _count: { houses: 25 }
  },
  {
    id: '2',
    wardId: 'W002',
    collectorId: '3',
    collector: mockUsers[2],
    _count: { houses: 18 }
  },
  {
    id: '3',
    wardId: 'W003',
    collectorId: '4',
    collector: mockUsers[3],
    _count: { houses: 32 }
  }
];

const mockHouses = [
  {
    id: '1',
    houseNumber: '123',
    street: 'Main Street',
    wardId: 'W001',
    collectorId: '2',
    collector: mockUsers[1],
    status: 'COLLECTED',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    houseNumber: '456',
    street: 'Oak Avenue',
    wardId: 'W001',
    collectorId: '2',
    collector: mockUsers[1],
    status: 'PENDING',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    houseNumber: '789',
    street: 'Pine Road',
    wardId: 'W002',
    collectorId: '3',
    collector: mockUsers[2],
    status: 'COLLECTED',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    houseNumber: '321',
    street: 'Elm Street',
    wardId: 'W003',
    collectorId: '4',
    collector: mockUsers[3],
    status: 'PENDING',
    createdAt: '2024-01-18T11:45:00Z'
  }
];

const mockConflicts = [
  {
    id: '1',
    houseId: '1',
    house: mockHouses[0],
    description: 'Resident claims payment was made but not recorded',
    status: 'OPEN',
    createdAt: '2024-01-15T10:30:00Z',
    resolvedAt: null
  },
  {
    id: '2',
    houseId: '2',
    house: mockHouses[1],
    description: 'Dispute over amount owed',
    status: 'RESOLVED',
    createdAt: '2024-01-16T14:20:00Z',
    resolvedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '3',
    houseId: '3',
    house: mockHouses[2],
    description: 'Property owner not found at address',
    status: 'OPEN',
    createdAt: '2024-01-17T09:15:00Z',
    resolvedAt: null
  }
];

const mockUploads = [
  {
    id: '1',
    fileName: 'ward_001_data.xlsx',
    fileSize: '2.5 MB',
    uploadType: 'WARD_DATA',
    status: 'COMPLETED',
    uploadedBy: mockUsers[1],
    createdAt: '2024-01-15T10:30:00Z',
    processedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: '2',
    fileName: 'payment_records.csv',
    fileSize: '1.8 MB',
    uploadType: 'PAYMENT_DATA',
    status: 'PROCESSING',
    uploadedBy: mockUsers[2],
    createdAt: '2024-01-16T14:20:00Z',
    processedAt: null
  },
  {
    id: '3',
    fileName: 'house_updates.xlsx',
    fileSize: '3.2 MB',
    uploadType: 'HOUSE_DATA',
    status: 'FAILED',
    uploadedBy: mockUsers[3],
    createdAt: '2024-01-17T09:15:00Z',
    processedAt: null
  }
];

// Helper function to simulate API delay
const simulateApiDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to filter and paginate mock data
const filterAndPaginate = (data, params = {}) => {
  let filtered = [...data];
  
  // Apply search filter
  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    filtered = filtered.filter(item => {
      if (item.name) return item.name.toLowerCase().includes(searchTerm);
      if (item.wardId) return item.wardId.toLowerCase().includes(searchTerm);
      if (item.houseNumber) return item.houseNumber.toLowerCase().includes(searchTerm);
      if (item.street) return item.street.toLowerCase().includes(searchTerm);
      if (item.fileName) return item.fileName.toLowerCase().includes(searchTerm);
      return false;
    });
  }
  
  // Apply role filter
  if (params.role) {
    filtered = filtered.filter(item => item.role === params.role);
  }
  
  // Apply status filter
  if (params.status) {
    filtered = filtered.filter(item => item.status === params.status);
  }
  
  // Apply upload type filter
  if (params.uploadType) {
    filtered = filtered.filter(item => item.uploadType === params.uploadType);
  }
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: filtered.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit)
    }
  };
};

// Auth API
export const login = async (credentials) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    
    // Mock successful login
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: credentials.email,
      role: 'ADMIN'
    };
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    return {
      user: mockUser,
      token: mockToken
    };
  } else {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
};

// Users API
export const getUsers = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const result = filterAndPaginate(mockUsers, params);
    return {
      users: result.data,
      pagination: result.pagination
    };
  } else {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/users?${queryString}`);
  }
};

export const getUser = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  } else {
    return apiCall(`/users/${id}`);
  }
};

export const createUser = async (userData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  } else {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

export const updateUser = async (id, userData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...userData };
    return mockUsers[index];
  } else {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
};

export const deleteUser = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers.splice(index, 1);
    return { success: true };
  } else {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};

// Wards API
export const getWards = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const result = filterAndPaginate(mockWards, params);
    return {
      wards: result.data,
      pagination: result.pagination
    };
  } else {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/wards?${queryString}`);
  }
};

export const getWard = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const ward = mockWards.find(w => w.id === id);
    if (!ward) throw new Error('Ward not found');
    return ward;
  } else {
    return apiCall(`/wards/${id}`);
  }
};

export const createWard = async (wardData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const newWard = {
      id: (mockWards.length + 1).toString(),
      ...wardData,
      collector: mockUsers.find(u => u.id === wardData.collectorId),
      _count: { houses: 0 }
    };
    mockWards.push(newWard);
    return newWard;
  } else {
    return apiCall('/wards', {
      method: 'POST',
      body: JSON.stringify(wardData),
    });
  }
};

export const updateWard = async (id, wardData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockWards.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Ward not found');
    mockWards[index] = { 
      ...mockWards[index], 
      ...wardData,
      collector: mockUsers.find(u => u.id === wardData.collectorId)
    };
    return mockWards[index];
  } else {
    return apiCall(`/wards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wardData),
    });
  }
};

export const deleteWard = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockWards.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Ward not found');
    mockWards.splice(index, 1);
    return { success: true };
  } else {
    return apiCall(`/wards/${id}`, {
      method: 'DELETE',
    });
  }
};

// Houses API
export const getHouses = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const result = filterAndPaginate(mockHouses, params);
    return {
      houses: result.data,
      pagination: result.pagination
    };
  } else {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/homes?${queryString}`);
  }
};

export const getHouse = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const house = mockHouses.find(h => h.id === id);
    if (!house) throw new Error('House not found');
    return house;
  } else {
    return apiCall(`/homes/${id}`);
  }
};

export const createHouse = async (houseData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const newHouse = {
      id: (mockHouses.length + 1).toString(),
      ...houseData,
      collector: mockUsers.find(u => u.id === houseData.collectorId),
      createdAt: new Date().toISOString()
    };
    mockHouses.push(newHouse);
    return newHouse;
  } else {
    return apiCall('/homes', {
      method: 'POST',
      body: JSON.stringify(houseData),
    });
  }
};

export const updateHouse = async (id, houseData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockHouses.findIndex(h => h.id === id);
    if (index === -1) throw new Error('House not found');
    mockHouses[index] = { 
      ...mockHouses[index], 
      ...houseData,
      collector: mockUsers.find(u => u.id === houseData.collectorId)
    };
    return mockHouses[index];
  } else {
    return apiCall(`/homes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(houseData),
    });
  }
};

export const deleteHouse = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockHouses.findIndex(h => h.id === id);
    if (index === -1) throw new Error('House not found');
    mockHouses.splice(index, 1);
    return { success: true };
  } else {
    return apiCall(`/homes/${id}`, {
      method: 'DELETE',
    });
  }
};

// Conflicts API
export const getConflicts = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const result = filterAndPaginate(mockConflicts, params);
    return {
      conflicts: result.data,
      pagination: result.pagination
    };
  } else {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/conflicts?${queryString}`);
  }
};

export const getConflict = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const conflict = mockConflicts.find(c => c.id === id);
    if (!conflict) throw new Error('Conflict not found');
    return conflict;
  } else {
    return apiCall(`/conflicts/${id}`);
  }
};

export const createConflict = async (conflictData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const newConflict = {
      id: (mockConflicts.length + 1).toString(),
      ...conflictData,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };
    mockConflicts.push(newConflict);
    return newConflict;
  } else {
    return apiCall('/conflicts', {
      method: 'POST',
      body: JSON.stringify(conflictData),
    });
  }
};

export const updateConflict = async (id, conflictData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockConflicts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Conflict not found');
    mockConflicts[index] = { ...mockConflicts[index], ...conflictData };
    return mockConflicts[index];
  } else {
    return apiCall(`/conflicts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(conflictData),
    });
  }
};

export const resolveConflict = async (id, resolutionData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockConflicts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Conflict not found');
    mockConflicts[index] = { 
      ...mockConflicts[index], 
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      ...resolutionData
    };
    return mockConflicts[index];
  } else {
    return apiCall(`/conflicts/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(resolutionData),
    });
  }
};

export const deleteConflict = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockConflicts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Conflict not found');
    mockConflicts.splice(index, 1);
    return { success: true };
  } else {
    return apiCall(`/conflicts/${id}`, {
      method: 'DELETE',
    });
  }
};

// Uploads API
export const getUploads = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const result = filterAndPaginate(mockUploads, params);
    return {
      uploads: result.data,
      pagination: result.pagination
    };
  } else {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/uploads?${queryString}`);
  }
};

export const getUpload = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const upload = mockUploads.find(u => u.id === id);
    if (!upload) throw new Error('Upload not found');
    return upload;
  } else {
    return apiCall(`/uploads/${id}`);
  }
};

export const createUpload = async (uploadData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const newUpload = {
      id: (mockUploads.length + 1).toString(),
      ...uploadData,
      uploadedBy: mockUsers[0], // Admin user
      createdAt: new Date().toISOString(),
      processedAt: null
    };
    mockUploads.push(newUpload);
    return newUpload;
  } else {
    return apiCall('/uploads', {
      method: 'POST',
      body: JSON.stringify(uploadData),
    });
  }
};

export const updateUpload = async (id, uploadData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockUploads.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Upload not found');
    mockUploads[index] = { ...mockUploads[index], ...uploadData };
    return mockUploads[index];
  } else {
    return apiCall(`/uploads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(uploadData),
    });
  }
};

export const deleteUpload = async (id) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    const index = mockUploads.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Upload not found');
    mockUploads.splice(index, 1);
    return { success: true };
  } else {
    return apiCall(`/uploads/${id}`, {
      method: 'DELETE',
    });
  }
};

// Dashboard API
export const getDashboardOverview = async () => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    return {
      totalUsers: mockUsers.length,
      totalWards: mockWards.length,
      totalHouses: mockHouses.length,
      totalConflicts: mockConflicts.length,
      totalUploads: mockUploads.length,
      pendingConflicts: mockConflicts.filter(c => c.status === 'OPEN').length,
      completedHouses: mockHouses.filter(h => h.status === 'COLLECTED').length,
      pendingHouses: mockHouses.filter(h => h.status === 'PENDING').length
    };
  } else {
    return apiCall('/dashboard/overview');
  }
};

export const getTopPerformers = async () => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    return {
      collectors: mockUsers.filter(u => u.role === 'COLLECTOR').map(collector => ({
        ...collector,
        housesCollected: mockHouses.filter(h => h.collectorId === collector.id && h.status === 'COLLECTED').length,
        totalHouses: mockHouses.filter(h => h.collectorId === collector.id).length
      })).sort((a, b) => b.housesCollected - a.housesCollected).slice(0, 5)
    };
  } else {
    return apiCall('/dashboard/top-performers');
  }
};

// Metrics API
export const getCollectorPerformance = async () => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    return {
      collectors: mockUsers.filter(u => u.role === 'COLLECTOR').map(collector => ({
        ...collector,
        housesCollected: mockHouses.filter(h => h.collectorId === collector.id && h.status === 'COLLECTED').length,
        totalHouses: mockHouses.filter(h => h.collectorId === collector.id).length,
        conflicts: mockConflicts.filter(c => c.house?.collectorId === collector.id).length
      }))
    };
  } else {
    return apiCall('/metrics/collector-performance');
  }
};

export const getWardPerformance = async () => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    return {
      wards: mockWards.map(ward => ({
        ...ward,
        housesCollected: mockHouses.filter(h => h.wardId === ward.wardId && h.status === 'COLLECTED').length,
        totalHouses: mockHouses.filter(h => h.wardId === ward.wardId).length,
        conflicts: mockConflicts.filter(c => c.house?.wardId === ward.wardId).length
      }))
    };
  } else {
    return apiCall('/metrics/ward-performance');
  }
}; 