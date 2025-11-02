import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, generateResetToken } from '../utils/jwt.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation helper
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, phone, gender, email, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        gender: gender || null,
        email,
        password: hashedPassword
      }
    });

    // Send welcome email
    await sendWelcomeEmail(email, firstName);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CHECK EMAIL - Verify if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ message: 'Email exists' });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FORGOT PASSWORD - Step 1: Request reset with email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return generic message for security
      return res.json({ message: 'If an account exists, a verification code has been sent' });
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save verification code
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: verificationCode,
        expiresAt
      }
    });

    // Send verification code email
    await sendPasswordResetEmail(email, verificationCode, user.firstName);

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FORGOT PASSWORD - Step 2: Verify code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' });
    }

    // Find valid verification code
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        token: code,
        used: false
      }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    // Return a temporary token for password reset
    const tempToken = generateResetToken();

    res.json({
      message: 'Code verified successfully',
      tempToken,
      resetId: resetRecord.id
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RESET PASSWORD - Step 3: Reset password with verified code
router.post('/reset-password', async (req, res) => {
  try {
    const { resetId, newPassword, confirmPassword } = req.body;

    if (!resetId || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Find reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { id: parseInt(resetId) }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid reset request' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Use req.user which is already set by authenticateToken middleware
    if (!req.user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGOUT (client-side token deletion, but we can invalidate on backend if needed)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;
