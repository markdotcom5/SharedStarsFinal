// models/DailyBriefing.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for Daily Presidential Space Briefing
 * Stores all briefing content and metadata
 */
const DailyBriefingSchema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  title: {
    type: String,
    required: true
  },
  alertStatus: {
    type: String,
    enum: ['GREEN', 'AMBER', 'RED'],
    default: 'GREEN'
  },
  classification: {
    type: String,
    default: 'COSMIC-1 CLEARANCE'
  },
  sections: [{
    sectionType: {
      type: String,
      enum: ['STRATEGIC', 'ASTRONOMICAL', 'TECHNOLOGICAL', 'TRAINING'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    classification: {
      type: String,
      default: 'CONFIDENTIAL'
    },
    imageUrl: String,
    sourceReference: String
  }],
  trainingDirective: {
    content: {
      type: String,
      required: true
    },
    relatedMissionId: {
      type: String,
      ref: 'Mission'
    },
    exerciseIds: [{
      type: String,
      ref: 'Exercise'
    }]
  },
  generatedBy: {
    type: String,
    default: 'STELLA AI'
  },
  metaData: {
    wordCount: Number,
    topicTags: [String],
    readTimeMinutes: Number
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying
DailyBriefingSchema.index({ date: -1, active: 1 });

/**
 * Schema for user's briefing preferences
 * Controls how users receive and interact with briefings
 */
const UserBriefingPreferenceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiveBriefings: {
    type: Boolean,
    default: true
  },
  deliveryMethod: {
    type: String,
    enum: ['EMAIL', 'IN_APP', 'BOTH'],
    default: 'BOTH'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  preferredTime: {
    type: String,
    default: '06:00' // 6 AM default delivery time
  },
  preferredTimezone: {
    type: String,
    default: 'UTC'
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  contentPreferences: {
    strategicDevelopments: {
      type: Boolean,
      default: true
    },
    astronomicalPhenomena: {
      type: Boolean,
      default: true
    },
    technologicalBreakthroughs: {
      type: Boolean,
      default: true
    },
    trainingDirectives: {
      type: Boolean,
      default: true
    }
  },
  lastViewedBriefing: {
    type: Schema.Types.ObjectId,
    ref: 'DailyBriefing'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique user preferences
UserBriefingPreferenceSchema.index({ userId: 1 }, { unique: true });

/**
 * Schema for tracking briefing delivery and engagement
 * Used for analytics and improving content
 */
const BriefingDeliverySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  briefingId: {
    type: Schema.Types.ObjectId,
    ref: 'DailyBriefing',
    required: true
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  deliveryMethod: {
    type: String,
    enum: ['EMAIL', 'IN_APP', 'PUSH'],
    required: true
  },
  opened: {
    type: Boolean,
    default: false
  },
  openedAt: Date,
  engagementMetrics: {
    timeSpentSeconds: Number,
    sectionsExpanded: [String],
    trainingDirectiveClicked: Boolean,
    sharedBriefing: Boolean
  },
  deliveryStatus: {
    status: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'FAILED'],
      default: 'PENDING'
    },
    errorMessage: String
  }
});

// Compound index for querying delivery analytics
BriefingDeliverySchema.index({ briefingId: 1, deliveryMethod: 1 });
BriefingDeliverySchema.index({ userId: 1, deliveredAt: -1 });

// Create models
const DailyBriefing = mongoose.model('DailyBriefing', DailyBriefingSchema);
const UserBriefingPreference = mongoose.model('UserBriefingPreference', UserBriefingPreferenceSchema);
const BriefingDelivery = mongoose.model('BriefingDelivery', BriefingDeliverySchema);

module.exports = {
  DailyBriefing,
  UserBriefingPreference,
  BriefingDelivery
};