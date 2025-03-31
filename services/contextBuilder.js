// services/contextBuilder.js
const UserProgress = require('../models/UserProgress');
const StellaConversation = require('../models/StellaConversation');

async function buildUserContext(userId) {
  try {
    // Get user progress data
    const userProgress = await UserProgress.findOne({ userId }).lean();
    
    // Get recent conversations
    const recentConversations = await StellaConversation.find({ userId })
      .sort({ timestamp: -1 })
      .limit(3)
      .lean();
    
    // Create baseline context
    const context = {
      profile: {
        name: "Astronaut Trainee", // Default name
        subscription: "Standard",
        experienceLevel: "Beginner"
      },
      currentModule: "Introduction",
      moduleProgress: [],
      assessmentResults: [],
      trainingHistory: [],
      recentConversations: []
    };
    
    // Enhance with user progress if available
    if (userProgress) {
      // Determine experience level
      let experienceLevel = "Beginner";
      if (userProgress.credits && userProgress.credits.total > 1000) {
        experienceLevel = "Advanced";
      } else if (userProgress.credits && userProgress.credits.total > 300) {
        experienceLevel = "Intermediate";
      }
      
      // Find active modules
      const activeModules = userProgress.moduleProgress
        .filter(m => m.completedSessions > 0)
        .sort((a, b) => 
          (b.lastSessionDate || new Date(0)) - (a.lastSessionDate || new Date(0))
        );
      
      // Find completed certifications
      const certifications = userProgress.certifications || [];
      const activeCertifications = certifications.filter(c => c.status === 'active');
      
      // Get physical training progress
      const physicalProgress = userProgress.physicalTraining || {};
      
      // Update context with rich user data
      context.profile.experienceLevel = experienceLevel;
      context.currentModule = activeModules.length > 0 ? activeModules[0].moduleId : "Introduction";
      context.moduleProgress = activeModules.map(m => ({
        moduleId: m.moduleId,
        completedSessions: m.completedSessions,
        progress: m.missionProgress ? 
          Array.from(m.missionProgress.entries()).map(([key, value]) => ({ mission: key, progress: value })) : 
          []
      }));
      context.achievements = userProgress.achievements || [];
      context.physicalTraining = physicalProgress;
      context.certifications = activeCertifications;
      context.credits = userProgress.credits;
    }
    
    // Add recent conversations
    if (recentConversations && recentConversations.length > 0) {
      context.recentConversations = recentConversations.map(c => ({
        fromUser: c.fromUser,
        content: c.content.substring(0, 100) + (c.content.length > 100 ? '...' : ''),
        timestamp: c.timestamp
      }));
    }
    
    return context;
  } catch (error) {
    console.error('Error building user context:', error);
    return {
      profile: { experienceLevel: "Beginner" },
      currentModule: "Introduction"
    };
  }
}

module.exports = { buildUserContext };