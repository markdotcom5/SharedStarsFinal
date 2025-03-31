require('dotenv').config();

console.log('Mongo URI:', process.env.MONGODB_URI);
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
