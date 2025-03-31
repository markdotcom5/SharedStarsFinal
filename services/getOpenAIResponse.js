// services/getOpenAIResponse.js
const { openai } = require('./openaiService');
const { buildUserContext } = require('./contextBuilder');

async function getOpenAIResponse(question, userId, additionalContext = {}) {
  try {
    // Build the full user context
    const userContext = await buildUserContext(userId);
    
    // Merge with any additional context provided
    const context = { ...userContext, ...additionalContext };

    // Create a system prompt with the rich contextual information
    let systemPrompt = `You are STELLA (Space Training Enhancement through Learning & Leadership Adaptation), 
an advanced AI training assistant for astronauts and space professionals at SharedStars. 
Your primary goal is to provide personalized guidance based on the trainee's progress and needs.`;

    // Add user context
    systemPrompt += `\n\nUser Information:
- Experience Level: ${context.profile.experienceLevel}
- Current Training Focus: ${context.currentModule}
- Credits Earned: ${context.credits ? context.credits.total : 0}
- Physical Training Progress: ${context.physicalTraining ? 
      Math.round(context.physicalTraining.overallProgress || 0) : 0}% complete`;

    // Add module progress if available
    if (context.moduleProgress && context.moduleProgress.length > 0) {
      systemPrompt += `\n\nActive Training Modules:\n${context.moduleProgress.slice(0, 3).map(m => 
        `- ${m.moduleId}: ${m.completedSessions} sessions completed`).join('\n')}`;
    }

    // Add recent achievements if available
    if (context.achievements && context.achievements.length > 0) {
      systemPrompt += `\n\nRecent Achievements:\n${context.achievements.slice(0, 2).map(a => 
        `- ${a.name}: ${a.description}`).join('\n')}`;
    }

    // Add conversation context if available
    if (context.recentConversations && context.recentConversations.length > 0) {
      systemPrompt += `\n\nRecent conversation context:\n${context.recentConversations.map(c => 
        `${c.fromUser ? 'User' : 'STELLA'}: ${c.content}`).join('\n')}`;
    }

    // Add response guidelines
    systemPrompt += `\n\nWhen responding:
1. Be concise, accurate, and highly personalized based on their training history
2. Adapt your guidance to their experience level (${context.profile.experienceLevel})
3. Reference their recent activities when relevant
4. Provide specific, actionable recommendations for their next steps
5. Maintain an encouraging and supportive tone`;

    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}

module.exports = { getOpenAIResponse };