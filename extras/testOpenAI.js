require('dotenv').config(); // Load environment variables
const { OpenAI } = require('openai'); // Import OpenAI

// Initialize OpenAI client
const openai = new OpenAI({
});

(async () => {
    try {
        // Send a test request to OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Replace with your desired model
            messages: [{ role: 'user', content: 'Hello, AI!' }],
            max_tokens: 50,
            temperature: 0.7,
        });

        // Log the response from OpenAI
        console.log('API Response:', response.choices[0].message.content);
    } catch (error) {
        // Log any errors
        console.error('Error:', error.response?.data || error.message);
    }
})();
