// In middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const applyRateLimit = (req, res, next) => {
  const userId = req.body.userId || req.query.userId || req.params.userId || 'anonymous';
  const now = Date.now();
  
  if (!userRateLimit.has(userId)) {
    userRateLimit.set(userId, { count: 1, resetTime: now + 60000 });
    return next();
  }
  
  const userLimit = userRateLimit.get(userId);
  
  // Reset counter if minute has passed
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + 60000;
    return next();
  }
  
  // Check if limit exceeded with improved message
  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded. Please try again in ${waitTime} seconds.`
    });
  }
  
  // Increment counter and continue
  userLimit.count++;
  next();
};

module.exports = { applyRateLimit };