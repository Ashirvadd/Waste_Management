const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all houses with pagination
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('wardNo').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, search, wardNo } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { wardNo: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (wardNo) {
      where.wardNo = wardNo;
    }

    const [houses, total] = await Promise.all([
      prisma.house.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { address: 'asc' },
        include: {
          ward: {
            include: {
              collector: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              uploads: true,
              conflicts: true
            }
          }
        }
      }),
      prisma.house.count({ where })
    ]);

    res.json({
      houses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get houses error:', error);
    res.status(500).json({ error: 'Failed to fetch houses' });
  }
});

// Get house by ID
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        ward: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        uploads: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        },
        conflicts: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        },
        _count: {
          select: {
            uploads: true,
            conflicts: true
          }
        }
      }
    });

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    res.json({ house });
  } catch (error) {
    console.error('Get house error:', error);
    res.status(500).json({ error: 'Failed to fetch house' });
  }
});

// Create new house
router.post('/', requireAdmin, [
  body('address').isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('wardNo').isString().withMessage('Ward number required'),
  body('wardId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address, wardNo, wardId } = req.body;

    // If wardId is provided, verify it exists
    if (wardId) {
      const ward = await prisma.ward.findUnique({
        where: { id: wardId }
      });

      if (!ward) {
        return res.status(400).json({ error: 'Ward not found' });
      }
    }

    const house = await prisma.house.create({
      data: {
        address,
        wardNo,
        wardId
      },
      include: {
        ward: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            uploads: true,
            conflicts: true
          }
        }
      }
    });

    res.status(201).json({ house });
  } catch (error) {
    console.error('Create house error:', error);
    res.status(500).json({ error: 'Failed to create house' });
  }
});

// Update house
router.put('/:id', requireAdmin, [
  body('address').optional().isLength({ min: 5 }),
  body('wardNo').optional().isString(),
  body('wardId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // If wardId is provided, verify it exists
    if (updateData.wardId) {
      const ward = await prisma.ward.findUnique({
        where: { id: updateData.wardId }
      });

      if (!ward) {
        return res.status(400).json({ error: 'Ward not found' });
      }
    }

    const house = await prisma.house.update({
      where: { id },
      data: updateData,
      include: {
        ward: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            uploads: true,
            conflicts: true
          }
        }
      }
    });

    res.json({ house });
  } catch (error) {
    console.error('Update house error:', error);
    res.status(500).json({ error: 'Failed to update house' });
  }
});

// Delete house
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if house has uploads or conflicts
    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            uploads: true,
            conflicts: true
          }
        }
      }
    });

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    if (house._count.uploads > 0 || house._count.conflicts > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete house',
        message: 'House has associated uploads or conflicts. Please remove them first.'
      });
    }

    await prisma.house.delete({
      where: { id }
    });

    res.json({ message: 'House deleted successfully' });
  } catch (error) {
    console.error('Delete house error:', error);
    res.status(500).json({ error: 'Failed to delete house' });
  }
});

module.exports = router; 