// services/openaiService.js
const { OpenAI } = require('openai');

// Create a configured OpenAI instance with proper error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized successfully');
} catch (error) {
  console.error('❌ OpenAI initialization error:', error.message);
  // Provide a fallback to prevent crashes
  openai = {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: "OpenAI service unavailable" } }] })
      }
    }
  };
}

// Export both the configured instance and the class
module.exports = {
  openai,
  OpenAI
};