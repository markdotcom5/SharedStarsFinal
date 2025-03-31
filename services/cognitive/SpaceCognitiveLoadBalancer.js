// Space Cognitive Load Balancer - Core Algorithm
class SpaceCognitiveLoadBalancer {
    constructor(userId) {
      this.userId = userId;
      this.baselineCapacity = 0.65; // Default starting point
      this.cognitiveFingerprint = {
        spatialReasoning: 0.5,
        informationRetention: 0.5,
        stressAdaptation: 0.5,
        decisionMaking: 0.5,
        multitasking: 0.5
      };
      this.loadThreshold = 0.7; // Cognitive load threshold
    }
  
    // Calculate cognitive profile from application data
    generateInitialProfile(applicationData) {
      // Extract education background for baseline capacity
      if (applicationData.background) {
        // Higher education typically indicates higher baseline capacity
        const educationLevel = this.evaluateEducationLevel(applicationData.background);
        this.baselineCapacity = 0.5 + (educationLevel * 0.1); // Scale from 0.5 to 0.9
      }
  
      // Map skills to cognitive fingerprint dimensions
      if (applicationData.skills && Array.isArray(applicationData.skills)) {
        const skillMapping = {
          'programming': ['informationRetention', 'decisionMaking'],
          'engineering': ['spatialReasoning', 'decisionMaking'],
          'piloting': ['spatialReasoning', 'multitasking', 'stressAdaptation'],
          'medicine': ['informationRetention', 'decisionMaking', 'stressAdaptation'],
          'science': ['informationRetention', 'spatialReasoning'],
          'problem-solving': ['decisionMaking', 'stressAdaptation'],
          'leadership': ['decisionMaking', 'multitasking']
        };
  
        // Adjust cognitive fingerprint based on skills
        applicationData.skills.forEach(skill => {
          const dimensions = skillMapping[skill.toLowerCase()] || [];
          dimensions.forEach(dimension => {
            if (this.cognitiveFingerprint[dimension] !== undefined) {
              this.cognitiveFingerprint[dimension] += 0.1;
              // Cap at 0.9 for initial assessment
              this.cognitiveFingerprint[dimension] = Math.min(0.9, this.cognitiveFingerprint[dimension]);
            }
          });
        });
      }
  
      // Use motivation statement to assess stress adaptation
      if (applicationData.motivation) {
        const stressKeywords = ['challenge', 'pressure', 'difficult', 'overcome', 'adapt'];
        const motivationText = applicationData.motivation.toLowerCase();
        let stressAdaptationBoost = 0;
        
        stressKeywords.forEach(keyword => {
          if (motivationText.includes(keyword)) {
            stressAdaptationBoost += 0.05;
          }
        });
        
        this.cognitiveFingerprint.stressAdaptation += Math.min(0.2, stressAdaptationBoost);
      }
  
      return {
        baselineCapacity: this.baselineCapacity,
        cognitiveFingerprint: this.cognitiveFingerprint,
        initialReadiness: this.calculateInitialReadiness()
      };
    }
  
    // Helper methods
    evaluateEducationLevel(background) {
      const text = background.toLowerCase();
      if (text.includes('phd') || text.includes('doctorate')) return 4;
      if (text.includes('master')) return 3;
      if (text.includes('bachelor') || text.includes('degree')) return 2;
      if (text.includes('college') || text.includes('university')) return 1;
      return 0;
    }
  
    calculateInitialReadiness() {
      // Average of all cognitive dimensions plus baseline capacity
      const avgFingerprint = Object.values(this.cognitiveFingerprint)
        .reduce((sum, val) => sum + val, 0) / Object.keys(this.cognitiveFingerprint).length;
      
      return (avgFingerprint * 0.7) + (this.baselineCapacity * 0.3);
    }
  
    // Generate qualitative insights based on profile
    generateInsights() {
      const strengths = [];
      const areas = [];
      
      // Identify top strengths (dimensions > 0.7)
      Object.entries(this.cognitiveFingerprint).forEach(([dimension, value]) => {
        if (value > 0.7) {
          strengths.push(this.getDimensionLabel(dimension));
        } else if (value < 0.5) {
          areas.push(this.getDimensionLabel(dimension));
        }
      });
      
      // Generate personalized message
      let assessment = `<p>Based on your initial application, I've created your Space Cognitive Profile.</p>`;
      
      if (strengths.length > 0) {
        assessment += `<p>Your profile shows particular strength in ${strengths.join(', ')}. `;
        assessment += `This suggests you'll excel in training modules that leverage these abilities.</p>`;
      }
      
      if (areas.length > 0) {
        assessment += `<p>We'll focus on developing your ${areas.join(' and ')} `;
        assessment += `through specialized training modules designed to strengthen these crucial space abilities.</p>`;
      }
      
      assessment += `<p>Your baseline cognitive capacity suggests ${this.getCapacityAssessment(this.baselineCapacity)}.</p>`;
      
      return {
        greeting: this.generateGreeting(),
        initialAssessment: assessment,
        trainingRecommendation: this.generateTrainingRecommendation()
      };
    }
    
    // Helper methods for insight generation
    getDimensionLabel(dimension) {
      const labels = {
        spatialReasoning: 'spatial reasoning',
        informationRetention: 'information processing',
        stressAdaptation: 'performance under pressure',
        decisionMaking: 'decision making',
        multitasking: 'multitasking abilities'
      };
      return labels[dimension] || dimension;
    }
    
    getCapacityAssessment(capacity) {
      if (capacity > 0.8) return 'you can handle complex training scenarios with high cognitive load';
      if (capacity > 0.6) return 'you have good potential for managing the cognitive demands of space training';
      return "we'll build your capacity gradually through progressive training modules";    }
    
    generateGreeting() {
      const greetings = [
        "Your Space Cognitive Profile is ready!",
        "Welcome to your personalized training journey!",
        "I've analyzed your application data!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    generateTrainingRecommendation() {
      // This would be expanded in a full implementation
      const readiness = this.calculateInitialReadiness();
      if (readiness > 0.7) return 'advanced';
      if (readiness > 0.5) return 'intermediate';
      return 'foundational';
    }
  }