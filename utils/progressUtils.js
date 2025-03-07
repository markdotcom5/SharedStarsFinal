/**
 * Progress Utility Functions
 * Handles safe operations for user progress
 */
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');

/**
 * Safely retrieve user progress, handling anonymous users and invalid IDs
 * @param {string} userId - User ID to retrieve progress for
 * @returns {Promise<Object|null>} User progress or null
 */
async function safeGetUserProgress(userId) {
  // Handle anonymous users or invalid IDs
  if (userId === 'anonymous' || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  
  try {
    return await UserProgress.findOne({ userId });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} id - String to check
 * @returns {boolean} True if valid ObjectId
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  
  try {
    new mongoose.Types.ObjectId(id);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  safeGetUserProgress,
  isValidObjectId
};