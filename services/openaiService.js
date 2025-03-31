/**
 * OpenAI Service - Centralized OpenAI API integration
 */
const OpenAI = require('openai');

// Create the OpenAI client
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("✅ OpenAI client initialized successfully in openaiService");
} catch (error) {
  console.error("❌ OpenAI initialization error in openaiService:", error.message);
  // Create a fallback implementation
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: "I'm sorry, but there's an issue with the AI service. Please try again later." } }]
        })
      }
    },
    embeddings: {
      create: async () => ({ data: [{ embedding: new Array(1536).fill(0) }] })
    }
  };
}

/**
 * Creates a chat completion using OpenAI
 * @param {Array|String} messages - Array of message objects {role, content} or a string
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - OpenAI response
 */
async function createChatCompletion(messages, options = {}) {
  try {
    const defaultOptions = {
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1000
    };
    
    // Handle both array and string inputs
    const formattedMessages = Array.isArray(messages) 
      ? messages 
      : [{ role: 'user', content: messages }];
    
    const response = await openai.chat.completions.create({
      ...defaultOptions,
      ...options,
      messages: formattedMessages
    });
    
    return response;
  } catch (error) {
    console.error('OpenAI createChatCompletion error:', error);
    throw error;
  }
}

/**
 * Creates an embedding using OpenAI
 * @param {String} content - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
async function createEmbedding(content) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('OpenAI createEmbedding error:', error);
    throw error;
  }
}

module.exports = {
  openai,
  createChatCompletion,
  createEmbedding
};
