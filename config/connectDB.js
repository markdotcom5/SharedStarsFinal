require('dotenv').config();
const mongoose = require('mongoose');

// After your imports and before routes
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: "native",
      }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

module.exports = connectDB;