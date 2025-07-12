// Shared constants for the waste management system

export const WASTE_TYPES = {
  PLASTIC: 'plastic',
  PAPER: 'paper',
  GLASS: 'glass',
  METAL: 'metal',
  ORGANIC: 'organic',
  ELECTRONIC: 'electronic',
  OTHER: 'other'
};

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  COLLECTOR: 'collector'
};

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  PROFILE: '/api/auth/profile',
  
  // Waste Management
  WASTE_REPORTS: '/api/waste/reports',
  COLLECTION_REQUESTS: '/api/waste/collection-requests',
  
  // AI Services
  CLASSIFY_WASTE: '/api/ai/classify-waste',
  ANALYZE_WASTE: '/api/ai/analyze-waste',
  BATCH_CLASSIFY: '/api/ai/batch-classify',
  AI_STATUS: '/api/ai/status',
  
  // Health
  HEALTH: '/health'
};

export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  UPLOAD_PATH: './uploads'
};

export const AI_CONFIG = {
  YOLO_MODEL: 'yolov8n.pt',
  CONFIDENCE_THRESHOLD: 0.5,
  MAX_BATCH_SIZE: 10
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  AI_MODEL_ERROR: 'AI model processing failed'
};

export const SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Waste report created successfully',
  REPORT_UPDATED: 'Waste report updated successfully',
  REQUEST_CREATED: 'Collection request created successfully',
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'Login successful'
};

export const COLORS = {
  primary: '#10B981',
  secondary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const WASTE_TYPE_COLORS = {
  [WASTE_TYPES.PLASTIC]: '#3B82F6',
  [WASTE_TYPES.PAPER]: '#10B981',
  [WASTE_TYPES.GLASS]: '#8B5CF6',
  [WASTE_TYPES.METAL]: '#F59E0B',
  [WASTE_TYPES.ORGANIC]: '#84CC16',
  [WASTE_TYPES.ELECTRONIC]: '#EF4444',
  [WASTE_TYPES.OTHER]: '#6B7280'
};

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: '#10B981',
  [PRIORITY_LEVELS.MEDIUM]: '#F59E0B',
  [PRIORITY_LEVELS.HIGH]: '#F97316',
  [PRIORITY_LEVELS.URGENT]: '#EF4444'
}; 