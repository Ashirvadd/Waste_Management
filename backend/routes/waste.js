const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
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
  type: Joi.string().valid('plastic', 'paper', 'glass', 'metal', 'organic', 'electronic', 'other').required(),
  quantity: Joi.number().positive().required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).required(),
  description: Joi.string().max(500).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const collectionRequestSchema = Joi.object({
  wasteId: Joi.string().required(),
  scheduledDate: Joi.date().min('now').required(),
  notes: Joi.string().max(300).optional()
});

// Get all waste reports
router.get('/reports', async (req, res) => {
  try {
    // TODO: Fetch from database with pagination
    const reports = [
      {
        id: '1',
        type: 'plastic',
        quantity: 50,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY'
        },
        description: 'Plastic bottles and containers',
        priority: 'medium',
        status: 'pending',
        reportedBy: 'user123',
        createdAt: new Date().toISOString()
      }
    ];

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
      id: Date.now().toString(),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending',
      reportedBy: req.user?.userId || 'anonymous',
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database
    console.log('New waste report:', reportData);

    res.status(201).json({
      message: 'Waste report created successfully',
      report: reportData
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
    
    // TODO: Fetch from database
    const report = {
      id,
      type: 'plastic',
      quantity: 50,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY'
      },
      description: 'Plastic bottles and containers',
      priority: 'medium',
      status: 'pending',
      reportedBy: 'user123',
      createdAt: new Date().toISOString()
    };

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

    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // TODO: Update in database
    console.log(`Updating report ${id} status to ${status}`);

    res.json({
      message: 'Status updated successfully',
      reportId: id,
      status
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
      id: Date.now().toString(),
      status: 'pending',
      requestedBy: req.user?.userId || 'anonymous',
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database
    console.log('New collection request:', requestData);

    res.status(201).json({
      message: 'Collection request created successfully',
      request: requestData
    });
  } catch (error) {
    console.error('Error creating collection request:', error);
    res.status(500).json({ error: 'Failed to create collection request' });
  }
});

// Get collection requests
router.get('/collection-requests', async (req, res) => {
  try {
    // TODO: Fetch from database with filters
    const requests = [
      {
        id: '1',
        wasteId: 'waste123',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'pending',
        requestedBy: 'user123',
        createdAt: new Date().toISOString()
      }
    ];

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