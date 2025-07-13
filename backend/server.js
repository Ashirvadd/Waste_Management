const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // allow 1000 requests per 15 minutes per IP for development
});
app.use(limiter);

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Waste Management API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import and use route modules
const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');
const aiRoutes = require('./routes/ai');
const collectorRoutes = require('./routes/collector');
const voiceLogRoutes = require('./routes/voice-logs');
const translateRoutes = require('./routes/translate');
const streamlitRoutes = require('./routes/streamlit');

app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/voice-logs', voiceLogRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api', streamlitRoutes);

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '../frontend/out')));

// Handle Next.js routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Serve the Next.js app
  res.sendFile(path.join(__dirname, '../frontend/out/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend will be served from: ${path.join(__dirname, '../frontend/out')}`);
}); 