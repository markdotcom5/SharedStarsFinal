const dotenv = require('dotenv');
dotenv.config();

const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const net = require("net");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const listEndpoints = require("express-list-endpoints");
const session = require("express-session");
const EventEmitter = require('events');
const User = require('./models/User');
const UserProgress = require("./models/UserProgress");
const trainingPhysicalApiRoutes = require('./routes/api/training-physical');
const trainingPhysicalRoutes = require('./routes/training/physical');
const cron = require('node-cron');
const dailyBriefingService = require('./services/dailyBriefingService');


// Define ObjectId class for mock mongoose
class ObjectId {
  constructor(id) {
    this.id = id || crypto.randomUUID().replace(/-/g, '');
  }
  
  toString() {
    return this.id;
  }
  
  equals(other) {
    return other && this.id === other.id;
  }
}

// ============================
// 0. MOCK MONGOOSE SETUP - HAS TO BE FIRST
// ============================
// Create mock MongoDB compatibility layer
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));



const mockMongoose = {
  connect: () => {
    console.log('✅ Mock mongoose connect called (no actual connection)');
    return Promise.resolve();
  },
  disconnect: () => {
    console.log('✅ Mock mongoose disconnect called');
    return Promise.resolve();
  },
  connection: {
    on: (event, callback) => {
      console.log(`✅ Mock MongoDB ${event} event registered`);
      if (event === 'connected') {
        // Call the connected callback immediately
        setTimeout(callback, 10);
      }
    },
    once: (event, callback) => {
      console.log(`✅ Mock MongoDB ${event} event registered (once)`);
      if (event === 'connected') {
        // Call the connected callback immediately
        setTimeout(callback, 10);
      }
    },
    close: (force, callback) => {
      console.log(`✅ Mock MongoDB connection closed`);
      if (callback) callback();
      return Promise.resolve();
    }
  },
  // Add Types directly on mongoose
  Types: {
    ObjectId: ObjectId,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    Mixed: Object,
    Array: Array,
    Buffer: Buffer
  },
  Schema: function(definition, options) {
    const mockSchema = {
      ...definition,
      set: () => mockSchema,
      pre: (hook, fn) => {
        // Store the pre-save hook
        if (!mockSchema._hooks) mockSchema._hooks = {};
        if (!mockSchema._hooks[hook]) mockSchema._hooks[hook] = [];
        mockSchema._hooks[hook].push(fn);
        return {
          post: () => mockSchema
        };
      },
      methods: {},
      statics: {},
      virtual: (field) => {
        return {
          get: (fn) => mockSchema
        };
      },
      path: () => ({
        validate: () => mockSchema
      }),
      index: () => mockSchema
    };
    
    // Add Types to Schema
    mockSchema.Types = {
      ObjectId: ObjectId,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      Mixed: Object,
      Array: Array,
      Buffer: Buffer
    };
    
    return mockSchema;
  }
};

// Add Schema.Types property to Schema constructor
mockMongoose.Schema.Types = {
  ObjectId: ObjectId,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date, 
  Mixed: Object,
  Array: Array,
  Buffer: Buffer
};

// ============================
// 0. IMPORTANT: MONGOOSE COMPLETE CUTOFF
// ============================
// This needs to be at the very top, before any other modules are loaded
// It will prevent any real mongoose connections
const fs = require('fs');
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock mongoose completely - all modules that try to use mongoose will get this mock
Module.prototype.require = function(id) {
  if (id === 'mongoose') {
    return mockMongoose;
  }
  
  // Special case for moduleLoader
  if (id === './modules/moduleLoader' || id === '../modules/moduleLoader') {
    return {
      init: function() {
        console.log('✅ Mock module loader initialized (no database)');
        return Promise.resolve();
      },
      loadModules: function() {
        console.log('✅ Mock modules loaded (no database)');
        return Promise.resolve([
          { 
            moduleId: 'eva-basic',
            name: 'EVA Basics',
            description: 'Introduction to Extravehicular Activity',
            category: 'EVA',
            level: 'Basic',
            points: 100
          },
          {
            moduleId: 'emergency-procedures',
            name: 'Emergency Procedures',
            description: 'How to handle emergency situations in space',
            category: 'Safety',
            level: 'Advanced',
            points: 250
          },
          {
            moduleId: 'navigation',
            name: 'Space Navigation',
            description: 'Fundamentals of navigation in space',
            category: 'Navigation',
            level: 'Intermediate',
            points: 150
          }
        ]);
      },
      getModuleById: function(moduleId) {
        const modules = [
          { 
            moduleId: 'eva-basic',
            name: 'EVA Basics',
            description: 'Introduction to Extravehicular Activity',
            category: 'EVA',
            level: 'Basic',
            points: 100
          },
          {
            moduleId: 'emergency-procedures',
            name: 'Emergency Procedures',
            description: 'How to handle emergency situations in space',
            category: 'Safety',
            level: 'Advanced',
            points: 250
          },
          {
            moduleId: 'navigation',
            name: 'Space Navigation',
            description: 'Fundamentals of navigation in space',
            category: 'Navigation',
            level: 'Intermediate',
            points: 150
          }
        ];
        
        return Promise.resolve(modules.find(m => m.moduleId === moduleId) || null);
      }
    };
  }
  
  return originalRequire.call(this, id);
};

