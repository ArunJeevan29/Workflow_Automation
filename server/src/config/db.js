// src/config/db.js
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');

// Force Google (8.8.8.8) and Cloudflare (1.1.1.1) DNS servers
// This fixes Atlas SRV record resolution failures caused by local ISP DNS issues
dns.setServers(['8.8.8.8', '1.1.1.1']); // Import the User model

const connectDB = async () => {
  try {
    // 1. Connect to MongoDB (Deprecated options removed!)
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/halleyx');
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // 2. AUTO-SEEDING: Create the Master Admin only if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@halleyx.com' });
    
    if (!adminExists) {
      console.log('⚙️ No Master Admin found. Auto-seeding database...');
      
      const adminUser = new User({
        name: 'Master Admin',
        email: 'admin@halleyx.com',
        password: 'admin123',
        role: 'Admin',
        status: 'Active'
      });

      await adminUser.save();
      console.log('✅ Master Admin created! You can now log in.');
      console.log('👉 Email: admin@halleyx.com | Password: admin123');
    }

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;