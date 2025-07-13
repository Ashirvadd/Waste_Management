const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to get current role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { ward: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireCollector = (req, res, next) => {
  if (req.user.role !== 'COLLECTOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Collector access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCollector
}; 