const app = express();
const server = http.createServer(app);

// Simple in-memory database replacement
const inMemoryDB = {
  users: [],
  sessions: [],
  modules: [],
  progress: [],
  leaderboard: []
};

// ============================
// 1. PROPER MEMORY STORE
// ============================
// Create a proper memory store that extends EventEmitter 
class MemoryStore extends EventEmitter {
  constructor() {
    super();
    this.sessions = {};
  }

  get(sid, callback) {
    const data = this.sessions[sid];
    callback(null, data || null);
  }

  set(sid, session, callback) {
    this.sessions[sid] = session;
    if (callback) callback(null);
  }

  destroy(sid, callback) {
    delete this.sessions[sid];
    if (callback) callback(null);
  }

  clear(callback) {
    this.sessions = {};
    if (callback) callback(null);
  }

  length(callback) {
    const count = Object.keys(this.sessions).length;
    if (callback) callback(null, count);
  }

  all(callback) {
    const sessions = Object.entries(this.sessions).map(([sid, session]) => {
      return [sid, session];
    });
    if (callback) callback(null, sessions);
  }

  touch(sid, session, callback) {
    if (this.sessions[sid]) {
      this.sessions[sid] = session;
    }
    if (callback) callback(null);
  }
}

// ============================
// 2. MIDDLEWARE SETUP
// ============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure JavaScript files are served with the correct MIME type
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});
// Add Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-inline'"
  );
  next();
});
// ✅ Rate Limiting - Prevent API abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);
app.use((req, res, next) => {
  if (req.path.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});
// Create instance of memory store
const sessionStore = new MemoryStore();

// Session middleware using memory store instead of MongoDB
app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Enhance the mockMongoose with the model function
mockMongoose.model = function(name, schema) {
  // Initialize collection if it doesn't exist
  if (!inMemoryDB[name.toLowerCase()]) {
    inMemoryDB[name.toLowerCase()] = [];
  }
  
  // Create a mock model with basic CRUD operations
  const collection = inMemoryDB[name.toLowerCase()];
  
  // Check if this model has already been created
  if (mockMongoose.models && mockMongoose.models[name]) {
    return mockMongoose.models[name];
  }
  
  const mockModel = {
    find: (criteria) => {
      const results = collection.filter(item => {
        if (!criteria) return true;
        return Object.keys(criteria).every(key => {
          if (criteria[key] instanceof ObjectId) {
            return item[key] && item[key].toString() === criteria[key].toString();
          }
          return item[key] === criteria[key];
        });
      });
      
      return {
        sort: () => ({ 
          exec: (cb) => cb ? cb(null, results) : Promise.resolve(results),
          limit: () => ({ exec: (cb) => cb ? cb(null, results.slice(0, 10)) : Promise.resolve(results.slice(0, 10)) })
        }),
        limit: () => ({ 
          exec: (cb) => cb ? cb(null, results.slice(0, 10)) : Promise.resolve(results.slice(0, 10)),
          sort: () => ({ exec: (cb) => cb ? cb(null, results) : Promise.resolve(results) })
        }),
        exec: (cb) => cb ? cb(null, results) : Promise.resolve(results),
        populate: () => ({
          exec: (cb) => cb ? cb(null, results) : Promise.resolve(results),
          sort: () => ({ exec: (cb) => cb ? cb(null, results) : Promise.resolve(results) })
        })
      };
    },
    findOne: (criteria) => {
      const result = collection.find(item => {
        if (!criteria) return true;
        return Object.keys(criteria).every(key => {
          if (criteria[key] instanceof ObjectId) {
            return item[key] && item[key].toString() === criteria[key].toString();
          }
          return item[key] === criteria[key];
        });
      });
      
      return {
        exec: (cb) => cb ? cb(null, result) : Promise.resolve(result),
        populate: () => ({
          exec: (cb) => cb ? cb(null, result) : Promise.resolve(result)
        })
      };
    },
    findById: (id) => {
      const idStr = id instanceof ObjectId ? id.toString() : id;
      const result = collection.find(item => {
        const itemId = item._id instanceof ObjectId ? item._id.toString() : item._id;
        return itemId === idStr;
      });
      
      return {
        exec: (cb) => cb ? cb(null, result) : Promise.resolve(result),
        populate: () => ({
          exec: (cb) => cb ? cb(null, result) : Promise.resolve(result)
        })
      };
    },
    create: function(data) {
      const processData = (item) => {
        // Create a new object from the data
        const newItem = { ...item };
        
        // Generate an _id if one doesn't exist
        if (!newItem._id) {
          newItem._id = new ObjectId();
        }
        
        // Apply any pre-save hooks if they exist
        if (schema && schema._hooks && schema._hooks.save) {
          schema._hooks.save.forEach(hook => {
            // Mock the next function
            const next = (err) => {
              if (err) throw err;
            };
            
            // Set 'this' context to the new item
            const context = {
              ...newItem,
              isModified: (field) => true, // Always return true for simplicity
            };
            
            // Execute the hook
            hook.call(context, next);
          });
        }
        
        return newItem;
      };
      
      if (Array.isArray(data)) {
        const newItems = data.map(processData);
        collection.push(...newItems);
        return Promise.resolve(newItems);
      } else {
        const newItem = processData(data);
        collection.push(newItem);
        return Promise.resolve(newItem);
      }
    },
    updateOne: (criteria, update) => {
      const index = collection.findIndex(item => {
        return Object.keys(criteria).every(key => {
          if (criteria[key] instanceof ObjectId) {
            return item[key] && item[key].toString() === criteria[key].toString();
          }
          return item[key] === criteria[key];
        });
      });
      
      if (index !== -1) {
        if (update.$set) {
          collection[index] = { ...collection[index], ...update.$set };
        }
        if (update.$inc) {
          Object.entries(update.$inc).forEach(([key, value]) => {
            collection[index][key] = (collection[index][key] || 0) + value;
          });
        }
        return Promise.resolve({ nModified: 1, modifiedCount: 1 });
      }
      
      return Promise.resolve({ nModified: 0, modifiedCount: 0 });
    },
    findByIdAndUpdate: (id, update, options) => {
      const idStr = id instanceof ObjectId ? id.toString() : id;
      const index = collection.findIndex(item => {
        const itemId = item._id instanceof ObjectId ? item._id.toString() : item._id;
        return itemId === idStr;
      });
      
      if (index !== -1) {
        if (update.$set) {
          collection[index] = { ...collection[index], ...update.$set };
        } else {
          collection[index] = { ...collection[index], ...update };
        }
        
        return options && options.new 
          ? Promise.resolve(collection[index])
          : Promise.resolve({ nModified: 1, modifiedCount: 1 });
      }
      
      return Promise.resolve(null);
    },
    deleteOne: (criteria) => {
      const initialLength = collection.length;
      const newCollection = collection.filter(item => {
        return !Object.keys(criteria).every(key => {
          if (criteria[key] instanceof ObjectId) {
            return item[key] && item[key].toString() === criteria[key].toString();
          }
          return item[key] === criteria[key];
        });
      });
      
      inMemoryDB[name.toLowerCase()] = newCollection;
      
      return Promise.resolve({ deletedCount: initialLength - newCollection.length });
    },
    countDocuments: (criteria) => {
      const count = collection.filter(item => {
        if (!criteria) return true;
        return Object.keys(criteria).every(key => {
          if (criteria[key] instanceof ObjectId) {
            return item[key] && item[key].toString() === criteria[key].toString();
          }
          return item[key] === criteria[key];
        });
      }).length;
      
      return Promise.resolve(count);
    }
  };
  
  // Store the model
  if (!mockMongoose.models) {
    mockMongoose.models = {};
  }
  mockMongoose.models[name] = mockModel;
  
  return mockModel;
};
// Schedule daily briefing generation at 5 AM
cron.schedule('0 5 * * *', async () => {
  console.log('Running scheduled daily briefing generation');
  try {
    const result = await dailyBriefingService.scheduleDailyBriefing();
    console.log('Completed daily briefing generation:', result);
  } catch (error) {
    console.error('Error in scheduled briefing generation:', error);
  }
});

// You can add other scheduled tasks here as needed
// ============================
// 4. ROUTE IMPORTS & SETUP
// ============================
try {
  // Import all routes
  const userRoutes = require("./routes/userRoutes");   
  const authRoutes = require("./routes/auth");   
  const creditRoutes = require("./routes/credits");   
  const paymentRoutes = require("./routes/payment");   
  const trainingRoutes = require('./routes/training');   
  const leaderboardRoutes = require("./routes/leaderboard");   
  const countdownRoutes = require("./routes/countdown");   
  const progressRoutes = require("./routes/progress");   
  const academyRoutes = require("./routes/academy");   
  const socialPlatformRoutes = require("./routes/socialPlatform");   
  const chatRoutes = require("./routes/chat");   
  const stripeRoutes = require("./routes/stripe/index");   
  const stripeWebhookRoutes = require("./webhooks/stripe");   
  const subscriptionRoutes = require("./routes/subscription");   
  const aiRoutes = require("./routes/aiRoutes");   
  const aiSocialRoutes = require("./routes/aiSocial");   
  const physicalTrainingRoutes = require("./routes/training/physical");   
  const briefingRoutes = require('./routes/api/briefings');   
  const userRoutesAlt = require('./routes/user'); // This one stays

// Import routes
  console.log("✅ Routes imported successfully");

  // Set up routes
  app.use("/api/auth", authRoutes);
  app.use("/api/credits", creditRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/training", trainingRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/countdown", countdownRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/academy", academyRoutes);
  app.use("/api/social", socialPlatformRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/webhook/stripe", stripeWebhookRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/social/auth", aiSocialRoutes);
  app.use("/api/training/physical", physicalTrainingRoutes);
  app.use('/api/training/physical', require('./routes/api/training-physical'));
  app.use('/api/training/physical', trainingPhysicalApiRoutes);
  app.use('/training/physical', trainingPhysicalRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/users', userRoutesAlt);

// Setup briefing routes
app.use('/api/briefings', briefingRoutes);
} catch (error) {
  console.error('❌ Error importing routes:', error);
  
  // Set up basic routes for testing if the main routes fail
  app.get('/api/training/physical', async (req, res) => {
    const progress = await getPhysicalTrainingProgress(req.session.user.id);
    res.json(progress);
});

  
  app.get('/api/auth/test', (req, res) => {
    res.json({ message: 'Auth routes are available' });
  });
}
// Add this middleware after your Content Security Policy middleware
app.use((req, res, next) => {
  if (req.path.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});
// ============================
// 5. STATIC FILES
// ============================
app.use(express.static(path.join(__dirname, "public")));

const staticPages = [
    { route: "/", file: "index.html" },
    { route: "/about", file: "about.html" },
    { route: "/academy", file: "academy.html" },
    { route: "/leaderboard", file: "leaderboard.html" },
    { route: "/login", file: "login.html" },
    { route: "/signup", file: "signup.html" },
    { route: "/subscribe", file: "subscribe.html" },
    { route: "/training", file: "training.html" }
];
staticPages.forEach(({ route, file }) => {
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, "public", file)));
});
app.use(express.static('public'));

// ============================
// 6. ERROR HANDLING
// ============================
app.use((req, res, next) => {
    console.log(`⚠️ 404 Not Found: ${req.originalUrl}`);
    res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// ============================
// 7. SHUTDOWN HANDLING
// ============================
process.on('SIGINT', () => {
    console.log('🛑 Gracefully shutting down');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
    
    // Force close if it takes too long
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 5000);
});

// Handle nodemon restarts
process.once('SIGUSR2', () => {
    console.log('🔄 Nodemon restart received');
    server.close(() => {
        console.log('✅ Server closed for nodemon restart');
        process.kill(process.pid, 'SIGUSR2');
    });
    
    // Force close if it takes too long
    setTimeout(() => {
        console.error('⚠️ Could not close server for nodemon restart, forcing');
        process.kill(process.pid, 'SIGUSR2');
    }, 2000);
});

// ============================
// 8. START SERVER
// ============================
const PORT = process.env.PORT || 3000;

function startServer(port) {
    if (port > 65535) {
        console.error("❌ No available ports. Exiting.");
        process.exit(1);
    }

    server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is in use. Trying next available port...`);
            startServer(port + 1); // ✅ Fix: Add 1 instead of appending digits
        } else {
            console.error("❌ Server error:", err);
            process.exit(1);
        }
    });
}

// Start server
startServer(PORT);


// Export for testing
module.exports = { app, server };