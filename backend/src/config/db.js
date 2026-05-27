const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    if (!env.MONGODB_URI) {
      throw new Error('MONGODB_URI not configured in environment variables');
    }
    
    const conn = await mongoose.connect(env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log(`\n✓ MongoDB Connected Successfully`);
    console.log(`  Database: ${conn.connection.name}`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Port: ${conn.connection.port}\n`);
    
    return conn;
  } catch (error) {
    console.error(`\n✗ MongoDB Connection Error:`);
    console.error(`  ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('  ACTION: Check your network connection and MongoDB Atlas cluster status');
    } else if (error.message.includes('authentication failed')) {
      console.error('  ACTION: Verify MongoDB credentials in MONGODB_URI');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('  ACTION: Check DNS resolution and cluster URL format');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
