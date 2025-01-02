const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    throw new Error('MONGODB_URI is not defined in environment variables');
}

let client = null;

async function connectToDb() {
    try {
        if (client) {
            console.log('📊 Using existing database connection');
            return client;
        }

        console.log('🔄 Connecting to MongoDB...');
        client = await MongoClient.connect(mongoUri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        const db = client.db();
        console.log(`✅ Successfully connected to MongoDB: ${db.databaseName}`);
        
        // Test the connection with a simple query
        const collections = await db.listCollections().toArray();
        console.log(`📚 Available collections: ${collections.map(c => c.name).join(', ')}`);

        return client;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectToDb };