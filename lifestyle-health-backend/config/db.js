const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn('⚠️ MONGO_URI is not set. Skipping database connection.');
            return;
        }

        console.log('🔍 Attempting to connect to MongoDB...');

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`🗄️ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        console.warn('⚠️ Continuing without a database connection.');
    }
};

module.exports = connectDB;