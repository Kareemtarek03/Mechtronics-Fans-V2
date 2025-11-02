import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin only.' });
  }
  next();
};

// Get user statistics
router.get('/stats', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const customers = await prisma.user.count({ where: { role: 'customer' } });
    const engineers = await prisma.user.count({ where: { role: 'engineer' } });
    const admins = await prisma.user.count({ where: { role: 'admin' } });

    res.json({
      total: totalUsers,
      customers,
      engineers,
      admins
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users with search and filter
router.get('/users', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by role
    if (role && role !== 'all') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          gender: true,
          role: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, gender } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'customer',
        phone: phone || null,
        gender: gender || null
      }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'USER_CREATE',
        targetUser: `${firstName} ${lastName} (${email})`,
        details: `Created new user with role: ${role || 'customer'}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get single user details
router.get('/users/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        role: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role
router.patch('/users/:id/role', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'engineer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing super admin role
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot change super admin role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'ROLE_CHANGE',
        targetUser: `${user.firstName} ${user.lastName} (${user.email})`,
        details: `Changed role from ${user.role} to ${role}`,
        ipAddress: req.ip
      }
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update user details
router.patch('/users/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent editing super admin
    if (user.role === 'super_admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Cannot edit super admin' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone
      }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'USER_UPDATE',
        targetUser: `${user.firstName} ${user.lastName} (${user.email})`,
        details: 'Updated user details',
        ipAddress: req.ip
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'USER_DELETE',
        targetUser: `${user.firstName} ${user.lastName} (${user.email})`,
        details: `Deleted user with role: ${user.role}`,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get admin logs
router.get('/logs', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.adminLog.count()
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
