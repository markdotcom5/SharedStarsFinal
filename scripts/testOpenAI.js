require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Changed from gpt-3.5-turbo to gpt-4o
      messages: [{ role: "user", content: "Hello from SharedStars Academy! What makes you the most advanced GPT model?" }]
    });
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Test Error:", error);
  }
})();