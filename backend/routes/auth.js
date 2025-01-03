const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post('/signup', async (req, res) => {
    try {
        console.log('📝 Attempting to create new user:', req.body.email);
        const db = req.app.locals.db;
        const users = db.collection('users');

        // Check if user already exists
        const existingUser = await users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: '❌ User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create new user object
        const newUser = {
            email: req.body.email,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            gender: req.body.gender,
            phoneNumber: req.body.phoneNumber,
            createdAt: new Date()
        };

        // Insert new user into the database
        await users.insertOne(newUser);

        res.status(201).json({ message: '✅ User created successfully' });
    } catch (error) {
        console.error('❌ Error creating new user:', error);
        res.status(500).json({ message: '❌ Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt for:', req.body.email);
        const db = req.app.locals.db;
        const users = db.collection('users');

        const user = await users.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const matched = await bcrypt.compare(req.body.password, user.password);
        if (!matched) return res.status(401).json({ error: 'Incorrect password' });
        
        res.json({ message: 'Login successful' });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(400).json({ error: 'Error logging in' });
    }
});

module.exports = router;