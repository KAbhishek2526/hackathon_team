const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { domainCheck } = require('../middleware/domainCheck');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, skill_tags, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email, and password are required' });
        }

        const userRole = role === 'global_client' ? 'global_client' : 'student';

        // Domain check only for students
        let college_domain = null;
        let isCollegeVerified = false;

        if (userRole === 'student') {
            if (!domainCheck(email)) {
                return res.status(403).json({ error: 'Email domain not allowed. Use a verified college email (.edu, .ac.in, etc.).' });
            }
            college_domain = email.split('@')[1].toLowerCase();
            isCollegeVerified = true;
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password_hash,
            role: userRole,
            college_domain,
            isCollegeVerified,
            skill_tags: userRole === 'student' ? (skill_tags || []) : [],
        });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role || 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role || 'student' },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
