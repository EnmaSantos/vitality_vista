const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connectToDb } = require('../../db');

router.post('/signup', async (req, res) => {
    try {
        console.log('📝 Attempting to create new user:', req.body.email);
        const client = await connectToDb();
        const db = client.db();
        const users = db.collection('users');
        
        // Check if user already exists
        const existingUser = await users.findOne({ email: req.body.email });
        if (existingUser) {
            console.log('❌ User already exists:', req.body.email);
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { 
            username: req.body.username, 
            email: req.body.email, 
            password: hashedPassword 
        };
        
        await users.insertOne(user);
        console.log('✅ User created successfully:', req.body.email);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('❌ Error creating user:', err);
        res.status(400).json({ error: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt for:', req.body.email);
        const client = await connectToDb();
        const db = client.db();
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