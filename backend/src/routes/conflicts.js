const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all conflicts with pagination
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['PENDING', 'RESOLVED', 'REJECTED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { house: { address: { contains: search, mode: 'insensitive' } } },
        { collector: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [conflicts, total] = await Promise.all([
      prisma.conflict.findMany({
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
      prisma.conflict.count({ where })
    ]);

    res.json({
      conflicts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conflicts error:', error);
    res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
});

// Get conflict by ID
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const conflict = await prisma.conflict.findUnique({
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

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    res.json({ conflict });
  } catch (error) {
    console.error('Get conflict error:', error);
    res.status(500).json({ error: 'Failed to fetch conflict' });
  }
});

// Create new conflict
router.post('/', requireAdmin, [
  body('collectorId').isString().withMessage('Collector ID required'),
  body('houseId').isString().withMessage('House ID required'),
  body('image').isString().withMessage('Image URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { collectorId, houseId, image } = req.body;

    const conflict = await prisma.conflict.create({
      data: {
        collectorId,
        houseId,
        image
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

    res.status(201).json({ conflict });
  } catch (error) {
    console.error('Create conflict error:', error);
    res.status(500).json({ error: 'Failed to create conflict' });
  }
});

// Resolve conflict (mark as resolved or rejected)
router.patch('/:id/resolve', requireAdmin, [
  body('status').isIn(['RESOLVED', 'REJECTED']).withMessage('Valid status required'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const conflict = await prisma.conflict.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
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

    res.json({ 
      conflict,
      message: `Conflict ${status.toLowerCase()} successfully` 
    });
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// Update conflict
router.put('/:id', requireAdmin, [
  body('image').optional().isString(),
  body('status').optional().isIn(['PENDING', 'RESOLVED', 'REJECTED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const conflict = await prisma.conflict.update({
      where: { id },
      data: updateData,
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

    res.json({ conflict });
  } catch (error) {
    console.error('Update conflict error:', error);
    res.status(500).json({ error: 'Failed to update conflict' });
  }
});

// Delete conflict
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.conflict.delete({
      where: { id }
    });

    res.json({ message: 'Conflict deleted successfully' });
  } catch (error) {
    console.error('Delete conflict error:', error);
    res.status(500).json({ error: 'Failed to delete conflict' });
  }
});

module.exports = router; 