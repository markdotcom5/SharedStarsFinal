// mockBcrypt.js - Simple mock implementation for development
module.exports = {
  hash: (password, saltRounds) => Promise.resolve(`hashed_${password}`),
  compare: (password, hash) => Promise.resolve(hash === `hashed_${password}`)
};
