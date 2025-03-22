// services/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const { DateTime } = require('luxon');
const config = require('../config/email');
const logger = require('../utils/logger');
const { DailyBriefing } = require('../models/DailyBriefing');

class EmailService {
  constructor() {
    // Initialize email transporter
    console.log("Loaded config:", config);

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
      }
    });

    // Cache for email templates
    this.templateCache = {};
    
    // Queue for briefing deliveries
    this.deliveryQueue = [];
    
    // Initialize template helper functions
    this.registerHelpers();
  }

  /**
   * Register Handlebars helper functions
   */
  registerHelpers() {
    handlebars.registerHelper('lower', function(str) {
      return str.toLowerCase();
    });
    
    handlebars.registerHelper('formatDate', function(date, format) {
      return DateTime.fromJSDate(date).toFormat(format || 'DD');
    });
  }

  /**
   * Load and compile an email template
   * @param {string} templateName - Name of the template to load
   * @returns {Promise<Function>} Compiled Handlebars template
   */
  async loadTemplate(templateName) {
    // Check cache first
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }

    // Load template file
    const templatePath = path.join(process.cwd(), 'templates', 'emails', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    // Compile template
    const compiledTemplate = handlebars.compile(templateContent);
    
    // Cache the template
    this.templateCache[templateName] = compiledTemplate;
    
    return compiledTemplate;
  }

  /**
   * Send a Daily Presidential Space Briefing email
   * @param {string} to - Recipient email address
   * @param {Object} briefingData - Data for the briefing email
   * @returns {Promise<Object>} Send result
   */
  async sendBriefingEmail(to, briefingData) {
    try {
      // Fetch the full briefing
      const briefing = await DailyBriefing.findById(briefingData.briefingId);
      if (!briefing) {
        throw new Error('Briefing not found');
      }
      
      // Extract section content
      const strategicSection = briefing.sections.find(s => s.sectionType === 'STRATEGIC');
      const astronomicalSection = briefing.sections.find(s => s.sectionType === 'ASTRONOMICAL');
      const technologicalSection = briefing.sections.find(s => s.sectionType === 'TECHNOLOGICAL');
      
      // Prepare template data
      const data = {
        baseUrl: config.baseUrl,
        alertStatus: briefing.alertStatus,
        formattedDate: DateTime.fromJSDate(briefing.date).toFormat('yyyy-MM-dd'),
        currentYear: new Date().getFullYear(),
        sections: {
          strategic: strategicSection ? strategicSection.content : 'No strategic developments to report.',
          astronomical: astronomicalSection ? astronomicalSection.content : 'No astronomical phenomena to report.',
          technological: technologicalSection ? technologicalSection.content : 'No technological breakthroughs to report.'
        },
        trainingDirective: briefing.trainingDirective.content
      };
      
      // Load and compile the template
      const template = await this.loadTemplate('daily-briefing');
      const html = template(data);
      
      // Send the email
      const result = await this.transporter.sendMail({
        from: `"SharedStars Mission Control" <${config.email.from}>`,
        to,
        subject: `🔒 ${briefing.alertStatus} ALERT: Daily Presidential Space Briefing`,
        html,
        text: this.getPlainTextVersion(data),
        headers: {
          'X-Priority': briefing.alertStatus === 'RED' ? '1' : '3',
          'X-Briefing-ID': briefingData.briefingId
        }
      });
      
      logger.info('Sent briefing email', {
        to,
        briefingId: briefingData.briefingId,
        messageId: result.messageId
      });
      
      return result;
    } catch (error) {
      logger.error('Error sending briefing email', {
        to,
        briefingId: briefingData.briefingId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Send briefing subscription confirmation email
   * @param {string} to - Recipient email address
   * @param {Object} preferences - User's preferences
   * @returns {Promise<Object>} Send result
   */
  async sendBriefingSubscriptionConfirmation(to, preferences) {
    try {
      // Prepare template data
      const data = {
        baseUrl: config.baseUrl,
        preferredTime: preferences.preferredTime || '06:00',
        timezone: preferences.timezone || 'UTC',
        currentYear: new Date().getFullYear()
      };
      
      // Load and compile the template
      const template = await this.loadTemplate('briefing-subscription');
      const html = template(data);
      
      // Send the email
      const result = await this.transporter.sendMail({
        from: `"SharedStars Mission Control" <${config.email.from}>`,
        to,
        subject: 'Confirmed: Daily Presidential Space Briefing Subscription',
        html,
        text: `You are now subscribed to receive the Daily Presidential Space Briefing at ${data.preferredTime} ${data.timezone} time. Visit ${config.baseUrl}/briefings/preferences to manage your subscription.`
      });
      
      logger.info('Sent subscription confirmation', { to, messageId: result.messageId });
      
      return result;
    } catch (error) {
      logger.error('Error sending subscription confirmation', {
        to,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Queue a briefing for delivery
   * @param {string} briefingId - ID of the briefing to deliver
   */
  queueBriefingDelivery(briefingId) {
    this.deliveryQueue.push({
      briefingId,
      queuedAt: new Date()
    });
    
    logger.info('Briefing queued for delivery', { briefingId });
    
    // If this is the only item in the queue, process immediately
    if (this.deliveryQueue.length === 1) {
      this.processDeliveryQueue();
    }
  }
  /**
 * Send application submission notification to admin
 * @param {Object} application - Application data
 * @returns {Promise<Object>} Send result
 */
async sendApplicationSubmissionToAdmin(application) {
  try {
    // Prepare admin notification content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New SharedStars Academy Application</h2>
        <p><strong>Name:</strong> ${application.name}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Background:</strong> ${application.background}</p>
        <p><strong>Motivation:</strong> ${application.motivation}</p>
        <p><strong>AI Review Score:</strong> ${application.aiReview.score.toFixed(2)}</p>
        <p><strong>AI Notes:</strong> ${application.aiReview.notes}</p>
        <p><strong>Recommended Pathway:</strong> ${application.aiReview.recommendedPathway || 'Not specified'}</p>
        <p><a href="${config.baseUrl}/admin/applications/${application._id}">Review in Admin Portal</a></p>
      </div>
    `;

    // Send the email
    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: config.adminEmail,
      subject: `New Academy Application: ${application.name}`,
      html,
      text: `New application received from ${application.name} (${application.email}). AI Score: ${application.aiReview.score.toFixed(2)}. Review at ${config.baseUrl}/admin/applications/${application._id}`
    });
    
    logger.info('Sent application notification to admin', {
      applicationId: application._id,
      messageId: result.messageId
    });
    
    return result;
  } catch (error) {
    logger.error('Error sending application notification to admin', {
      applicationId: application._id,
      error: error.message
    });
    throw error;
  }
}

/**
 * Send acceptance email to an approved applicant
 * @param {Object} application - Application data
 * @returns {Promise<Object>} Send result
 */
/**
 * Send acceptance email to an approved applicant - no authentication required
 * @param {Object} application - Application data
 * @returns {Promise<Object>} Send result
 */
async sendApplicationAcceptance(application) {
  try {
    // Create a name from firstName and lastName
    const fullName = application.fullName || application.name || 'Academy Applicant';
    
    console.log('Sending acceptance email to:', fullName, application.email);
    
    // Check if email is available
    if (!application.email) {
      console.error('Cannot send acceptance email - no email address');
      return { success: false, error: 'No email address available' };
    }
    
    // HTML email content with SharedStars branding
    const html = `
      <!DOCTYPE html>
      <html>
      <!-- Your existing HTML template -->
      </html>
    `;
    
    // Plain text version for email clients that don't support HTML
    const text = `
      CONGRATULATIONS, ${fullName}!
      
      I am personally thrilled to inform you that your application to SharedStars Academy has been APPROVED!
      
      <!-- Rest of your plain text email -->
    `;
    
    // Send the actual email
    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: application.email,
      subject: `🚀 Welcome to SharedStars Academy, ${fullName}!`,
      html: html,
      text: text
    });
    
    console.log('Email sent successfully:', {
      to: application.email,
      messageId: result.messageId
    });
    
    return { 
      success: true, 
      messageId: result.messageId,
      message: `Email sent to ${application.email}`
    };
  } catch (error) {
    console.error('Error sending acceptance email:', error);
    return { success: false, error: error.message };
  }
}
/**
 * Send verification email to a new user
 * @param {string} email - User's email address
 * @param {string} code - Verification code
 * @param {string} name - User's name
 * @returns {Promise<Object>} Send result
 */
// Replace the incomplete sendVerificationEmail function at the end of your file with this:

/**
 * Send verification email to a new user
 * @param {string} email - User's email address
 * @param {string} code - Verification code
 * @param {string} name - User's name
 */
async sendVerificationEmail(email, code, name) {
  try {
    console.log('Attempting to send verification email to:', email);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #1a2536; color: #fff;">
          <h2>Welcome to SharedStars Academy, ${name || 'Future Astronaut'}!</h2>
          <p>Use this verification code to complete your registration:</p>
          <div style="padding: 15px; font-size: 24px; letter-spacing: 5px; color: #4a7de9;">
            ${code}
          </div>
          <p>This code expires in 24 hours.</p>
        </div>
      </body>
      </html>
    `;

    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: email,
      subject: 'Verify Your SharedStars Academy Account',
      html,
      text: `Your verification code is: ${code}. It expires in 24 hours.`
    });

    console.log('✅ Verification email sent:', result.messageId);
    return result;

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
}

/**
   * Process the delivery queue
   * @private
   */
  async processDeliveryQueue() {
    if (this.deliveryQueue.length === 0) {
      return;
    }
    
    // Get the next item from the queue
    const item = this.deliveryQueue[0];
    
    try {
      // Get the briefing service
      const dailyBriefingService = require('./dailyBriefingService');
      
      // Deliver the briefing
      await dailyBriefingService.deliverBriefingToSubscribers(item.briefingId);
      
      // Remove from queue
      this.deliveryQueue.shift();
      
      // Process next item if any
      if (this.deliveryQueue.length > 0) {
        this.processDeliveryQueue();
      }
    } catch (error) {
      logger.error('Error processing delivery queue', {
        briefingId: item.briefingId,
        error: error.message
      });
      
      // Move to end of queue for retry
      this.deliveryQueue.shift();
      
      // Add back to end of queue with retry count
      this.deliveryQueue.push({
        ...item,
        retryCount: (item.retryCount || 0) + 1
      });
      
      // Process next item if any
      if (this.deliveryQueue.length > 0) {
        this.processDeliveryQueue();
      }
    }
  }
  // Add these methods to your emailService.js file

/**
 * Send welcome email to new user after signup
 * @param {Object} user - User data
 * @returns {Promise<Object>} Send result
 */
async sendSignupWelcomeEmail(user) {
  try {
    // Prepare template data
    const data = {
      baseUrl: config.baseUrl,
      name: user.name || 'Space Explorer',
      currentYear: new Date().getFullYear()
    };
    
    // Load and compile the template
    const template = await this.loadTemplate('welcome-email');
    const html = template(data);
    
    // Send the email
    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: user.email,
      subject: '🚀 Welcome to SharedStars Academy!',
      html,
      text: `Welcome to SharedStars Academy, ${data.name}! We're excited to have you join our community of future space explorers. Visit ${config.baseUrl}/dashboard to get started on your journey.`
    });
    
    logger.info('Sent welcome email', { to: user.email, messageId: result.messageId });
    
    return result;
  } catch (error) {
    logger.error('Error sending welcome email', {
      to: user.email,
      error: error.message
    });
    throw error;
  }
}

/**
 * Send assessment completion email
 * @param {Object} user - User data
 * @param {Object} assessment - Assessment data
 * @returns {Promise<Object>} Send result
 */
async sendAssessmentCompletionEmail(user, assessment) {
  try {
    // Prepare template data
    const data = {
      baseUrl: config.baseUrl,
      name: user.name || 'Academy Candidate',
      assessmentScore: assessment.score,
      recommendations: assessment.recommendations || [],
      nextSteps: assessment.nextSteps || 'Continue with your training program',
      currentYear: new Date().getFullYear()
    };
    
    // Load and compile the template
    const template = await this.loadTemplate('assessment-completion');
    const html = template(data);
    
    // Send the email
    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: user.email,
      subject: '🔍 Your SharedStars Assessment Results',
      html,
      text: `Congratulations on completing your assessment, ${data.name}! Your score: ${data.assessmentScore}. Visit ${config.baseUrl}/assessments to view your detailed results and personalized recommendations.`
    });
    
    logger.info('Sent assessment completion email', { to: user.email, messageId: result.messageId });
    
    return result;
  } catch (error) {
    logger.error('Error sending assessment completion email', {
      to: user.email,
      error: error.message
    });
    throw error;
  }
}

/**
 * Send application confirmation to applicant
 * @param {Object} application - Application data
 * @returns {Promise<Object>} Send result
 */
async sendApplicationConfirmationToApplicant(application) {
  try {
    const name = application.fullName || application.name || 'Academy Applicant';
    
    // Prepare template data
    const data = {
      baseUrl: config.baseUrl,
      name: name,
      applicationId: application._id,
      currentYear: new Date().getFullYear()
    };
    
    // Load and compile the template
    const template = await this.loadTemplate('application-confirmation');
    const html = template(data);
    
    // Send the email
    const result = await this.transporter.sendMail({
      from: `"SharedStars Academy" <${config.email.from}>`,
      to: application.email,
      subject: '📝 Your SharedStars Academy Application Received',
      html,
      text: `Thank you for applying to SharedStars Academy, ${name}! Your application (ID: ${application._id}) has been received and is under review. We'll notify you of your application status within 7-10 business days. Visit ${config.baseUrl}/applications/status to check your application status.`
    });
    
    logger.info('Sent application confirmation to applicant', { 
      to: application.email, 
      applicationId: application._id,
      messageId: result.messageId 
    });
    
    return result;
  } catch (error) {
    logger.error('Error sending application confirmation', {
      to: application.email,
      applicationId: application._id,
      error: error.message
    });
    throw error;
  }
}
  /**
   * Generate plain text version of email for clients that don't support HTML
   * @param {Object} data - Email template data
   * @returns {string} Plain text email
   * @private
   */
  getPlainTextVersion(data) {
    return `
⚠️ TOP SECRET // SHAREDSTARS CLEARANCE ONLY ⚠️

DAILY PRESIDENTIAL SPACE BRIEFING
DATE: ${data.formattedDate} | CLASSIFICATION: COSMIC-1 CLEARANCE
ALERT STATUS: ${data.alertStatus}

1. STRATEGIC DEVELOPMENTS
${data.sections.strategic}

2. ASTRONOMICAL PHENOMENA
${data.sections.astronomical}

3. TECHNOLOGICAL BREAKTHROUGH
${data.sections.technological}

4. TRAINING DIRECTIVE
${data.trainingDirective}

⚠️ INFORMATION CONTAINED HEREIN IS CLASSIFIED ⚠️
Unauthorized disclosure subject to Enhanced Administrative Action EO-43276.2

Access your training module at: ${data.baseUrl}/training?ref=briefing
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;