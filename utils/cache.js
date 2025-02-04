// utils/cache.js

// Simple in-memory cache store
const cacheStore = {};

// Optionally, you can implement TTL (time-to-live) functionality using setTimeout.
// For now, this is a basic implementation without TTL expiration.

module.exports = {
  // Retrieves a value for a given key from the cache.
  // Returns a promise to mimic async behavior.
  get: async (key) => {
    return cacheStore[key] || null;
  },

  // Sets a value for a given key in the cache.
  // ttl is in seconds; this stub doesn't automatically expire entries.
  set: async (key, value, ttl) => {
    cacheStore[key] = value;

    // Optional: Implement TTL expiration
    if (ttl && typeof ttl === 'number') {
      setTimeout(() => {
        delete cacheStore[key];
      }, ttl * 1000);
    }
  }
};
