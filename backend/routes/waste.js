const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const prisma = require('../lib/prisma');
const router = express.Router();

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

// Validation schemas
const wasteReportSchema = Joi.object({
  type: Joi.string().valid('PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ORGANIC', 'ELECTRONIC', 'OTHER').required(),
  quantity: Joi.number().positive().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM')
});

const collectionRequestSchema = Joi.object({
  wasteReportId: Joi.string().required(),
  scheduledDate: Joi.date().min('now').required(),
  notes: Joi.string().max(300).optional()
});

// Get all waste reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.wasteReport.findMany({
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
      reports,
      total: reports.length,
      page: 1,
      limit: 10
    });
  } catch (error) {
    console.error('Error fetching waste reports:', error);
    res.status(500).json({ error: 'Failed to fetch waste reports' });
  }
});

// Create new waste report
router.post('/reports', upload.single('image'), async (req, res) => {
  try {
    const { error, value } = wasteReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const reportData = {
      ...value,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'PENDING',
      reportedBy: req.user?.userId || 'anonymous'
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

    res.status(201).json({
      message: 'Waste report created successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error creating waste report:', error);
    res.status(500).json({ error: 'Failed to create waste report' });
  }
});

// Get waste report by ID
router.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await prisma.wasteReport.findUnique({
      where: { id },
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

    if (!report) {
      return res.status(404).json({ error: 'Waste report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error fetching waste report:', error);
    res.status(500).json({ error: 'Failed to fetch waste report' });
  }
});

// Update waste report status
router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedReport = await prisma.wasteReport.update({
      where: { id },
      data: { status },
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

    res.json({
      message: 'Status updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating waste report status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Create collection request
router.post('/collection-requests', async (req, res) => {
  try {
    const { error, value } = collectionRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const requestData = {
      ...value,
      status: 'PENDING',
      requestedBy: req.user?.userId || 'anonymous'
    };

    const newRequest = await prisma.collectionRequest.create({
      data: requestData,
      include: {
        wasteReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
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
      message: 'Collection request created successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Error creating collection request:', error);
    res.status(500).json({ error: 'Failed to create collection request' });
  }
});

// Get collection requests
router.get('/collection-requests', async (req, res) => {
  try {
    const requests = await prisma.collectionRequest.findMany({
      include: {
        wasteReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
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
      requests,
      total: requests.length,
      page: 1,
      limit: 10
    });
  } catch (error) {
    console.error('Error fetching collection requests:', error);
    res.status(500).json({ error: 'Failed to fetch collection requests' });
  }
});

module.exports = router; 