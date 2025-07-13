const express = require('express');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalCitizens = await prisma.user.count({ where: { role: 'CITIZEN' } });
    const totalCollectors = await prisma.user.count({ where: { role: 'COLLECTOR' } });
    const totalWards = await prisma.ward.count();
    const totalHomes = await prisma.home.count();
    const totalConflicts = await prisma.conflict.count();
    const pendingConflicts = await prisma.conflict.count({ where: { status: 'PENDING' } });

    // Get average points
    const avgPoints = await prisma.user.aggregate({
      where: { role: 'CITIZEN' },
      _avg: { points: true }
    });

    // Get ward performance
    const wardPerformance = await prisma.ward.findMany({
      include: {
        users: {
          where: { role: 'CITIZEN' },
          select: { points: true }
        },
        _count: {
          select: { homes: true }
        }
      }
    });

    // Calculate ward averages
    const wardsWithAvg = wardPerformance.map(ward => ({
      id: ward.id,
      name: ward.name,
      number: ward.number,
      homeCount: ward._count.homes,
      citizenCount: ward.users.length,
      avgPoints: ward.users.length > 0 
        ? ward.users.reduce((sum, user) => sum + user.points, 0) / ward.users.length 
        : 0
    }));

    // Sort wards by average points
    const sortedWards = wardsWithAvg.sort((a, b) => b.avgPoints - a.avgPoints);
    const mostCompliantWard = sortedWards[0];
    const leastCompliantWard = sortedWards[sortedWards.length - 1];

    res.json({
      overview: {
        totalUsers,
        totalCitizens,
        totalCollectors,
        totalWards,
        totalHomes,
        totalConflicts,
        pendingConflicts,
        averagePoints: avgPoints._avg.points || 0
      },
      wardPerformance: {
        mostCompliant: mostCompliantWard,
        leastCompliant: leastCompliantWard,
        allWards: sortedWards
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get recent conflicts
router.get('/recent-conflicts', requireAdmin, async (req, res) => {
  try {
    const recentConflicts = await prisma.conflict.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        home: {
          include: { ward: true }
        },
        collector: true,
        citizen: true
      }
    });

    res.json({ conflicts: recentConflicts });
  } catch (error) {
    console.error('Recent conflicts error:', error);
    res.status(500).json({ error: 'Failed to fetch recent conflicts' });
  }
});

// Get top performers (citizens with highest points)
router.get('/top-performers', requireAdmin, async (req, res) => {
  try {
    const topPerformers = await prisma.user.findMany({
      where: { role: 'CITIZEN' },
      take: 10,
      orderBy: { points: 'desc' },
      include: { ward: true }
    });

    res.json({ performers: topPerformers });
  } catch (error) {
    console.error('Top performers error:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// Get citizen point scores with scoring logic
router.get('/citizen-scores', requireAdmin, async (req, res) => {
  try {
    const citizens = await prisma.user.findMany({
      where: { role: 'CITIZEN' },
      include: {
        ward: true,
        conflictsAsCitizen: {
          where: { status: 'RESOLVED' },
          select: { id: true }
        }
      },
      orderBy: { points: 'desc' }
    });

    const citizensWithScores = citizens.map(citizen => {
      // Calculate score based on conflicts
      // +1 if no concern raised, -2 if valid concern raised
      const validConcerns = citizen.conflictsAsCitizen.length;
      const baseScore = citizen.points;
      
      return {
        id: citizen.id,
        name: citizen.name,
        phone: citizen.phone,
        ward: citizen.ward,
        basePoints: baseScore,
        validConcerns,
        score: baseScore - (validConcerns * 2), // -2 for each valid concern
        createdAt: citizen.createdAt
      };
    });

    res.json({ citizens: citizensWithScores });
  } catch (error) {
    console.error('Citizen scores error:', error);
    res.status(500).json({ error: 'Failed to fetch citizen scores' });
  }
});

module.exports = router; 