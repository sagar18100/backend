const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Setup email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        // Check for existing user
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create JWT token payload
        const payload = { user: { id: user.id } };

        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        // Check for user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create JWT token
        const payload = { user: { id: user.id } };

        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/forgotpassword
// @desc    Send password reset email
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'There is no user with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash token and set to resetPasswordToken field (though here we just save plain for simplicity since it's an educational project, 
        // but normally hash it before DB save. We'll stick to a simple approach for ease)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Create reset url (this points to frontend where user can type new password)
        const frontendUrl = process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5500';
        const resetUrl = `${frontendUrl}?resetToken=${resetToken}`;

        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click the link below to set a new password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset - CS Academy',
            html: message
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save();
                return res.status(500).json({ message: 'Email could not be sent' });
            } else {
                res.status(200).json({ message: 'Email sent successfully' });
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/auth/resetpassword/:resetToken
// @desc    Reset password
// @access  Public
router.put('/resetpassword/:resetToken', async (req, res) => {
    try {
        const { password } = req.body;
        const resetToken = req.params.resetToken;

        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Automatically log them in by returning a new token
        const payload = { user: { id: user.id } };

        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email }, message: 'Password updated successfully' });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
