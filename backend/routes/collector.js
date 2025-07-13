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

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.round(Math.random() * 1E9));
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Validation schema for collection submission
const collectionSubmissionSchema = Joi.object({
  completedHouses: Joi.array().items(Joi.string()).min(1).required(),
  completedWards: Joi.array().items(Joi.string()).optional(),
  wasteTypes: Joi.array().items(Joi.string().valid('wet', 'dry', 'reject')).min(1).required(),
  segregationViolation: Joi.boolean().default(false),
  timestamp: Joi.string().required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),
    captured: Joi.boolean()
  }).required(),
  remarks: Joi.string().max(1000).optional().allow(''),
  wasteWeight: Joi.number().min(0).default(0).optional(),
  image: Joi.object({
    name: Joi.string(),
    type: Joi.string(),
    data: Joi.string()
  }).optional().allow(null)
});

// Submit collection data
router.post('/submit', verifyToken, upload.single('image'), async (req, res) => {
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
    } else if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    // Validate the request
    const { error, value } = collectionSubmissionSchema.validate(body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get user from token
    const userId = req.user.userId;

    // Handle base64 image if provided
    let imageUrl = null;
    if (value.image && value.image.data) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Extract base64 data and save file
        const base64Data = value.image.data.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${Date.now()}-${value.image.name}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
      } catch (error) {
        console.error('Error saving base64 image:', error);
      }
    } else if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create collection entries for each completed house
    const collectionEntries = [];
    for (const houseId of value.completedHouses) {
      const collectionEntryData = {
        houseId: houseId,
        wasteTypes: JSON.stringify(value.wasteTypes),
        wasteWeight: value.wasteWeight,
        imageUrl: imageUrl,
        segregationViolation: value.segregationViolation,
        timestamp: new Date(value.timestamp),
        latitude: value.location.latitude,
        longitude: value.location.longitude,
        locationCaptured: value.location.captured,
        remarks: value.remarks || null,
        collectedBy: userId
      };

      const collectionEntry = await prisma.collectionEntry.create({
        data: collectionEntryData,
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

      collectionEntries.push(collectionEntry);
    }

    // Also create waste reports for each waste type and house (for backward compatibility)
    const reports = [];
    for (const houseId of value.completedHouses) {
      for (const wasteType of value.wasteTypes) {
        const wasteWeight = value.wasteWeight || 0;
        const reportData = {
          type: wasteType.toUpperCase(),
          quantity: wasteWeight > 0 ? Math.round(wasteWeight / value.wasteTypes.length) : 1, // Distribute weight or default to 1
          latitude: value.location.latitude || 0,
          longitude: value.location.longitude || 0,
          address: `House ${houseId}`,
          description: `Collection from House ${houseId}.${wasteWeight > 0 ? ` Weight: ${wasteWeight} kgs.` : ''} ${value.remarks || ''} ${value.segregationViolation ? 'Segregation violation detected.' : ''}`,
          priority: 'MEDIUM',
          status: 'COMPLETED', // Since it's already collected
          imageUrl: imageUrl,
          reportedBy: userId
        };

        const newReport = await prisma.wasteReport.create({
          data: reportData,
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

        reports.push(newReport);
      }
    }

    res.status(201).json({
      message: 'Collection data submitted successfully',
      collectionEntries: collectionEntries,
      reports: reports,
      totalReports: reports.length,
      completedHouses: value.completedHouses.length,
      completedWards: value.completedWards || [],
      totalWeight: value.wasteWeight || 0
    });

  } catch (error) {
    console.error('Error submitting collection data:', error);
    res.status(500).json({ error: 'Failed to submit collection data' });
  }
});

// Get collector's recent collections
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const recentCollections = await prisma.collectionEntry.findMany({
      where: {
        collectedBy: userId
      },
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
      },
      take: 10
    });

    res.json({
      collections: recentCollections,
      total: recentCollections.length
    });

  } catch (error) {
    console.error('Error fetching recent collections:', error);
    res.status(500).json({ error: 'Failed to fetch recent collections' });
  }
});

// Get collector's statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollections = await prisma.collectionEntry.count({
      where: {
        collectedBy: userId,
        createdAt: {
          gte: today
        }
      }
    });

    const totalCollections = await prisma.collectionEntry.count({
      where: {
        collectedBy: userId
      }
    });

    const violations = await prisma.collectionEntry.count({
      where: {
        collectedBy: userId,
        segregationViolation: true
      }
    });

    // Get waste weight statistics
    const todayWeight = await prisma.collectionEntry.aggregate({
      where: {
        collectedBy: userId,
        createdAt: {
          gte: today
        }
      },
      _sum: {
        wasteWeight: true
      }
    });

    const totalWeight = await prisma.collectionEntry.aggregate({
      where: {
        collectedBy: userId
      },
      _sum: {
        wasteWeight: true
      }
    });

    // Get yesterday's weight for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayWeight = await prisma.collectionEntry.aggregate({
      where: {
        collectedBy: userId,
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      _sum: {
        wasteWeight: true
      }
    });

    const todayWeightValue = todayWeight._sum.wasteWeight || 0;
    const yesterdayWeightValue = yesterdayWeight._sum.wasteWeight || 0;
    const weightChange = yesterdayWeightValue > 0 ? ((todayWeightValue - yesterdayWeightValue) / yesterdayWeightValue * 100) : 0;

    res.json({
      todayCollections,
      totalCollections,
      violations,
      efficiency: totalCollections > 0 ? ((totalCollections - violations) / totalCollections * 100).toFixed(1) : 100,
      todayWeight: todayWeightValue,
      totalWeight: totalWeight._sum.wasteWeight || 0,
      weightChange: weightChange.toFixed(1)
    });

  } catch (error) {
    console.error('Error fetching collector stats:', error);
    res.status(500).json({ error: 'Failed to fetch collector statistics' });
  }
});

// Get all collection entries (for admin dashboard)
router.get('/all', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const collections = await prisma.collectionEntry.findMany({
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
      collections: collections,
      total: collections.length
    });

  } catch (error) {
    console.error('Error fetching all collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

module.exports = router; 