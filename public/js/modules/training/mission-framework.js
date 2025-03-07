/**
 * Calculates realistic progress using S-curve
 * (slow start, acceleration, then plateau)
 */
calculateSCurveProgress(month, totalMonths) {
    // S-curve function (logistic growth)
    // Makes progress more realistic with slow start, acceleration in middle, and plateau
    const midpoint = totalMonths / 2;
    const steepness = 0.5;
    
    const progressPercent = 100 / (1 + Math.exp(-steepness * (month - midpoint)));
    
    return Math.round(progressPercent);
  }
  
  /**
   * Generates default milestones for the user
   */
  generateDefaultMilestones() {
    return [
      {
        id: 'initial-assessment',
        title: 'Initial Assessment Complete',
        description: 'Completed baseline fitness and readiness evaluation',
        requirementType: 'automatic',
        completed: true,
        completionDate: new Date(),
        iconType: 'assessment'
      },
      {
        id: 'core-fundamentals',
        title: 'Core Fundamentals Mastery',
        description: 'Demonstrate proficiency in basic core stability exercises',
        requirementType: 'mission',
        requiredMission: 'core-balance',
        requiredScore: 70,
        completed: false,
        iconType: 'physical'
      },
      {
        id: 'endurance-baseline',
        title: 'Endurance Baseline Established',
        description: 'Complete initial endurance training module',
        requirementType: 'mission',
        requiredMission: 'endurance',
        requiredCompletion: 1,
        completed: false,
        iconType: 'physical'
      },
      {
        id: 'flexibility-milestone',
        title: 'Flexibility Achievement',
        description: 'Reach intermediate flexibility benchmarks',
        requirementType: 'metric',
        requiredMetric: 'rangeOfMotion',
        requiredValue: 7.5,
        completed: false,
        iconType: 'physical'
      },
      {
        id: 'consistency-streak',
        title: 'Training Consistency',
        description: 'Complete 20 training sessions',
        requirementType: 'count',
        requiredCount: 20,
        currentCount: 0,
        completed: false,
        iconType: 'achievement'
      },
      {
        id: 'first-certification',
        title: 'Basic Space Fitness Certified',
        description: 'Complete all beginner physical readiness modules',
        requirementType: 'composite',
        requirements: [
          { id: 'core-fundamentals', completed: false },
          { id: 'endurance-baseline', completed: false },
          { id: 'flexibility-milestone', completed: false }
        ],
        completed: false,
        iconType: 'certification'
      }
    ];
  }
  
  /**
   * Loads milestone data from the user progress record
   */
  async loadMilestones(userProgress) {
    if (!userProgress.milestones || userProgress.milestones.length === 0) {
      // Use defaults if none defined yet
      return this.generateDefaultMilestones();
    }
    
    return userProgress.milestones;
  }
  
  /**
   * Generates timeline data for visualization
   */
  generateTimelineData(userProgress) {
    // Default to progress projection if no actual data available
    if (!userProgress.timelineProjection) {
      return this.generateInitialTimeline();
    }
    
    const timelineData = userProgress.timelineProjection;
    
    // Update with actual progress data
    if (userProgress.actualProgressData && userProgress.actualProgressData.length > 0) {
      const actualDataMap = {};
      userProgress.actualProgressData.forEach(dataPoint => {
        // Convert date to month index
        const date = new Date(dataPoint.date);
        const startDate = new Date(timelineData[0].date);
        const monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                          date.getMonth() - startDate.getMonth();
        
        if (monthDiff >= 0 && monthDiff < timelineData.length) {
          actualDataMap[monthDiff] = dataPoint.progress;
        }
      });
      
      // Merge actual data into timeline
      Object.keys(actualDataMap).forEach(monthIndex => {
        timelineData[monthIndex].actualProgress = actualDataMap[monthIndex];
      });
    }
    
    return timelineData;
  }
  
  /**
   * Updates a user's progress based on new activity
   */
  async updateProgress(activityData) {
    // Load current progress
    const userProgress = await UserProgress.findOne({ userId: this.userId });
    
    if (!userProgress) {
      await this.initializeNewUserProgress();
      return this.updateProgress(activityData);
    }
    
    // Calculate progress increment based on activity type
    let progressIncrement = 0;
    
    switch (activityData.type) {
      case 'mission_completion':
        progressIncrement = 3.5; // Significant progress for mission completion
        break;
        
      case 'exercise_completion':
        progressIncrement = 0.8; // Smaller increment for individual exercises
        break;
        
      case 'assessment':
        progressIncrement = 1.2; // Moderate progress for assessments
        break;
        
      default:
        progressIncrement = 0.5; // Default small increment
    }
    
    // Apply adjustment based on performance
    if (activityData.performance) {
      // Scale from 0.5x (poor performance) to 1.5x (excellent performance)
      const performanceMultiplier = 0.5 + (activityData.performance / 100);
      progressIncrement *= performanceMultiplier;
    }
    
    // Apply to overall progress (capped at 100)
    const newProgress = Math.min(100, userProgress.physicalTraining.overallProgress + progressIncrement);
    
    // Update progress record
    await UserProgress.updateOne(
      { userId: this.userId },
      { 
        $set: { 
          'physicalTraining.overallProgress': newProgress,
          'physicalTraining.lastActivity': new Date()
        },
        $push: {
          actualProgressData: {
            date: new Date(),
            progress: newProgress,
            activity: activityData.type
          }
        }
      }
    );
    
    // Check for milestone completions
    await this.checkMilestones(activityData);
    
    // Re-generate timeline with updated progress
    const updatedProgress = await UserProgress.findOne({ userId: this.userId });
    this.timelineData = this.generateTimelineData(updatedProgress);
    
    return {
      newProgress,
      progressGained: progressIncrement
    };
  }
  
  /**
   * Checks if any milestones are completed by the recent activity
   */
  async checkMilestones(activityData) {
    const userProgress = await UserProgress.findOne({ userId: this.userId });
    
    if (!userProgress || !userProgress.milestones) return;
    
    const milestones = userProgress.milestones;
    let milestonesUpdated = false;
    
    // Check each milestone for completion criteria
    for (const milestone of milestones) {
      if (milestone.completed) continue;
      
      let completed = false;
      
      switch (milestone.requirementType) {
        case 'mission':
          if (activityData.type === 'mission_completion' && 
              activityData.missionId === milestone.requiredMission) {
            
            if (milestone.requiredScore && activityData.score >= milestone.requiredScore) {
              completed = true;
            } else if (milestone.requiredCompletion) {
              completed = true;
            }
          }
          break;
          
        case 'metric':
          if (activityData.metrics && 
              activityData.metrics[milestone.requiredMetric] >= milestone.requiredValue) {
            completed = true;
          }
          break;
          
        case 'count':
          // Increment counter for relevant activity
          if (['mission_completion', 'exercise_completion'].includes(activityData.type)) {
            milestone.currentCount = (milestone.currentCount || 0) + 1;
            if (milestone.currentCount >= milestone.requiredCount) {
              completed = true;
            }
            milestonesUpdated = true;
          }
          break;
          
        case 'composite':
          // Check if all sub-requirements are completed
          if (milestone.requirements) {
            const allCompleted = milestone.requirements.every(req => {
              // Find the referenced milestone
              const referencedMilestone = milestones.find(m => m.id === req.id);
              return referencedMilestone && referencedMilestone.completed;
            });
            
            if (allCompleted) {
              completed = true;
            }
          }
          break;
      }
      
      if (completed) {
        milestone.completed = true;
        milestone.completionDate = new Date();
        milestonesUpdated = true;
        
        // Record achievement
        await UserProgress.updateOne(
          { userId: this.userId },
          { 
            $push: { 
              achievements: {
                id: milestone.id,
                title: milestone.title,
                description: milestone.description,
                date: new Date(),
                type: milestone.iconType || 'achievement'
              }
            }
          }
        );
        
        console.log(`Milestone completed for user ${this.userId}: ${milestone.title}`);
        
        // If this was a certification, add to certifications list
        if (milestone.iconType === 'certification') {
          await UserProgress.updateOne(
            { userId: this.userId },
            { 
              $push: { 
                certifications: {
                  id: milestone.id,
                  title: milestone.title,
                  description: milestone.description,
                  awardedDate: new Date()
                }
              }
            }
          );
        }
      }
    }
    
    // Save updated milestone data if changes were made
    if (milestonesUpdated) {
      await UserProgress.updateOne(
        { userId: this.userId },
        { $set: { milestones } }
      );
    }
  }
  
  /**
   * Generates a progress report for the user
   */
  async generateProgressReport() {
    // Load required data
    await this.initialize();
    
    const userProfile = await UserProfile.findOne({ userId: this.userId });
    const userProgress = await UserProgress.findOne({ userId: this.userId });
    
    if (!userProfile || !userProgress) {
      throw new Error('User data not found');
    }
    
    // Analyze recent activity
    const recentActivity = await UserActivity.find(
      { userId: this.userId },
      { activityType: 1, timestamp: 1, metrics: 1 }
    )
    .sort({ timestamp: -1 })
    .limit(10);
    
    // Calculate adherence rate
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const scheduledSessions = userProfile.trainingPreferences?.sessionsPerWeek * 4 || 12;
    
    const completedSessions = await UserActivity.countDocuments({
      userId: this.userId,
      activityType: 'training_session',
      timestamp: { $gte: lastMonth }
    });
    
    const adherenceRate = (completedSessions / scheduledSessions) * 100;
    
    // Generate improvement metrics
    const improvementAreas = [];
    
    if (userProgress.physicalTraining.activeMission === 'core-balance') {
      // Get baseline and latest core metrics
      const baselineAssessment = await AssessmentData.findOne(
        { 
          userId: this.userId, 
          assessmentType: 'core_baseline',
          timestamp: { $exists: true }
        }
      ).sort({ timestamp: 1 }).limit(1);
      
      const latestAssessment = await AssessmentData.findOne(
        { 
          userId: this.userId, 
          assessmentType: 'core_assessment',
          timestamp: { $exists: true }
        }
      ).sort({ timestamp: -1 }).limit(1);
      
      if (baselineAssessment && latestAssessment) {
        const coreImprovement = {
          area: 'Core Stability',
          initialValue: baselineAssessment.metrics.coreEngagement || 0,
          currentValue: latestAssessment.metrics.coreEngagement || 0,
          unit: 'score'
        };
        
        coreImprovement.improvement = coreImprovement.currentValue - coreImprovement.initialValue;
        coreImprovement.percentImprovement = coreImprovement.initialValue > 0 
          ? (coreImprovement.improvement / coreImprovement.initialValue) * 100 
          : 0;
        
        improvementAreas.push(coreImprovement);
      }
    }
    
    // Generate recommendations
    const recommendations = [];
    
    if (adherenceRate < 70) {
      recommendations.push({
        type: 'adherence',
        title: 'Improve Training Consistency',
        description: 'Your training consistency is below target. Consider adjusting your schedule or setting reminders to improve adherence.',
        actionable: true,
        action: 'review-schedule'
      });
    }
    
    // Get next milestone to focus on
    const nextMilestone = userProgress.milestones
      .filter(m => !m.completed)
      .sort((a, b) => {
        // Prioritize milestones that are part of composite requirements
        const aIsPartOfComposite = userProgress.milestones.some(
          m => m.requirementType === 'composite' && 
               m.requirements && 
               m.requirements.some(r => r.id === a.id)
        );
        
        const bIsPartOfComposite = userProgress.milestones.some(
          m => m.requirementType === 'composite' && 
               m.requirements && 
               m.requirements.some(r => r.id === b.id)
        );
        
        if (aIsPartOfComposite && !bIsPartOfComposite) return -1;
        if (!aIsPartOfComposite && bIsPartOfComposite) return 1;
        
        // Fall back to ordering by currentCount/requiredCount ratio for count-based milestones
        if (a.requirementType === 'count' && b.requirementType === 'count') {
          const aRatio = (a.currentCount || 0) / a.requiredCount;
          const bRatio = (b.currentCount || 0) / b.requiredCount;
          return bRatio - aRatio; // Higher ratio (closer to completion) first
        }
        
        return 0;
      })[0];
    
    // Add focus recommendation if next milestone exists
    if (nextMilestone) {
      recommendations.push({
        type: 'focus',
        title: `Focus on: ${nextMilestone.title}`,
        description: `${nextMilestone.description}. This achievement will significantly progress your training.`,
        actionable: false
      });
    }
    
    // Return comprehensive report
    return {
      userId: this.userId,
      generatedAt: new Date(),
      overallProgress: userProgress.physicalTraining.overallProgress,
      activeMission: userProgress.physicalTraining.activeMission,
      timeToReadiness: userProgress.physicalTraining.timeToReadiness,
      adherence: {
        rate: adherenceRate,
        completedSessions,
        scheduledSessions,
        assessment: adherenceRate >= 85 ? 'Excellent' : 
                    adherenceRate >= 70 ? 'Good' : 
                    adherenceRate >= 50 ? 'Needs Improvement' : 'Poor'
      },
      recentActivity,
      improvementAreas,
      recommendations,
      nextMilestone,
      achievements: userProgress.achievements?.slice(-5) || [],
      projectedCompletion: this.calculateProjectedCompletion(userProgress)
    };
  }
  
  /**
   * Calculates projected completion date based on current progress
   */
  calculateProjectedCompletion(userProgress) {
    // Current progress percentage
    const currentProgress = userProgress.physicalTraining.overallProgress;
    
    // If no progress yet, return the original projection
    if (currentProgress === 0) {
      return userProgress.timelineProjection[userProgress.timelineProjection.length - 1].date;
    }
    
    // Get recent progress rate
    const recentProgressPoints = userProgress.actualProgressData || [];
    
    if (recentProgressPoints.length < 2) {
      // Not enough data points, use the original projection
      return userProgress.timelineProjection[userProgress.timelineProjection.length - 1].date;
    }
    
    // Sort by date and get the most recent points
    recentProgressPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const latestPoints = recentProgressPoints.slice(-Math.min(6, recentProgressPoints.length));
    
    if (latestPoints.length < 2) {
      return userProgress.timelineProjection[userProgress.timelineProjection.length - 1].date;
    }
    
    // Calculate progress rate (progress per day)
    const firstDate = new Date(latestPoints[0].date);
    const lastDate = new Date(latestPoints[latestPoints.length - 1].date);
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    // Avoid division by zero
    if (daysDiff === 0) {
      return userProgress.timelineProjection[userProgress.timelineProjection.length - 1].date;
    }
    
    const firstProgress = latestPoints[0].progress;
    const lastProgress = latestPoints[latestPoints.length - 1].progress;
    const progressDiff = lastProgress - firstProgress;
    
    const progressPerDay = progressDiff / daysDiff;
    
    // If progress rate is very low or negative, use the original projection
    if (progressPerDay <= 0.01) {
      return userProgress.timelineProjection[userProgress.timelineProjection.length - 1].date;
    }
    
    // Calculate days until completion
    const remainingProgress = 100 - currentProgress;
    const daysToCompletion = remainingProgress / progressPerDay;
    
    // Calculate projected completion date
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysToCompletion);
    
    return projectedDate.toISOString().split('T')[0];
  }