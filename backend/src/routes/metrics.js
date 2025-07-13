const express = require('express');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get compliance trends (daily/weekly)
router.get('/compliance-trends', requireAdmin, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    // Get date range
    const now = new Date();
    const startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    // Get conflicts by date
    const conflicts = await prisma.conflict.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Group by date
    const trends = {};
    conflicts.forEach(conflict => {
      const date = conflict.createdAt.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { total: 0, resolved: 0, pending: 0 };
      }
      trends[date].total++;
      if (conflict.status === 'RESOLVED') {
        trends[date].resolved++;
      } else if (conflict.status === 'PENDING') {
        trends[date].pending++;
      }
    });

    // Convert to array format for charts
    const trendsArray = Object.entries(trends).map(([date, data]) => ({
      date,
      total: data.total,
      resolved: data.resolved,
      pending: data.pending,
      complianceRate: data.total > 0 ? ((data.total - data.pending) / data.total) * 100 : 100
    }));

    res.json({ trends: trendsArray });
  } catch (error) {
    console.error('Compliance trends error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance trends' });
  }
});

// Get collector performance
router.get('/collector-performance', requireAdmin, async (req, res) => {
  try {
    const collectors = await prisma.user.findMany({
      where: { role: 'COLLECTOR' },
      include: {
        ward: true,
        conflictsAsCollector: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        }
      }
    });

    const performance = collectors.map(collector => {
      const totalVisits = collector.conflictsAsCollector.length;
      const validConcerns = collector.conflictsAsCollector.filter(c => c.status === 'RESOLVED').length;
      const pendingConcerns = collector.conflictsAsCollector.filter(c => c.status === 'PENDING').length;

      return {
        id: collector.id,
        name: collector.name,
        phone: collector.phone,
        ward: collector.ward,
        totalVisits,
        validConcerns,
        pendingConcerns,
        successRate: totalVisits > 0 ? (validConcerns / totalVisits) * 100 : 0
      };
    });

    // Sort by success rate
    performance.sort((a, b) => b.successRate - a.successRate);

    res.json({ performance });
  } catch (error) {
    console.error('Collector performance error:', error);
    res.status(500).json({ error: 'Failed to fetch collector performance' });
  }
});

// Get ward-wise performance
router.get('/ward-performance', requireAdmin, async (req, res) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        users: {
          where: { role: 'CITIZEN' },
          select: { points: true }
        },
        homes: {
          include: {
            user: {
              select: { points: true }
            }
          }
        }
      }
    });

    const wardPerformance = wards.map(ward => {
      const citizens = ward.users;
      const avgPoints = citizens.length > 0 
        ? citizens.reduce((sum, user) => sum + user.points, 0) / citizens.length 
        : 0;

      const totalHomes = ward.homes.length;
      const assignedHomes = ward.homes.filter(home => home.user).length;
      const avgHomePoints = ward.homes
        .filter(home => home.user)
        .reduce((sum, home) => sum + home.user.points, 0) / Math.max(assignedHomes, 1);

      return {
        id: ward.id,
        name: ward.name,
        number: ward.number,
        totalCitizens: citizens.length,
        totalHomes,
        assignedHomes,
        averagePoints: avgPoints,
        averageHomePoints: avgHomePoints,
        complianceRate: totalHomes > 0 ? (assignedHomes / totalHomes) * 100 : 0
      };
    });

    // Sort by average points
    wardPerformance.sort((a, b) => b.averagePoints - a.averagePoints);

    res.json({ wardPerformance });
  } catch (error) {
    console.error('Ward performance error:', error);
    res.status(500).json({ error: 'Failed to fetch ward performance' });
  }
});

// Get conflict statistics
router.get('/conflict-stats', requireAdmin, async (req, res) => {
  try {
    const [totalConflicts, pendingConflicts, resolvedConflicts, rejectedConflicts] = await Promise.all([
      prisma.conflict.count(),
      prisma.conflict.count({ where: { status: 'PENDING' } }),
      prisma.conflict.count({ where: { status: 'RESOLVED' } }),
      prisma.conflict.count({ where: { status: 'REJECTED' } })
    ]);

    // Get conflicts by ward
    const conflictsByWard = await prisma.conflict.groupBy({
      by: ['home'],
      _count: true,
      include: {
        home: {
          include: { ward: true }
        }
      }
    });

    const wardConflictStats = {};
    conflictsByWard.forEach(conflict => {
      const wardName = conflict.home.ward.name;
      if (!wardConflictStats[wardName]) {
        wardConflictStats[wardName] = 0;
      }
      wardConflictStats[wardName] += conflict._count;
    });

    res.json({
      summary: {
        total: totalConflicts,
        pending: pendingConflicts,
        resolved: resolvedConflicts,
        rejected: rejectedConflicts,
        resolutionRate: totalConflicts > 0 ? (resolvedConflicts / totalConflicts) * 100 : 0
      },
      byWard: wardConflictStats
    });
  } catch (error) {
    console.error('Conflict stats error:', error);
    res.status(500).json({ error: 'Failed to fetch conflict statistics' });
  }
});

// Get user points distribution
router.get('/points-distribution', requireAdmin, async (req, res) => {
  try {
    const citizens = await prisma.user.findMany({
      where: { role: 'CITIZEN' },
      select: { points: true }
    });

    const distribution = {
      excellent: 0, // 80-100 points
      good: 0,      // 60-79 points
      average: 0,   // 40-59 points
      poor: 0,      // 20-39 points
      veryPoor: 0   // 0-19 points
    };

    citizens.forEach(citizen => {
      if (citizen.points >= 80) distribution.excellent++;
      else if (citizen.points >= 60) distribution.good++;
      else if (citizen.points >= 40) distribution.average++;
      else if (citizen.points >= 20) distribution.poor++;
      else distribution.veryPoor++;
    });

    res.json({ distribution });
  } catch (error) {
    console.error('Points distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch points distribution' });
  }
});

module.exports = router; 