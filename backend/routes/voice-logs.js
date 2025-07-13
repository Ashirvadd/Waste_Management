const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Multer configuration for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/audio/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.round(Math.random() * 1E9));
    cb(null, 'voice-log-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'audio/wav' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Validation schema for voice log submission
const voiceLogSchema = Joi.object({
  houseId: Joi.string().optional().allow(''),
  recordedLang: Joi.string().required(),
  nativeText: Joi.string().required(),
  translatedText: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
  userRole: Joi.string().required(),
  userName: Joi.string().required()
});

// Create voice log
router.post('/', verifyToken, upload.single('audio'), async (req, res) => {
  try {
    // Parse the request body
    let body = req.body;
    
    // Handle form data with JSON string
    if (req.body.data) {
      try {
        body = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(400).json({ error: 'Invalid JSON data' });
      }
    }

    // Validate the request
    const { error, value } = voiceLogSchema.validate(body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get user from token
    const userId = req.user.userId;

    // Create voice log entry
    const voiceLogData = {
      houseId: value.houseId || null,
      recordedLang: value.recordedLang,
      nativeText: value.nativeText,
      translatedText: value.translatedText || null,
      remarks: value.remarks || null,
      audioUrl: req.file ? `/uploads/audio/${req.file.filename}` : null,
      userRole: value.userRole,
      userName: value.userName,
      createdBy: userId
    };

    const voiceLog = await prisma.voiceLog.create({
      data: voiceLogData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Voice log created successfully',
      voiceLog: voiceLog
    });

  } catch (error) {
    console.error('Error creating voice log:', error);
    res.status(500).json({ error: 'Failed to create voice log' });
  }
});

// Get voice logs
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    let whereClause = {};
    
    // If user is not admin, only show their own logs
    if (user.role !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    const voiceLogs = await prisma.voiceLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      logs: voiceLogs,
      total: voiceLogs.length
    });

  } catch (error) {
    console.error('Error fetching voice logs:', error);
    res.status(500).json({ error: 'Failed to fetch voice logs' });
  }
});

// Get voice log by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    let whereClause = { id };
    
    // If user is not admin, only show their own logs
    if (user.role !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    const voiceLog = await prisma.voiceLog.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!voiceLog) {
      return res.status(404).json({ error: 'Voice log not found' });
    }

    res.json({
      voiceLog: voiceLog
    });

  } catch (error) {
    console.error('Error fetching voice log:', error);
    res.status(500).json({ error: 'Failed to fetch voice log' });
  }
});

// Delete voice log
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    let whereClause = { id };
    
    // If user is not admin, only allow deletion of their own logs
    if (user.role !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    const voiceLog = await prisma.voiceLog.findFirst({
      where: whereClause
    });

    if (!voiceLog) {
      return res.status(404).json({ error: 'Voice log not found' });
    }

    // Delete the voice log
    await prisma.voiceLog.delete({
      where: { id }
    });

    res.json({
      message: 'Voice log deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting voice log:', error);
    res.status(500).json({ error: 'Failed to delete voice log' });
  }
});

module.exports = router; 