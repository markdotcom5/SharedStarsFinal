// utils/securityUtils.js
const crypto = require('crypto');

/**
 * Create a hash of the provided string
 */
function createHash(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex');
}

/**
 * Sanitize a request object to remove sensitive information
 */
function sanitizeRequest(req) {
  // Create a shallow copy
  const sanitized = { ...req };
  
  // Remove potentially sensitive fields
  if (sanitized.deviceInfo) {
    sanitized.deviceInfo = { type: sanitized.deviceInfo.type };
  }
  
  if (sanitized.biometrics) {
    sanitized.biometrics = { present: !!sanitized.biometrics };
  }
  
  return sanitized;
}

/**
 * Sanitize device information
 */
function sanitizeDeviceInfo(deviceInfo) {
  if (!deviceInfo) return {};
  
  return {
    type: deviceInfo.type || 'unknown',
    platform: deviceInfo.platform || 'unknown'
  };
}

module.exports = {
  createHash,
  sanitizeRequest,
  sanitizeDeviceInfo
};