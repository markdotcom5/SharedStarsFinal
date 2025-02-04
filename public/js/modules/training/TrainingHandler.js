// public/js/modules/training/TrainingHandler.js
import AIAssistant from '../../visualizations/AIAssistant.js';
import SpaceTrainingFSD from './fsdTraining.js'; // If you need to analyze learner state

class TrainingHandler {
  constructor(userId) {
    this.userId = userId;
    this.sessionId = null;
    this.currentQuestionIndex = 0;
    this.questions = [];
  }

  // Start an assessment session and initialize the AI assistant.
  async startAssessment() {
    try {
      // Initialize AI session for guidance
      const aiInitData = await AIAssistant.initialize(this.userId, 'full_guidance');
      console.log('AI Initialized:', aiInitData);

      // Then call your backend endpoint to start the assessment session
      const response = await fetch('/api/training/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full_guidance', userId: this.userId })
      });
      const result = await response.json();
      if (result && result.success) {
        this.sessionId = result.sessionId;
        this.questions = result.questions.questions;
        this.currentQuestionIndex = 0;
        // Display the first question along with initial AI guidance
        await this.showAIGuidedQuestion(this.questions[0]);
      } else {
        console.error('Failed to start assessment:', result);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  }

  // Requests AI guidance for the current question and updates the UI.
  async showAIGuidedQuestion(question) {
    console.log('Displaying question:', question.text);
    // Immediately show a preliminary guidance message
    AIAssistant.showGuidance("Analyzing your response pattern...");

    // Request detailed guidance from the backend (or using your analysis module)
    const guidance = await AIAssistant.requestGuidance({ 
      questionId: question.id, 
      currentProgress: this.currentQuestionIndex 
    });
    console.log('Received guidance:', guidance);
    // Update the AI guidance display with the returned guidance
    AIAssistant.updateGuidance(guidance);

    // Here, update your UI with the question text and provide an input for the answer.
  }

  // Processes the user's answer (example)
  async processAnswer(answer) {
    try {
      const currentQuestion = this.questions[this.currentQuestionIndex];
      const response = await fetch(`/api/training/assessment/${this.sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          answer: answer
        })
      });
      const result = await response.json();
      if (result.success) {
        this.currentQuestionIndex++;
        if (result.isComplete) {
          console.log('Assessment complete');
          // You might then trigger completeAssessment() to finalize the session.
        } else {
          // Show next question with AI guidance
          await this.showAIGuidedQuestion(result.nextQuestion);
        }
      } else {
        console.error('Error submitting answer:', result);
      }
    } catch (error) {
      console.error('Error in processAnswer:', error);
    }
  }
}

export default TrainingHandler;
