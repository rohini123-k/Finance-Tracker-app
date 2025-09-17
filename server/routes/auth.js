const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Finance App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Finance App!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    await user.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    // Generate auth token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification token expired' });
    }
    res.status(400).json({ message: 'Invalid verification token' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        twoFactorEnabled: req.user.twoFactorEnabled,
        preferences: req.user.preferences,
        bankAccounts: req.user.bankAccounts,
        totalNetWorth: req.user.totalNetWorth,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, preferences } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// Setup 2FA
router.post('/setup-2fa', authenticateToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Finance App (${req.user.email})`,
      issuer: 'Finance App'
    });

    // Save secret temporarily (not enabled yet)
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      message: '2FA setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: '2FA setup failed' });
  }
});

// Verify 2FA setup
router.post('/verify-2fa', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    // Enable 2FA
    req.user.twoFactorEnabled = true;
    await req.user.save();

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: '2FA verification failed' });
  }
});

// Disable 2FA
router.post('/disable-2fa', authenticateToken, async (req, res) => {
  try {
    const { password, token } = req.body;

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // If 2FA is enabled, verify token
    if (req.user.twoFactorEnabled && req.user.twoFactorSecret) {
      const verified = speakeasy.totp.verify({
        secret: req.user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid 2FA token' });
      }
    }

    // Disable 2FA
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    await req.user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: '2FA disable failed' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Password change failed' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
