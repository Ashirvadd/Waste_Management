const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all uploads with pagination
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { house: { address: { contains: search, mode: 'insensitive' } } },
        { collector: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' },
        include: {
          collector: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          house: {
            select: {
              id: true,
              address: true,
              wardNo: true
            }
          }
        }
      }),
      prisma.upload.count({ where })
    ]);

    res.json({
      uploads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// Get upload by ID
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        collector: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        house: {
          select: {
            id: true,
            address: true,
            wardNo: true
          }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({ upload });
  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Create new upload
router.post('/', requireAdmin, [
  body('collectorId').isString().withMessage('Collector ID required'),
  body('houseId').isString().withMessage('House ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { collectorId, houseId } = req.body;

    const upload = await prisma.upload.create({
      data: {
        collectorId,
        houseId
      },
      include: {
        collector: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        house: {
          select: {
            id: true,
            address: true,
            wardNo: true
          }
        }
      }
    });

    // Update house's lastGarbage timestamp
    // await prisma.house.update({
    //   where: { id: houseId },
    //   data: { lastGarbage: new Date() }
    // });

    res.status(201).json({ upload });
  } catch (error) {
    console.error('Create upload error:', error);
    res.status(500).json({ error: 'Failed to create upload' });
  }
});

// Delete upload
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.upload.delete({
      where: { id }
    });

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

module.exports = router; 