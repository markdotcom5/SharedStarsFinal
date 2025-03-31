// userEngagementAnalyzer.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Define schemas first
const stellaInteractionSchema = new mongoose.Schema({
  userId: String,
  timestamp: Date,
  responseData: {
    processingTime: Number,
    enginesUsed: [String],
    confidence: Number
  },
  queryAnalysis: {
    topics: [String]
  }
}, { strict: false });

const userPersonalitySchema = new mongoose.Schema({
  userId: String,
  traits: {
    honesty: Number,
    humor: Number,
    formality: Number,
    encouragement: Number,
    detail: Number
  }
}, { strict: false });

// Register models with schemas
const StellaInteraction = mongoose.model('StellaInteraction', stellaInteractionSchema);
const UserPersonality = mongoose.model('UserPersonality', userPersonalitySchema);

async function analyzeUserEngagement(days = 7) {
  // Calculate date threshold
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  
  console.log(`Analyzing user engagement for the past ${days} days...`);
  
  // Get recent interactions
  const interactions = await StellaInteraction.find({
    timestamp: { $gte: threshold }
  }).lean();
  
  console.log(`Found ${interactions.length} interactions to analyze`);
  
  // Get all user personalities
  const personalities = await UserPersonality.find().lean();
  
  // Create engagement map
  const userEngagement = {};
  const personalityPerformance = {
    honesty: { high: 0, medium: 0, low: 0 },
    humor: { high: 0, medium: 0, low: 0 },
    formality: { high: 0, medium: 0, low: 0 },
    encouragement: { high: 0, medium: 0, low: 0 },
    detail: { high: 0, medium: 0, low: 0 }
  };
  
  // Process each interaction
  interactions.forEach(interaction => {
    const userId = interaction.userId;
    
    // Initialize user data if not exists
    if (!userEngagement[userId]) {
      userEngagement[userId] = {
        interactionCount: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
        engineUsage: {},
        topics: {},
        confidence: 0
      };
    }
    
    // Update engagement metrics
    userEngagement[userId].interactionCount++;
    
    if (interaction.responseData?.processingTime) {
      userEngagement[userId].totalResponseTime += interaction.responseData.processingTime;
      userEngagement[userId].averageResponseTime = 
        userEngagement[userId].totalResponseTime / userEngagement[userId].interactionCount;
    }
    
    // Track engine usage
    if (interaction.responseData?.enginesUsed) {
      interaction.responseData.enginesUsed.forEach(engine => {
        userEngagement[userId].engineUsage[engine] = 
          (userEngagement[userId].engineUsage[engine] || 0) + 1;
      });
    }
    
    // Track topics
    if (interaction.queryAnalysis?.topics) {
      interaction.queryAnalysis.topics.forEach(topic => {
        userEngagement[userId].topics[topic] = 
          (userEngagement[userId].topics[topic] || 0) + 1;
      });
    }
    
    // Track confidence
    if (interaction.responseData?.confidence) {
      userEngagement[userId].confidence += interaction.responseData.confidence;
    }
  });
  
  // Calculate averages and map to personality settings
  Object.keys(userEngagement).forEach(userId => {
    const user = userEngagement[userId];
    
    // Find user personality
    const personality = personalities.find(p => p.userId === userId);
    
    if (personality && personality.traits) {
      // Calculate satisfaction metrics
      const interactionFrequency = user.interactionCount / days;
      const avgConfidence = user.confidence / user.interactionCount;
      
      // Map personality traits to engagement
      for (const trait in personality.traits) {
        if (personality.traits[trait] > 75) {
          personalityPerformance[trait].high += interactionFrequency * avgConfidence;
        } else if (personality.traits[trait] > 40) {
          personalityPerformance[trait].medium += interactionFrequency * avgConfidence;
        } else {
          personalityPerformance[trait].low += interactionFrequency * avgConfidence;
        }
      }
    }
  });
  
  // Process engine performance
  const enginePerformance = {};
  Object.values(userEngagement).forEach(user => {
    Object.entries(user.engineUsage).forEach(([engine, count]) => {
      if (!enginePerformance[engine]) {
        enginePerformance[engine] = { count: 0, users: 0 };
      }
      enginePerformance[engine].count += count;
      enginePerformance[engine].users++;
    });
  });
  
  // Generate insights
  const insights = {
    totalInteractions: interactions.length,
    activeUsers: Object.keys(userEngagement).length,
    personalityInsights: analyzePersonalityPerformance(personalityPerformance),
    engineInsights: analyzeEnginePerformance(enginePerformance),
    topTopics: getTopTopics(userEngagement),
    recommendations: generateRecommendations(personalityPerformance, enginePerformance, userEngagement)
  };
  
  // Make sure reports directory exists
  if (!fs.existsSync('./reports')) {
    fs.mkdirSync('./reports');
  }
  
  // Write report to file
  const reportPath = `./reports/engagement-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(insights, null, 2));
  
  console.log(`✅ Engagement analysis complete. Report saved to ${reportPath}`);
  return insights;
}

function analyzePersonalityPerformance(data) {
  const insights = {};
  
  for (const trait in data) {
    const { high, medium, low } = data[trait];
    const total = high + medium + low;
    
    if (total === 0) continue;
    
    insights[trait] = {
      highPerformance: (high / total * 100).toFixed(1) + '%',
      mediumPerformance: (medium / total * 100).toFixed(1) + '%',
      lowPerformance: (low / total * 100).toFixed(1) + '%',
      recommendation: high > medium && high > low ? 'high' :
                      medium > high && medium > low ? 'medium' : 'low'
    };
  }
  
  return insights;
}

function analyzeEnginePerformance(data) {
  const insights = {};
  
  for (const engine in data) {
    insights[engine] = {
      usageCount: data[engine].count,
      usagePercentage: (data[engine].count / Object.values(data).reduce((sum, e) => sum + e.count, 0) * 100).toFixed(1) + '%',
      userAdoption: (data[engine].users / Object.keys(data).length * 100).toFixed(1) + '%'
    };
  }
  
  return insights;
}

function getTopTopics(userEngagement) {
  const topicCounts = {};
  
  Object.values(userEngagement).forEach(user => {
    Object.entries(user.topics).forEach(([topic, count]) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + count;
    });
  });
  
  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));
}

function generateRecommendations(personalityData, engineData, userEngagement) {
  const recommendations = [];
  
  // Personality recommendations
  for (const trait in personalityData) {
    const data = personalityData[trait];
    
    if (data.high > data.medium && data.high > data.low) {
      recommendations.push(`Consider setting ${trait} higher in default personality as it performs better`);
    }
  }
  
  // Engine recommendations
  const engines = Object.entries(engineData)
    .sort((a, b) => b[1].count - a[1].count);
  
  if (engines.length > 1) {
    recommendations.push(`Prioritize ${engines[0][0]} engine as it has the highest usage`);
    
    if (engines[engines.length-1][1].count < engines[0][1].count * 0.2) {
      recommendations.push(`Consider improving or removing ${engines[engines.length-1][0]} engine due to low usage`);
    }
  }
  
  return recommendations;
}

// CLI interface
const args = process.argv.slice(2);
const days = args[0] ? parseInt(args[0]) : 7;

analyzeUserEngagement(days)
  .then(() => {
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error in engagement analysis:', error);
    mongoose.disconnect();
    process.exit(1);
  });