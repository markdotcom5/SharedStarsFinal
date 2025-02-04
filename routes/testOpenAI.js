require('dotenv').config();
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

console.log("Loaded API Key:", process.env.OPENAI_API_KEY ? "Yes" : "No");

// Test endpoint (this one works fine)
router.get('/test', (req, res) => {
    res.json({ message: "OpenAI test route is working" });
});

// Modified chat endpoint to handle the error
router.post('/chat', async (req, res) => {
    try {
        // Add default message if none provided
        const userMessage = req.body?.message || "Hello";
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: userMessage }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });

        res.json({
            success: true,
            data: response.choices[0].message.content.trim(),
            usage: response.usage
        });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: error.type || 'UnknownError',
                details: error.response?.data || null
            }
        });
    }
});

module.exports = router;