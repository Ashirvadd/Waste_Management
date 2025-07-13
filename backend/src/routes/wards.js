const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all wards with pagination
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
        { wardId: { contains: search, mode: 'insensitive' } },
        { collector: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [wards, total] = await Promise.all([
      prisma.ward.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { wardId: 'asc' },
        include: {
          collector: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              houses: true
            }
          }
        }
      }),
      prisma.ward.count({ where })
    ]);

    res.json({
      wards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
});

// Get ward by ID
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await prisma.ward.findUnique({
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
        houses: {
          include: {
            _count: {
              select: {
                uploads: true,
                conflicts: true
              }
            }
          }
        },
        _count: {
          select: {
            houses: true
          }
        }
      }
    });

    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }

    res.json({ ward });
  } catch (error) {
    console.error('Get ward error:', error);
    res.status(500).json({ error: 'Failed to fetch ward' });
  }
});

// Create new ward
router.post('/', requireAdmin, [
  body('wardId').isString().withMessage('Ward ID required'),
  body('collectorId').isString().withMessage('Collector ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { wardId, collectorId } = req.body;

    // Check if collector exists and is a collector
    const collector = await prisma.user.findUnique({
      where: { id: collectorId }
    });

    if (!collector) {
      return res.status(400).json({ error: 'Collector not found' });
    }

    if (collector.role !== 'COLLECTOR') {
      return res.status(400).json({ error: 'User must be a collector' });
    }

    const ward = await prisma.ward.create({
      data: {
        wardId,
        collectorId
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
        _count: {
          select: {
            houses: true
          }
        }
      }
    });

    res.status(201).json({ ward });
  } catch (error) {
    console.error('Create ward error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ward ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create ward' });
  }
});

// Update ward
router.put('/:id', requireAdmin, [
  body('wardId').optional().isString(),
  body('collectorId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // If updating collector, verify they exist and are a collector
    if (updateData.collectorId) {
      const collector = await prisma.user.findUnique({
        where: { id: updateData.collectorId }
      });

      if (!collector) {
        return res.status(400).json({ error: 'Collector not found' });
      }

      if (collector.role !== 'COLLECTOR') {
        return res.status(400).json({ error: 'User must be a collector' });
      }
    }

    const ward = await prisma.ward.update({
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
        _count: {
          select: {
            houses: true
          }
        }
      }
    });

    res.json({ ward });
  } catch (error) {
    console.error('Update ward error:', error);
    res.status(500).json({ error: 'Failed to update ward' });
  }
});

// Delete ward
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ward has houses
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            houses: true
          }
        }
      }
    });

    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }

    if (ward._count.houses > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete ward',
        message: 'Ward has associated houses. Please reassign them first.'
      });
    }

    await prisma.ward.delete({
      where: { id }
    });

    res.json({ message: 'Ward deleted successfully' });
  } catch (error) {
    console.error('Delete ward error:', error);
    res.status(500).json({ error: 'Failed to delete ward' });
  }
});

module.exports = router; 