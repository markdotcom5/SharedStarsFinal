// securityAudit.js
require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  question: String,
  responseData: {
    message: String,
    processingTime: Number,
    enginesUsed: [String],
    confidence: Number
  },
  queryAnalysis: {
    topics: [String]
  },
  flagged: Boolean,
  flagReason: String
}, { strict: false });

const stellaKnowledgeSchema = new mongoose.Schema({
  title: String,
  content: String,
  flagged: Boolean,
  flagReason: String
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
const StellaKnowledge = mongoose.model('StellaKnowledge', stellaKnowledgeSchema);
const UserPersonality = mongoose.model('UserPersonality', userPersonalitySchema);

// Define security audit function
async function runSecurityAudit(options = {}) {
  const {
    daysToAudit = 7,
    auditKnowledgeBase = true,
    auditInteractions = true,
    auditPersonalities = true,
    remediationLevel = 'report' // 'report', 'flag', or 'remove'
  } = options;
  
  console.log(`🔒 Starting STELLA security audit...`);
  
  const auditReport = {
    timestamp: new Date(),
    summary: {
      totalIssuesFound: 0,
      criticalIssues: 0,
      moderateIssues: 0,
      minorIssues: 0,
      remediatedItems: 0
    },
    knowledgeBaseIssues: [],
    interactionIssues: [],
    personalityIssues: []
  };
  
  // Calculate date threshold
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysToAudit);
  
  // Audit knowledge base
  if (auditKnowledgeBase) {
    console.log(`Auditing knowledge base content...`);
    const knowledgeItems = await StellaKnowledge.find().lean();
    console.log(`Found ${knowledgeItems.length} knowledge items to audit`);
    
    let processedItems = 0;
    await Promise.all(items.map(async (item) => {

      if (item.content) {
        const contentAudit = await auditContent(item.content, 'knowledge');
        if (contentAudit.issues.length > 0) {
          auditReport.knowledgeBaseIssues.push({
            itemId: item._id,
            title: item.title || 'Unknown',
            issues: contentAudit.issues,
            severity: contentAudit.severity,
            remediated: false
          });
          
          updateSummary(auditReport.summary, contentAudit.severity);
          
          // Handle remediation if needed
          if (remediationLevel !== 'report' && contentAudit.severity === 'critical') {
            if (remediationLevel === 'remove') {
              await StellaKnowledge.deleteOne({ _id: item._id });
              auditReport.summary.remediatedItems++;
              auditReport.knowledgeBaseIssues[auditReport.knowledgeBaseIssues.length - 1].remediated = true;
            } else if (remediationLevel === 'flag') {
              await StellaKnowledge.updateOne(
                { _id: item._id },
                { $set: { 
                  flagged: true, 
                  flagReason: contentAudit.issues.join('; ') 
                }}
              );
              auditReport.summary.remediatedItems++;
              auditReport.knowledgeBaseIssues[auditReport.knowledgeBaseIssues.length - 1].remediated = true;
            }
          }
        }
      }
      
      processedItems++;
      if (processedItems % 10 === 0) {
        console.log(`Processed ${processedItems}/${knowledgeItems.length} knowledge items`);
      }
      
      // Brief pause to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Audit recent interactions
  if (auditInteractions) {
    console.log(`Auditing recent interactions from the past ${daysToAudit} days...`);
    const interactions = await StellaInteraction.find({
      timestamp: { $gte: threshold }
    }).lean();
    
    console.log(`Found ${interactions.length} interactions to audit`);
    
    let processedItems = 0;
    for (const interaction of interactions) {
      // Audit user questions
      if (interaction.question) {
        const questionAudit = await auditContent(interaction.question, 'user-input');
        if (questionAudit.issues.length > 0) {
          auditReport.interactionIssues.push({
            interactionId: interaction._id,
            userId: interaction.userId,
            questionIssues: questionAudit.issues,
            severity: questionAudit.severity,
            remediated: false
          });
          
          updateSummary(auditReport.summary, questionAudit.severity);
          
          // Handle remediation if needed
          if (remediationLevel !== 'report' && questionAudit.severity === 'critical') {
            if (remediationLevel === 'flag') {
              await StellaInteraction.updateOne(
                { _id: interaction._id },
                { $set: { 
                  flagged: true, 
                  flagReason: questionAudit.issues.join('; ') 
                }}
              );
              auditReport.summary.remediatedItems++;
              auditReport.interactionIssues[auditReport.interactionIssues.length - 1].remediated = true;
            }
          }
        }
      }
      
      // Audit STELLA responses
      if (interaction.responseData?.message) {
        const responseAudit = await auditContent(interaction.responseData.message, 'stella-response');
        if (responseAudit.issues.length > 0) {
          // If we already have an entry for this interaction, update it
          const existingEntry = auditReport.interactionIssues.find(
            issue => issue.interactionId.toString() === interaction._id.toString()
          );
          
          if (existingEntry) {
            existingEntry.responseIssues = responseAudit.issues;
            existingEntry.severity = Math.max(existingEntry.severity, responseAudit.severity);
          } else {
            auditReport.interactionIssues.push({
              interactionId: interaction._id,
              userId: interaction.userId,
              responseIssues: responseAudit.issues,
              severity: responseAudit.severity,
              remediated: false
            });
          }
          
          updateSummary(auditReport.summary, responseAudit.severity);
        }
      }
      
      processedItems++;
      if (processedItems % 20 === 0) {
        console.log(`Processed ${processedItems}/${interactions.length} interactions`);
      }
      
      // Brief pause to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Audit personality settings
  if (auditPersonalities) {
    console.log('Auditing personality settings...');
    const personalities = await UserPersonality.find().lean();
    
    console.log(`Found ${personalities.length} personality profiles to audit`);
    
    // Check for extreme personality settings that could lead to inappropriate responses
    personalities.forEach(personality => {
      const issues = [];
      
      if (personality.traits) {
        // Check for extremely low honesty + extremely high humor
        if ((personality.traits.honesty < 20) && (personality.traits.humor > 90)) {
          issues.push('Potentially inappropriate combination of very low honesty and very high humor');
        }
        
        // Check for extremely low formality + extremely high humor
        if ((personality.traits.formality < 10) && (personality.traits.humor > 90)) {
          issues.push('Potentially inappropriate combination of very low formality and very high humor');
        }
      }
      
      if (issues.length > 0) {
        auditReport.personalityIssues.push({
          userId: personality.userId,
          issues: issues,
          severity: 'moderate',
          remediated: false
        });
        
        auditReport.summary.totalIssuesFound += issues.length;
        auditReport.summary.moderateIssues += issues.length;
      }
    });
  }
  
  // Write report to file
  const reportPath = `./security-audits/stella-security-audit-${new Date().toISOString().split('T')[0]}.json`;
  
  // Ensure directory exists
  if (!fs.existsSync('./security-audits')) {
    fs.mkdirSync('./security-audits', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  
  console.log(`
🔒 Security Audit Complete
------------------------
Total Issues: ${auditReport.summary.totalIssuesFound}
Critical Issues: ${auditReport.summary.criticalIssues}
Moderate Issues: ${auditReport.summary.moderateIssues}
Minor Issues: ${auditReport.summary.minorIssues}
Remediated Items: ${auditReport.summary.remediatedItems}

Full report saved to: ${reportPath}
  `);
  
  return auditReport;
}

// Helper to audit content for security issues
async function auditContent(content, contentType) {
  // Skip empty content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { issues: [], severity: 'none' };
  }
  
  try {
    const prompt = `Review the following ${contentType} content for security and appropriateness issues. 
Identify any harmful, inappropriate, or concerning content, including:
1. Personal identifiable information (PII)
2. Security vulnerabilities or sensitive data exposure
3. Harmful, offensive, or abusive language
4. Social engineering attempts
5. Instructions for illegal or harmful activities

Content to review:
---
${content.slice(0, 500)}${content.length > 500 ? '...(truncated)' : ''}
---

Return your analysis as a JSON object with these fields:
- issues: Array of specific issues found (empty array if none)
- severity: "none", "minor", "moderate", or "critical"
- explanation: Brief explanation of findings`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user", 
        content: prompt
      }],
      response_format: { type: "json_object" }
    });

    const audit = JSON.parse(response.choices[0].message.content);
    
    // Map severity to numerical value for easier comparison
    const severityMap = {
      'none': 0,
      'minor': 1,
      'moderate': 2,
      'critical': 3
    };
    
    audit.severity = severityMap[audit.severity] || 0;
    
    return audit;
  } catch (error) {
    console.error(`Error auditing content:`, error);
    return { issues: ['Error performing security audit'], severity: 'minor' };
  }
}

// Helper to update summary counts
function updateSummary(summary, severity) {
  summary.totalIssuesFound++;
  
  switch(severity) {
    case 'critical':
    case 3:
      summary.criticalIssues++;
      break;
    case 'moderate':
    case 2:
      summary.moderateIssues++;
      break;
    case 'minor':
    case 1:
      summary.minorIssues++;
      break;
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  daysToAudit: args[0] ? parseInt(args[0]) : 7,
  remediationLevel: args[1] || 'report'
};

runSecurityAudit(options)
  .then(() => {
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error in security audit:', error);
    mongoose.disconnect();
    process.exit(1);
  });