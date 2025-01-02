const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connectToDb } = require('../src/db');

router.post('/signup', async (req, res) => {
    try {
        const client = await connectToDb();
        const db = client.db();
        const users = db.collection('users');

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { 
            username: req.body.username, 
            email: req.body.email, 
            password: hashedPassword 
        };
        
        await users.insertOne(user);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const client = await connectToDb();
        const db = client.db();
        const users = db.collection('users');

        const user = await users.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const matched = await bcrypt.compare(req.body.password, user.password);
        if (!matched) return res.status(401).json({ error: 'Incorrect password' });
        
        res.json({ message: 'Login successful' });
    } catch (err) {
        res.status(400).json({ error: 'Error logging in' });
    }
});

module.exports = router;