// services/cacheService.js
// Simple in-memory cache implementation without external dependencies

// Create a simple cache using a JavaScript Map
const cache = new Map();
const cacheTTLs = new Map();

// Cleanup function to remove expired items
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cacheTTLs.entries()) {
    if (now > expiry) {
      cache.delete(key);
      cacheTTLs.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get a value from cache
 */
async function get(key) {
  return cache.get(key);
}

/**
 * Store a value in cache with optional TTL
 */
async function set(key, value, ttl = 3600) {
  cache.set(key, value);
  cacheTTLs.set(key, Date.now() + (ttl * 1000));
  return true;
}

/**
 * Delete a value from cache
 */
async function del(key) {
  cacheTTLs.delete(key);
  return cache.delete(key);
}

/**
 * Flush the entire cache
 */
async function flush() {
  cache.clear();
  cacheTTLs.clear();
  return true;
}

/**
 * Get cache stats
 */
function getStats() {
  return {
    keys: cache.size,
    hits: 0, // Not tracking in this simple implementation
    misses: 0, // Not tracking in this simple implementation
    ttl: 3600
  };
}

module.exports = {
  get,
  set,
  del,
  flush,
  getStats
};