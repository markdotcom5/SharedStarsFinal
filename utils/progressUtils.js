// Enhanced utility functions for progress tracking
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');

/**
 * Comprehensive Progress Utility Functions
 * Provides robust tools for tracking, analyzing, and updating user progress
 */
const progressUtils = {
  /**
   * Core calculation utilities
   */
  calculateCompletion: (completed, total) => {
    if (!total) return 0;
    return Math.floor((completed / total) * 100);
  },
    
  calculateStreak: (sessions) => {
    if (!sessions || !sessions.length) return 0;
    
    // Advanced streak calculation with timestamps
    if (sessions[0].timestamp) {
      // Sort sessions by date (newest first)
      const sortedSessions = [...sessions].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      let streak = 1;
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Check consecutive days
      for (let i = 1; i < sortedSessions.length; i++) {
        const current = new Date(sortedSessions[i-1].timestamp);
        const previous = new Date(sortedSessions[i].timestamp);
        
        // Calculate days between sessions
        const daysDiff = Math.round(Math.abs(current - previous) / oneDayMs);
        
        if (daysDiff === 1) {
          streak++;
        } else if (daysDiff > 1) {
          break; // Streak broken
        }
      }
      
      return streak;
    }
    
    return sessions.length; // Simple count if no timestamps
  },
  
  /**
   * Database access utilities
   */
  safeGetUserProgress: async (userId) => {
    try {
      if (!userId) return null;
      return await UserProgress.findOne({ userId });
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  },
  
  getUserProgressWithModules: async (userId) => {
    try {
      if (!userId) return null;
      
      // Aggregation for detailed progress including module details
      return await UserProgress.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'modules', // Adjust based on your collection name
            localField: 'completedModules',
            foreignField: 'moduleId',
            as: 'completedModuleDetails'
          }
        },
        {
          $project: {
            userId: 1,
            completedModules: 1,
            moduleProgress: 1,
            completedModuleDetails: {
              moduleId: 1,
              name: 1,
              category: 1,
              level: 1
            },
            activeModule: 1,
            streakDays: 1,
            lastActivity: 1
          }
        }
      ]);
    } catch (error) {
      console.error('Error getting user progress with modules:', error);
      return null;
    }
  },
  
  /**
   * Data validation utilities
   */
  isValidObjectId: (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  },
  
  isValidProgress: (percentage) => {
    return !isNaN(percentage) && percentage >= 0 && percentage <= 100;
  },
  
  /**
   * Progress update utilities
   */
  updateModuleProgress: async (userId, moduleId, percentage) => {
    try {
      if (!userId || !moduleId) return null;
      
      // Validate percentage
      const safePercentage = Math.min(100, Math.max(0, percentage));
      
      const update = {
        $set: {
          [`moduleProgress.${moduleId}`]: safePercentage,
          lastActivity: new Date()
        }
      };
      
      // Also set as active module if progress is between 1-99%
      if (safePercentage > 0 && safePercentage < 100) {
        update.$set.activeModule = moduleId;
      }
      
      return await UserProgress.findOneAndUpdate(
        { userId },
        update,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error updating module progress:', error);
      return null;
    }
  },
  
  incrementModuleProgress: async (userId, moduleId, increment = 10) => {
    try {
      if (!userId || !moduleId) return null;
      
      // Get current progress
      const progress = await progressUtils.safeGetUserProgress(userId);
      const currentProgress = progress?.moduleProgress?.[moduleId] || 0;
      
      // Calculate new progress (cap at 100)
      const newProgress = Math.min(100, currentProgress + increment);
      
      return await progressUtils.updateModuleProgress(userId, moduleId, newProgress);
    } catch (error) {
      console.error('Error incrementing module progress:', error);
      return null;
    }
  },
  
  markModuleCompleted: async (userId, moduleId) => {
    try {
      if (!userId || !moduleId) return null;
      
      const update = {
        $addToSet: { completedModules: moduleId },
        $set: { 
          [`moduleProgress.${moduleId}`]: 100,
          lastActivity: new Date()
        }
      };
      
      // If this was the active module, clear it
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (progress?.activeModule === moduleId) {
        update.$unset = { activeModule: "" };
      }
      
      return await UserProgress.findOneAndUpdate(
        { userId },
        update,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error marking module as completed:', error);
      return null;
    }
  },
  
  recordTrainingActivity: async (userId, activityData) => {
    try {
      if (!userId) return null;
      
      const update = {
        $push: { 
          activities: {
            ...activityData,
            timestamp: new Date()
          }
        },
        $set: { lastActivity: new Date() }
      };
      
      // Update streak if applicable
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (progress) {
        const lastActivityDate = progress.lastActivity || new Date(0);
        const today = new Date();
        
        // Check if last activity was yesterday or earlier
        if (today.getDate() !== lastActivityDate.getDate() || 
            today.getMonth() !== lastActivityDate.getMonth() || 
            today.getFullYear() !== lastActivityDate.getFullYear()) {
          
          // Determine if streak continues or resets
          const dayDiff = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            // Continue streak
            update.$inc = { streakDays: 1 };
          } else if (dayDiff > 1) {
            // Reset streak
            update.$set.streakDays = 1;
          }
        }
      }
      
      return await UserProgress.findOneAndUpdate(
        { userId },
        update,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error recording training activity:', error);
      return null;
    }
  },
  
  /**
   * Progress analysis utilities
   */
  getProgressSummary: async (userId) => {
    try {
      if (!userId) return null;
      
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (!progress) return { completed: 0, total: 0, percentage: 0, streak: 0 };
      
      // Get module counts from database instead of hardcoding
      const ModuleModel = mongoose.model('Module');
      const totalModules = await ModuleModel.countDocuments();
      
      const completedCount = progress.completedModules?.length || 0;
      
      return {
        completed: completedCount,
        total: totalModules,
        percentage: progressUtils.calculateCompletion(completedCount, totalModules),
        streak: progress.streakDays || 0,
        lastActivity: progress.lastActivity
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return { completed: 0, total: 0, percentage: 0, streak: 0 };
    }
  },
  
  getModuleProgressDetails: async (userId, moduleId) => {
    try {
      if (!userId || !moduleId) return null;
      
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (!progress) return { percentage: 0, completed: false };
      
      const percentage = progress.moduleProgress?.[moduleId] || 0;
      const completed = progress.completedModules?.includes(moduleId) || false;
      
      return { percentage, completed };
    } catch (error) {
      console.error('Error getting module progress details:', error);
      return { percentage: 0, completed: false };
    }
  },
  
  getUserRank: async (userId) => {
    try {
      if (!userId) return { rank: 0, totalUsers: 0 };
      
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (!progress) return { rank: 0, totalUsers: 0 };
      
      // Count completed modules for all users and rank them
      const rankings = await UserProgress.aggregate([
        {
          $project: {
            userId: 1,
            completedCount: { $size: { $ifNull: ["$completedModules", []] } }
          }
        },
        { $sort: { completedCount: -1 } }
      ]);
      
      const totalUsers = rankings.length;
      const userIndex = rankings.findIndex(r => r.userId.toString() === userId.toString());
      
      return {
        rank: userIndex !== -1 ? userIndex + 1 : totalUsers,
        totalUsers,
        percentile: userIndex !== -1 ? 
          Math.floor(((totalUsers - userIndex) / totalUsers) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return { rank: 0, totalUsers: 0, percentile: 0 };
    }
  },
  
  getRecommendedModules: async (userId) => {
    try {
      if (!userId) return [];
      
      const progress = await progressUtils.safeGetUserProgress(userId);
      if (!progress) return [];
      
      const completedModules = progress.completedModules || [];
      const ModuleModel = mongoose.model('Module');
      
      // Find modules not yet completed
      const availableModules = await ModuleModel.find({
        moduleId: { $nin: completedModules }
      });
      
      // Sort modules by prerequisites and difficulty
      // This is a simplified recommendation algorithm
      return availableModules
        .filter(module => {
          // Filter out modules with unmet prerequisites
          if (!module.prerequisites || module.prerequisites.length === 0) {
            return true;
          }
          return module.prerequisites.every(prereq => 
            completedModules.includes(prereq)
          );
        })
        .sort((a, b) => a.level - b.level)
        .slice(0, 3);
      
    } catch (error) {
      console.error('Error getting recommended modules:', error);
      return [];
    }
  }
};
module.exports = progressUtils;