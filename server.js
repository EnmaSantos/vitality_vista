const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// API routes
app.use('/api/auth', require('./backend/routes/auth'));

// Serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'landing.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
