const mongoose = require("mongoose");

// In-memory database (Fast Access)
const inMemoryDB = {
    users: [],
    sessions: [],
    leaderboard: [],
    countdowns: [],
};

// MongoDB models (used for syncing)
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
const TrainingSession = mongoose.model("TrainingSession", new mongoose.Schema({}, { strict: false }));
const Leaderboard = mongoose.model("Leaderboard", new mongoose.Schema({}, { strict: false }));

// ============================
// 1. FUNCTIONS TO GET & UPDATE DATA
// ============================

// Get user data (fast lookup)
inMemoryDB.getUser = async (userId) => {
    let user = inMemoryDB.users.find(u => u.userId === userId);
    
    if (!user) {
        user = await User.findById(userId);
        if (user) inMemoryDB.users.push(user);
    }
    
    return user;
};

// Get training session data
inMemoryDB.getSession = async (sessionId) => {
    let session = inMemoryDB.sessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
        session = await TrainingSession.findOne({ sessionId });
        if (session) inMemoryDB.sessions.push(session);
    }
    
    return session;
};

// Get leaderboard data
inMemoryDB.getLeaderboard = async () => {
    if (inMemoryDB.leaderboard.length === 0) {
        const leaderboardData = await Leaderboard.find().sort({ score: -1 }).limit(10);
        inMemoryDB.leaderboard = leaderboardData;
    }
    return inMemoryDB.leaderboard;
};

// Update leaderboard score
inMemoryDB.updateLeaderboard = async (userId, score) => {
    const existingEntry = inMemoryDB.leaderboard.find(e => e.userId === userId);
    
    if (existingEntry) {
        existingEntry.score = score;
    } else {
        inMemoryDB.leaderboard.push({ userId, score, lastUpdated: new Date() });
    }

    // Sync to MongoDB in the background
    setTimeout(async () => {
        await Leaderboard.findOneAndUpdate({ userId }, { score }, { upsert: true });
    }, 1000);
};

// Start a training session
inMemoryDB.startSession = async (userId, phase) => {
    const session = { sessionId: `${userId}-${Date.now()}`, userId, phase, startTime: new Date() };

    inMemoryDB.sessions.push(session);

    // Save to MongoDB in background
    setTimeout(async () => {
        await TrainingSession.findOneAndUpdate({ sessionId: session.sessionId }, session, { upsert: true });
    }, 3000);

    return session;
};

// Update training progress
inMemoryDB.updateProgress = async (userId, sessionId, progress) => {
    const session = inMemoryDB.sessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: "Session not found" };

    session.progress = progress;
    session.lastUpdated = new Date();

    setTimeout(async () => {
        await TrainingSession.findOneAndUpdate({ sessionId }, { $set: { progress } });
    }, 5000);

    return session;
};

// ============================
// 2. SYNC DATA TO MONGODB EVERY 5 MINUTES
// ============================
setInterval(async () => {
    console.log("🔄 Syncing in-memory data to MongoDB...");

    try {
        await Promise.all(inMemoryDB.leaderboard.map(async (entry) => {
            await Leaderboard.findOneAndUpdate({ userId: entry.userId }, entry, { upsert: true });
        }));

        await Promise.all(inMemoryDB.sessions.map(async (session) => {
            await TrainingSession.findOneAndUpdate({ sessionId: session.sessionId }, session, { upsert: true });
        }));

        console.log("✅ Sync complete!");
    } catch (error) {
        console.error("❌ Error syncing in-memory DB to MongoDB:", error);
    }
}, 300000); // Sync every 5 minutes

module.exports = inMemoryDB;
