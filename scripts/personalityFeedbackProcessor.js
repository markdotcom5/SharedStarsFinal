/**
 * personalityFeedbackProcessor.js
 * 
 * This script processes user feedback on STELLA responses to improve
 * the personality system over time. It analyzes which personality traits
 * and templates receive positive feedback and adjusts template selection
 * weights accordingly.
 * 
 * Usage: node scripts/personalityFeedbackProcessor.js [--days=7] [--verbose]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/connectDB');
const StellaInteraction = require('../models/StellaInteraction');
const StellaKnowledge = require('../models/StellaKnowledge');
const UserPersonality = require('../models/UserPersonality');

// CLI arguments
const args = process.argv.slice(2);
const days = args.find(arg => arg.startsWith('--days=')) ? 
  parseInt(args.find(arg => arg.startsWith('--days=')).split('=')[1]) : 7;
const verbose = args.includes('--verbose');

// Connect to the database using your existing connection module
connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');
    processPersonalityFeedback();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Process user feedback and improve the personality system
 */
async function processPersonalityFeedback() {
  try {
    console.log(`🔄 Processing personality feedback from the last ${days} days...`);
    
    // Get date range for feedback
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get interactions with feedback
    const interactions = await StellaInteraction.find({
      timestamp: { $gte: startDate },
      'feedback.timestamp': { $exists: true }
    }).sort({ timestamp: -1 });
    
    if (interactions.length === 0) {
      console.log('⚠️ No feedback found in the specified date range.');
      console.log('💡 Try creating some test data with:');
      console.log('node scripts/createTestFeedback.js --count=10');
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
      return;
    }
    
    console.log(`📊 Found ${interactions.length} interactions with feedback`);
    
    // Calculate personality trait effectiveness
    const traitEffectiveness = calculateTraitEffectiveness(interactions);
    
    // Calculate template effectiveness
    const templateEffectiveness = await calculateTemplateEffectiveness(interactions);
    
    // Generate insights
    generateInsights(traitEffectiveness, templateEffectiveness);
    
    // Update template weights
    await updateTemplateWeights(templateEffectiveness);
    
    // Generate personality optimization recommendations
    await generatePersonalityRecommendations(traitEffectiveness);
    
    console.log('✅ Personality feedback processing complete');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('❌ Error processing personality feedback:', error);
    
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Calculate which personality traits result in positive feedback
 */
function calculateTraitEffectiveness(interactions) {
  const traitScores = {
    honesty: { total: 0, count: 0, positive: 0, negative: 0 },
    humor: { total: 0, count: 0, positive: 0, negative: 0 },
    formality: { total: 0, count: 0, positive: 0, negative: 0 },
    encouragement: { total: 0, count: 0, positive: 0, negative: 0 },
    detail: { total: 0, count: 0, positive: 0, negative: 0 }
  };
  
  for (const interaction of interactions) {
    if (!interaction.personalitySettings) continue;
    
    const traits = interaction.personalitySettings;
    const rating = interaction.feedback.rating || (interaction.feedback.helpful ? 5 : 1);
    const isPositive = rating >= 4;
    
    // Process each trait
    for (const [trait, value] of Object.entries(traits)) {
      if (traitScores[trait]) {
        traitScores[trait].total += value * rating; // Weight by rating
        traitScores[trait].count++;
        
        if (isPositive) {
          traitScores[trait].positive++;
        } else {
          traitScores[trait].negative++;
        }
      }
    }
  }
  
  // Calculate effectiveness scores
  const effectiveness = {};
  
  for (const [trait, data] of Object.entries(traitScores)) {
    if (data.count === 0) continue;
    
    const averageValue = data.total / (data.count * 5); // Normalize to 0-100
    const positiveRatio = data.positive / (data.positive + data.negative || 1);
    
    effectiveness[trait] = {
      averageValue: averageValue,
      positiveRatio: positiveRatio,
      effectiveness: averageValue * positiveRatio, // Combined metric
      totalInteractions: data.count,
      positiveInteractions: data.positive,
      negativeInteractions: data.negative
    };
  }
  
  if (verbose) {
    console.log('\n📊 Trait Effectiveness:');
    console.table(effectiveness);
  }
  
  return effectiveness;
}

/**
 * Calculate which templates get positive feedback
 */
async function calculateTemplateEffectiveness(interactions) {
  const templateScores = new Map();
  
  for (const interaction of interactions) {
    if (!interaction.metadata || !interaction.metadata.templateId) continue;
    
    const templateId = interaction.metadata.templateId;
    const rating = interaction.feedback.rating || (interaction.feedback.helpful ? 5 : 1);
    
    if (!templateScores.has(templateId)) {
      templateScores.set(templateId, {
        ratings: [],
        count: 0,
        templateId
      });
    }
    
    const template = templateScores.get(templateId);
    template.ratings.push(rating);
    template.count++;
  }
  
  // Calculate averages and retrieve template details
  const templateEffectiveness = [];
  
  for (const [templateId, data] of templateScores.entries()) {
    const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.count;
    
    // Get template details
    const template = await StellaKnowledge.findById(templateId).lean();
    
    if (template) {
      templateEffectiveness.push({
        templateId,
        content: template.content.slice(0, 50) + '...',
        subcategory: template.subcategory,
        intensityRange: template.intensityRange,
        avgRating,
        count: data.count,
        effectiveness: avgRating / 5, // Normalize to 0-1
        contextTags: template.contextTags
      });
    }
  }
  
  // Sort by effectiveness
  templateEffectiveness.sort((a, b) => b.effectiveness - a.effectiveness);
  
  if (verbose) {
    console.log('\n📊 Template Effectiveness:');
    console.table(templateEffectiveness.map(t => ({
      subcategory: t.subcategory,
      avgRating: t.avgRating.toFixed(2),
      count: t.count,
      effectiveness: t.effectiveness.toFixed(2)
    })));
  }
  
  return templateEffectiveness;
}

/**
 * Generate insights from the feedback data
 */
function generateInsights(traitEffectiveness, templateEffectiveness) {
  console.log('\n🔍 Key Insights:');
  
  // Trait insights
  const traitInsights = [];
  
  for (const [trait, data] of Object.entries(traitEffectiveness)) {
    if (data.totalInteractions < 5) continue; // Minimum sample size
    
    if (data.positiveRatio > 0.8) {
      traitInsights.push(`High ${trait} (${Math.round(data.averageValue)}) receives positive feedback ${Math.round(data.positiveRatio * 100)}% of the time`);
    } else if (data.positiveRatio < 0.4) {
      traitInsights.push(`Low positive feedback (${Math.round(data.positiveRatio * 100)}%) for ${trait} level ${Math.round(data.averageValue)}`);
    }
  }
  
  // Print top trait insights
  traitInsights.slice(0, 3).forEach(insight => console.log(`• ${insight}`));
  
  // Template insights
  if (templateEffectiveness.length > 0) {
    console.log('\n📝 Template Performance:');
    
    // Top performing templates
    const topTemplates = templateEffectiveness
      .filter(t => t.count >= 3) // Minimum usage count
      .slice(0, 3);
    
    if (topTemplates.length > 0) {
      console.log('Top performing templates:');
      topTemplates.forEach(t => {
        console.log(`• ${t.subcategory} template (rating: ${t.avgRating.toFixed(1)}/5): "${t.content}"`);
      });
    }
    
    // Underperforming templates
    const lowTemplates = [...templateEffectiveness]
      .filter(t => t.count >= 3) // Minimum usage count
      .sort((a, b) => a.effectiveness - b.effectiveness)
      .slice(0, 3);
    
    if (lowTemplates.length > 0) {
      console.log('\nUnderperforming templates:');
      lowTemplates.forEach(t => {
        console.log(`• ${t.subcategory} template (rating: ${t.avgRating.toFixed(1)}/5): "${t.content}"`);
      });
    }
  }
  
  // Context-specific insights
  generateContextInsights(templateEffectiveness);
}

/**
 * Generate context-specific insights
 */
function generateContextInsights(templateEffectiveness) {
  // Group templates by context tags
  const contextPerformance = new Map();
  
  for (const template of templateEffectiveness) {
    if (!template.contextTags || template.count < 2) continue;
    
    for (const tag of template.contextTags) {
      if (!contextPerformance.has(tag)) {
        contextPerformance.set(tag, {
          tag,
          ratings: [],
          templates: 0
        });
      }
      
      const context = contextPerformance.get(tag);
      context.ratings.push(template.avgRating);
      context.templates++;
    }
  }
  
  // Calculate averages
  const contextInsights = [];
  
  for (const [tag, data] of contextPerformance.entries()) {
    if (data.templates < 2) continue; // Need at least 2 templates
    
    const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
    
    contextInsights.push({
      tag,
      avgRating,
      templates: data.templates
    });
  }
  
  // Sort by average rating
  contextInsights.sort((a, b) => b.avgRating - a.avgRating);
  
  if (contextInsights.length > 0) {
    console.log('\n🏷️ Context Performance:');
    
    // Top contexts
    const topContexts = contextInsights.slice(0, 3);
    console.log('Best performing contexts:');
    topContexts.forEach(c => {
      console.log(`• "${c.tag}" templates average ${c.avgRating.toFixed(1)}/5 across ${c.templates} templates`);
    });
    
    // Worst contexts
    const worstContexts = [...contextInsights]
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 3);
    
    console.log('\nContexts needing improvement:');
    worstContexts.forEach(c => {
      console.log(`• "${c.tag}" templates average only ${c.avgRating.toFixed(1)}/5 across ${c.templates} templates`);
    });
  }
}

/**
 * Update template weights based on feedback
 */
async function updateTemplateWeights(templateEffectiveness) {
  if (!templateEffectiveness.length) return;
  
  console.log('\n🔄 Updating template selection weights...');
  
  const updates = [];
  
  for (const template of templateEffectiveness) {
    if (template.count < 3) continue; // Need minimum feedback
    
    // Calculate new weight based on effectiveness
    let weight = 1;
    if (template.effectiveness > 0.8) {
      weight = 1.5; // Boost high-performing templates
    } else if (template.effectiveness < 0.5) {
      weight = 0.5; // Reduce low-performing templates
    }
    
    updates.push({
      templateId: template.templateId,
      weight,
      effectiveness: template.effectiveness
    });
    
    // Update the template
    await StellaKnowledge.findByIdAndUpdate(template.templateId, {
      $set: { weight: weight }
    });
  }
  
  if (verbose) {
    console.log('Updated template weights:');
    console.table(updates.map(u => ({
      effectiveness: u.effectiveness.toFixed(2),
      weight: u.weight.toFixed(2)
    })));
  }
  
  console.log(`✅ Updated ${updates.length} template weights`);
}

/**
 * Generate personalized recommendations for users
 */
async function generatePersonalityRecommendations(traitEffectiveness) {
  // Get active users
  const recentUsers = await StellaInteraction.distinct('userId', {
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  if (recentUsers.length === 0) return;
  
  console.log(`\n🧠 Generating personality optimization recommendations for ${recentUsers.length} users...`);
  
  let recommendations = 0;
  
  for (const userId of recentUsers) {
    // Get user's current personality settings
    const userPersonality = await UserPersonality.findOne({ userId });
    if (!userPersonality) continue;
    
    // Get user's interaction history
    const userInteractions = await StellaInteraction.find({
      userId,
      'feedback.timestamp': { $exists: true }
    }).sort({ timestamp: -1 }).limit(10);
    
    if (userInteractions.length < 3) continue; // Need minimum interactions
    
    // Calculate user-specific trait effectiveness
    const userTraitScores = {};
    
    for (const interaction of userInteractions) {
      if (!interaction.personalitySettings) continue;
      
      const isPositive = (interaction.feedback.rating || 0) >= 4 || interaction.feedback.helpful;
      
      for (const [trait, value] of Object.entries(interaction.personalitySettings)) {
        if (!userTraitScores[trait]) {
          userTraitScores[trait] = { positive: 0, negative: 0, total: 0 };
        }
        
        if (isPositive) {
          userTraitScores[trait].positive++;
        } else {
          userTraitScores[trait].negative++;
        }
        
        userTraitScores[trait].total++;
      }
    }
    
    // Check if user needs personalization improvements
    const currentTraits = userPersonality.traits || {};
    const recommendedChanges = [];
    
    for (const [trait, scores] of Object.entries(userTraitScores)) {
      if (scores.total < 3) continue; // Need minimum data
      
      const positiveRatio = scores.positive / scores.total;
      
      // Check if global trait data suggests a different value would be better
      if (traitEffectiveness[trait] && Math.abs(traitEffectiveness[trait].averageValue - currentTraits[trait]) > 20) {
        // Current value differs significantly from optimal
        if (positiveRatio < 0.5) {
          // User isn't getting good results with current setting
          recommendedChanges.push({
            trait,
            currentValue: currentTraits[trait],
            recommendedValue: Math.round(traitEffectiveness[trait].averageValue),
            reason: `Based on global feedback, a ${trait} value of ${Math.round(traitEffectiveness[trait].averageValue)} has a ${Math.round(traitEffectiveness[trait].positiveRatio * 100)}% positive feedback rate`
          });
        }
      }
    }
    
    if (recommendedChanges.length > 0) {
      // Store recommendations
      await UserPersonality.findOneAndUpdate(
        { userId },
        {
          $set: {
            recommendations: {
              changes: recommendedChanges,
              generated: new Date(),
              applied: false
            }
          }
        }
      );
      
      recommendations++;
    }
  }
  
  console.log(`✅ Generated recommendations for ${recommendations} users`);
}

// Now let's also create a script to generate test feedback data if needed
console.log('💡 TIP: If no feedback data is found, you can create test data with:');
console.log('node scripts/createTestFeedback.js --count=10');