// public/js/modules/training/index.js
import AIAssistant from '../../visualizations/AIAssistant.js';
import AIHandler from './AIHandler.js';

class TrainingHandler {
  constructor() {
    // Initialize state variables for the training session
    this.currentQuestionIndex = 0;
    this.sessionId = null;
    this.questions = [];
  }

  /**
   * Starts a new assessment session.
   * Calls the backend endpoint to generate initial assessment questions,
   * stores the session ID and questions, then displays the first question with AI guidance.
   */
  async startAssessment() {
    console.log('Starting assessment...');
    try {
      const response = await fetch('/api/training/assessment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: 'full_guidance' })
      });
      const result = await response.json();
      if (
        result &&
        result.success &&
        result.sessionId &&
        result.questions &&
        result.questions.questions
      ) {
        this.sessionId = result.sessionId;
        this.questions = result.questions.questions;
        console.log('Assessment session started with ID:', this.sessionId);
        // Start with the first question
        this.currentQuestionIndex = 0;
        await this.showAIGuidedQuestion(this.questions[0]);
      } else {
        console.error('Failed to start assessment:', result);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  }

  /**
   * Requests AI guidance for a specific question by calling the AI guidance endpoint.
   * @param {Object} question - The question object (expects at least an 'id' property)
   * @returns {Promise<Object>} - The JSON response from the backend.
   */
  async requestAIGuidance(question) {
    try {
      const response = await fetch('/api/training/ai-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: question.id,
          currentProgress: this.currentQuestionIndex
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in requestAIGuidance:', error);
      return { success: false, guidance: "Unable to fetch guidance at this time." };
    }
  }

  /**
   * Displays a question with AI guidance.
   * First, it uses AIHandler to show a lower-level guidance message,
   * then it requests guidance from the backend and uses AIAssistant to display it.
   * @param {Object} question - The question object to display.
   */
  async showAIGuidedQuestion(question) {
    console.log('Displaying question:', question.text);
    
    // Show an initial guidance message using AIHandler (e.g., for low-level events)
    AIHandler.handleAIGuidance("Analyzing your response pattern...");
    
    // Request detailed guidance from the backend
    const guidanceResponse = await this.requestAIGuidance(question);
    if (guidanceResponse && guidanceResponse.success && guidanceResponse.guidance) {
      // Use AIAssistant for UI display of the guidance
      AIAssistant.showGuidance(guidanceResponse.guidance);
    } else {
      AIAssistant.showGuidance("Unable to fetch guidance at this time.");
    }
    
    // Additional logic to render the question on the UI and attach answer submission handlers goes here.
  }

  /**
   * Processes the answer for the current question by sending it to the backend.
   * Expects the backend to update the session and return whether the assessment is complete,
   * as well as the next question if available.
   * @param {Object} question - The question object (or its text) being answered.
   * @param {string} answer - The user's answer.
   */
  async processAssessmentAnswer(question, answer) {
    try {
      const response = await fetch(`/api/training/assessment/${this.sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, answer })
      });
      const result = await response.json();
      if (result && result.success) {
        this.currentQuestionIndex++;
        if (result.isComplete) {
          console.log('Assessment complete.');
          // Optionally, trigger completeAssessment or update the UI accordingly.
        } else {
          // Show next question with guidance
          await this.showAIGuidedQuestion(result.nextQuestion);
        }
      } else {
        console.error('Error submitting answer:', result);
      }
    } catch (error) {
      console.error('Error in processAssessmentAnswer:', error);
    }
  }

  /**
   * Completes the assessment by calling the complete endpoint.
   * Expects a training plan and updated metrics to be returned.
   */
  async completeAssessment() {
    try {
      const response = await fetch(`/api/training/assessment/${this.sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result && result.success) {
        console.log('Assessment completed successfully. Training plan:', result.trainingPlan);
        // Update the UI with training plan details if necessary.
      } else {
        console.error('Failed to complete assessment:', result);
      }
    } catch (error) {
      console.error('Error completing assessment:', error);
    }
  }
}

export default TrainingHandler;
