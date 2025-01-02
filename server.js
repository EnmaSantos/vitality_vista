require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectToDb } = require('./db');

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

// Initialize server with database connection
async function startServer() {
    try {
        console.log('🚀 Starting server initialization...');
        
        // Connect to database
        const client = await connectToDb();
        const db = client.db();
        
        console.log('📂 Setting up routes and middleware...');
        
        // Store db connection in app locals
        app.locals.db = db;

        // Start listening
        app.listen(PORT, () => {
            console.log(`🌟 Server is running!
🔗 URL: http://localhost:${PORT}
📊 Database: ${db.databaseName}
⏰ Time: ${new Date().toLocaleString()}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});
