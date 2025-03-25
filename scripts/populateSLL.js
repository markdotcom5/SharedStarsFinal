// populateSLL.js - Run with: node scripts/populateSLL.js

require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Import models - fix the path
const StellaConversation = require('../models/StellaConversation');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initial seed questions by category
const seedQuestions = {
  'physical_training': [
    "What's the most important core exercise for zero gravity?",
    "How do I prepare for the physical effects of microgravity?",
    "What's the best way to maintain muscle mass during long space missions?",
    "How can I improve my vestibular adaptation for space?",
    "What balance exercises are most effective for astronaut training?"
  ],
  'mental_preparation': [
    "How do astronauts deal with isolation during missions?",
    "What cognitive exercises help with stress in confined spaces?",
    "How can I improve my decision-making under pressure?",
    "What techniques help with spatial awareness in zero gravity?",
    "How do I prepare mentally for emergency situations in space?"
  ],
  'technical_training': [
    "What systems should I focus on learning first for spacecraft operation?",
    "How detailed does my understanding of life support systems need to be?",
    "What programming languages are most useful for space missions?",
    "How do navigation systems work in deep space?",
    "What's the most important technical skill for an astronaut?"
  ],
  'leadership': [
    "How do leadership dynamics change during space missions?",
    "What's the best approach to conflict resolution in isolated teams?",
    "How are decisions made during communication delays with mission control?",
    "What leadership qualities are most important for space mission commanders?",
    "How do I effectively delegate tasks in a spacecraft environment?"
  ],
  'mission_preparation': [
    "What's the training timeline for a typical space mission?",
    "How do astronauts prepare for specific mission objectives?",
    "What's the balance between specialist and generalist skills?",
    "How much mission-specific training happens vs. general preparation?",
    "What certifications are required before mission assignment?"
  ]
};

// System prompt for generating responses
const systemPrompt = `You are STELLA (Space Training Enhancement through Learning & Leadership Adaptation), 
the AI training assistant for SharedStars space training platform. SharedStars helps prepare astronaut 
candidates with personalized training programs for space missions.

Your responses should be:
1. Highly informative and technically accurate about space training
2. Focused on actionable guidance and practical advice
3. Encouraging but realistic about space training requirements
4. Include specific next steps or training recommendations
5. Maintain a supportive, expert tone

When discussing space flight opportunities, explain that SharedStars enhances selection chances but
actual space flights depend on partnerships with commercial providers and individual qualification.`;

async function generateResponse(question, category) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `This question is related to ${category.replace('_', ' ')}.` },
        { role: "user", content: question }
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating response for "${question}":`, error);
    return null;
  }
}

async function generateVariations(baseQuestion, category, count = 3) {
  try {
    const prompt = `Generate ${count} variations of this question about ${category.replace('_', ' ')} for astronaut training. Make them sound like different people asking similar things, with varying vocabulary and complexity:
    
    Original: "${baseQuestion}"
    
    Only return the questions, numbered 1, 2, 3, etc. No explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    const response = completion.choices[0].message.content;
    const variations = response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.\s/))
      .map(line => line.replace(/^\d+\.\s+/, '').trim())
      .filter(line => line.length > 0);

    return variations;
  } catch (error) {
    console.error(`Error generating variations for "${baseQuestion}":`, error);
    return [];
  }
}

async function populateSLL() {
  console.log('Starting SLL population...');
  const userId = 'system_seed';
  let totalAdded = 0;

  // Process each category
  for (const [category, questions] of Object.entries(seedQuestions)) {
    console.log(`Processing ${category} questions...`);
    
    // Process each seed question in the category
    for (const question of questions) {
      // Generate response to original question
      const response = await generateResponse(question, category);
      if (!response) continue;
      
      const sessionId = `stella_seed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date();
      
      // Store original Q&A pair
      await StellaConversation.create({
        userId,
        fromUser: true,
        content: question,
        metadata: {
          sessionId,
          timestamp,
          category
        },
        aiAnalysis: {
          questionType: 'informational',
          topics: [category.replace('_', ' ')],
          keyEntities: []
        }
      });
      
      await StellaConversation.create({
        userId,
        fromUser: false,
        content: response,
        metadata: {
          sessionId,
          timestamp: new Date(timestamp.getTime() + 1000)
        },
        aiAnalysis: {
          confidenceScore: 0.95,
          actionItems: extractActionItems(response)
        }
      });
      
      totalAdded += 2;
      console.log(`Added Q&A pair for: "${question.substring(0, 30)}..."`);
      
      // Generate variations
      const variations = await generateVariations(question, category);
      
      // Store variations with same response
      for (const variation of variations) {
        const varSessionId = `stella_seed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const varTimestamp = new Date();
        
        await StellaConversation.create({
          userId,
          fromUser: true,
          content: variation,
          metadata: {
            sessionId: varSessionId,
            timestamp: varTimestamp,
            category,
            isVariation: true,
            originalQuestion: question
          },
          aiAnalysis: {
            questionType: 'informational',
            topics: [category.replace('_', ' ')],
            keyEntities: []
          }
        });
        
        await StellaConversation.create({
          userId,
          fromUser: false,
          content: response,
          metadata: {
            sessionId: varSessionId,
            timestamp: new Date(varTimestamp.getTime() + 1000)
          },
          aiAnalysis: {
            confidenceScore: 0.95,
            actionItems: extractActionItems(response)
          }
        });
        
        totalAdded += 2;
        console.log(`Added variation Q&A pair for: "${variation.substring(0, 30)}..."`);
      }
      
      // Sleep to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`SLL population complete. Added ${totalAdded} documents to the database.`);
}

// Extract action items from a response
function extractActionItems(text) {
  const bulletPointMatch = text.match(/(\n-[^\n]+)+/g);
  if (bulletPointMatch) {
    return bulletPointMatch[0]
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.trim().substring(1).trim());
  }
  
  const paragraphs = text.split('\n\n');
  if (paragraphs.length > 1) {
    for (const paragraph of paragraphs.slice(1)) {
      const lines = paragraph.split('\n');
      const bulletLines = lines.filter(line => 
        line.trim().startsWith("- ") || 
        line.trim().startsWith("* ") || 
        line.trim().match(/^\d+\./)
      );
      
      if (bulletLines.length > 0) {
        return bulletLines.map(line => 
          line.trim()
            .replace(/^[- *]\s+/, "")
            .replace(/^\d+\.\s+/, "")
        );
      }
    }
  }
  
  return [
    "Start your assessment", 
    "Begin Core & Balance training", 
    "Track your progress"
  ];
}

// Run the population script
populateSLL()
  .then(() => {
    console.log('SLL population completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in SLL population script:', err);
    process.exit(1);
  });