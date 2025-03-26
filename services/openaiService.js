const { OpenAI } = require('openai');  // Note the { } around OpenAI
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getOpenAIResponse(question, context) {
  const prompt = `
    You are STELLA, an advanced AI training assistant for astronauts.
    
    User Profile:
    Name: ${context.profile.name}
    Subscription Level: ${context.profile.subscription}
    Experience Level: ${context.profile.experienceLevel}
    
    Current Training Module: ${context.currentModule}
    Module Progress: ${JSON.stringify(context.moduleProgress)}
    Assessment Results: ${JSON.stringify(context.assessmentResults)}
    
    User Question: ${question}
    
    Provide a personalized, helpful response based on the above context.
  `;

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: prompt }]
  });

  return completion.choices[0].message.content.trim();
}

module.exports = getOpenAIResponse;