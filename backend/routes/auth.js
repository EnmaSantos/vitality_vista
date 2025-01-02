
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Mongoose model

router.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ 
            username: req.body.username, 
            email: req.body.email, 
            password: hashedPassword 
        });
        await user.save();
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const matched = await bcrypt.compare(req.body.password, user.password);
        if (!matched) return res.status(401).json({ error: 'Incorrect password' });
        res.json({ message: 'Login successful' });
    } catch (err) {
        res.status(400).json({ error: 'Error logging in' });
    }
});

module.exports = router;