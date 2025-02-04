const mongoose = require("mongoose");
require("dotenv").config();

// Import all your models
const Certification = require("./models/Certification");
const CommunityModels = require("./models/CommunityModels");
const Insight = require("./models/Insight");
const Intervention = require("./models/Intervention");
const Module = require("./models/Module");
const Session = require("./models/Session");
const Subscription = require("./models/Subscription");
const TrainingSession = require("./models/TrainingSession");
const Trial = require("./models/Trial");
const User = require("./models/User");
const UserProgress = require("./models/UserProgress");
const Video = require("./models/Video");
const Achievement = require("./models/achievement"); // make sure the filename matches casing
const Challenge = require("./models/challenge");
const Dashboard = require("./models/dashboard");
const Discussion = require("./models/discussion");
const GroupSession = require("./models/groupSession");
const Leaderboard = require("./models/leaderboard");
const PeerMatch = require("./models/peerMatch");
const StudyGroup = require("./models/studyGroup");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("🚨 MongoDB Connection Error:", err));

const populateDatabase = async () => {
  try {
    // 1. Create a dummy user
    const dummyUser = new User({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword", // replace with an actual hashed password in production
    });
    await dummyUser.save();
    const userId = dummyUser._id;

    // 2. Create Modules (used in TrainingSession & Session)
    const physicalModule = await Module.create({
      name: "Physical Module",
      category: "physical",
      // add other fields as required
    });
    const technicalModule = await Module.create({
      name: "Technical Module",
      category: "technical",
    });

    // 3. Insert Training Sessions with actual moduleIds
    const trainingSessions = [
      {
        sessionType: "physical",
        userId,
        moduleId: physicalModule._id,
        dateTime: new Date(),
        status: "scheduled",
      },
      {
        sessionType: "technical",
        userId,
        moduleId: technicalModule._id,
        dateTime: new Date(),
        status: "completed",
      },
    ];
    await TrainingSession.insertMany(trainingSessions);
    console.log("✅ Training Sessions Inserted with moduleId");

    // 4. Insert Certification(s)
    await Certification.insertMany([
      {
        userId,
        name: "Space Mission Certified",
        description: "Completed space training program.",
        dateEarned: new Date(),
        level: "beginner",
      },
    ]);
    console.log("✅ Certifications Inserted");

    // 5. Insert Community Models
    await CommunityModels.insertMany([
      {
        name: "Community Model A",
        description: "A sample community model.",
      },
    ]);
    console.log("✅ Community Models Inserted");

    // 6. Insert Insights
    await Insight.insertMany([
      {
        title: "Insightful Tip",
        content: "This is a sample insight.",
        createdAt: new Date(),
      },
    ]);
    console.log("✅ Insights Inserted");

    // 7. Insert Interventions
    await Intervention.insertMany([
      {
        name: "Intervention A",
        description: "A sample intervention.",
        active: true,
      },
    ]);
    console.log("✅ Interventions Inserted");

    // 8. Insert Sessions (generic sessions)
    await Session.insertMany([
      {
        userId,
        moduleId: physicalModule._id,
        dateTime: new Date(),
        status: "completed",
      },
    ]);
    console.log("✅ Sessions Inserted");

    // 9. Insert Subscriptions
    await Subscription.insertMany([
      {
        userId,
        plan: "individual",
        status: "active",
      },
    ]);
    console.log("✅ Subscriptions Inserted");

    // 10. Insert Trials
    await Trial.insertMany([
      {
        userId,
        trialStart: new Date(),
        trialEnd: new Date(new Date().setDate(new Date().getDate() + 7)),
      },
    ]);
    console.log("✅ Trials Inserted");

    // 11. Insert User Progress
    await UserProgress.insertMany([
      {
        userId,
        progress: 50,
        updatedAt: new Date(),
      },
    ]);
    console.log("✅ User Progress Inserted");

    // 12. Insert Videos
    await Video.insertMany([
      {
        title: "Introduction to Space",
        url: "http://example.com/video.mp4",
        duration: 120, // seconds
      },
    ]);
    console.log("✅ Videos Inserted");

    // 13. Insert Achievements
    await Achievement.insertMany([
      {
        userId,
        name: "First Milestone",
        description: "Completed the first milestone.",
        earnedAt: new Date(),
      },
    ]);
    console.log("✅ Achievements Inserted");

    // 14. Insert Challenges
    await Challenge.insertMany([
      {
        name: "Space Challenge",
        description: "Complete all training modules.",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    ]);
    console.log("✅ Challenges Inserted");

    // 15. Insert Dashboards
    await Dashboard.insertMany([
      {
        userId,
        widgets: ["progress", "stats", "achievements"],
      },
    ]);
    console.log("✅ Dashboards Inserted");

    // 16. Insert Discussions
    await Discussion.insertMany([
      {
        userId,
        topic: "Getting Started",
        message: "Welcome to the platform!",
        createdAt: new Date(),
      },
    ]);
    console.log("✅ Discussions Inserted");

    // 17. Insert Group Sessions
    await GroupSession.insertMany([
      {
        groupId: new mongoose.Types.ObjectId(), // or use an existing group id
        userIds: [userId],
        sessionTime: new Date(),
      },
    ]);
    console.log("✅ Group Sessions Inserted");

    // 18. Insert Leaderboards
    await Leaderboard.insertMany([
      {
        userId,
        score: 1000,
        rank: 1,
        category: "global",
        lastUpdated: new Date(),
      },
    ]);
    console.log("✅ Leaderboards Inserted");

    // 19. Insert Peer Matches
    await PeerMatch.insertMany([
      {
        user1: userId,
        user2: new mongoose.Types.ObjectId(),
        status: "active",
      },
    ]);
    console.log("✅ Peer Matches Inserted");

    // 20. Insert Study Groups
    await StudyGroup.insertMany([
      {
        groupName: "Space Explorers",
        description: "Group for aspiring astronauts.",
        members: [userId],
      },
    ]);
    console.log("✅ Study Groups Inserted");

    console.log("✅ ALL Collections Populated Successfully!");
  } catch (err) {
    console.error("🚨 Error inserting data:", err);
  } finally {
    mongoose.connection.close();
  }
};

(async () => {
  await populateDatabase();
})();
