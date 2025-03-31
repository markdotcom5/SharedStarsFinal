require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function testMongoDB() {
  console.log("MONGODB_URI from env:", process.env.MONGODB_URI);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    
    // List some collections to verify connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in database:", collections.map(c => c.name).slice(0, 5));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

testMongoDB();