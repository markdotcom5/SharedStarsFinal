// public/js/assessment/readiness-assessment.js

class ReadinessAssessment {
    constructor(assessmentType = 'initial') {
      this.assessmentType = assessmentType; // 'initial', 'physical', 'mental', 'technical', 'mission-core-balance', etc.
      this.questions = this.loadQuestions(assessmentType);
      this.responses = {};
      this.currentSection = 0;
      this.currentQuestion = 0;
      this.assessmentContainer = document.getElementById('assessment-container');
      this.progressBar = document.getElementById('assessment-progress');
      this.nextButton = document.getElementById('next-question');
      this.prevButton = document.getElementById('prev-question');
      this.submitButton = document.getElementById('submit-assessment');
      this.onComplete = null; // Callback function for when assessment is completed
    }
  
    initialize(containerId = 'assessment-container') {
      // Update the container reference if provided
      if (containerId && containerId !== 'assessment-container') {
        this.assessmentContainer = document.getElementById(containerId);
      }
      
      this.setupEventListeners();
      this.renderQuestion();
      this.updateProgressBar();
    }
  
    setupEventListeners() {
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => this.nextQuestion());
      }
  
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => this.previousQuestion());
      }
  
      if (this.submitButton) {
        this.submitButton.addEventListener('click', () => this.submitAssessment());
      }
    }
  
    loadQuestions(assessmentType) {
      // Base questions (your existing questions)
      const baseQuestions = {
        "physicalBaseline": {
          "title": "Physical Baseline Assessment",
          "description": "Let's establish your current physical readiness for space training.",
          "questions": [
            {
              "id": "cardio_fitness",
              "text": "How would you rate your cardiovascular fitness?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Poor",
              "maxLabel": "Excellent",
              "weight": 1.5
            },
            {
              "id": "strength_pushups",
              "text": "How many consecutive push-ups can you currently perform with proper form?",
              "type": "numeric",
              "placeholder": "Enter number",
              "weight": 1.2
            },
            {
              "id": "strength_core",
              "text": "How long can you hold a plank position?",
              "type": "duration",
              "placeholder": "Minutes:Seconds",
              "weight": 1.3
            },
            {
              "id": "flexibility",
              "text": "Can you touch your toes while keeping your legs straight?",
              "type": "options",
              "options": [
                "Easily - with palms flat on the ground",
                "Yes - with fingertips touching toes",
                "Almost - within 1-2 inches",
                "Not close - more than 2 inches away"
              ],
              "weight": 1.0
            },
            {
              "id": "balance",
              "text": "How long can you balance on one leg with eyes closed?",
              "type": "duration",
              "placeholder": "Minutes:Seconds",
              "weight": 1.2
            },
            {
              "id": "previous_training",
              "text": "What type of physical training have you consistently done in the past year?",
              "type": "multiselect",
              "options": [
                "Strength/Weight Training",
                "Cardiovascular/Endurance Training",
                "Flexibility/Mobility Work",
                "Balance/Stability Training",
                "Sports/Athletic Activities",
                "None/Very Limited"
              ],
              "weight": 1.0
            }
          ]
        },
        "medicalConsiderations": {
          "title": "Medical Considerations",
          "description": "Understanding your medical baseline helps us customize training safely.",
          "questions": [
            {
              "id": "motion_sickness",
              "text": "How susceptible are you to motion sickness?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Never experience it",
              "maxLabel": "Highly susceptible",
              "weight": 1.4
            },
            {
              "id": "vision",
              "text": "How would you describe your vision?",
              "type": "options",
              "options": [
                "20/20 vision without correction",
                "Corrected to 20/20 with glasses/contacts",
                "Minor vision issues even with correction",
                "Significant vision issues"
              ],
              "weight": 1.0
            },
            {
              "id": "medical_conditions",
              "text": "Do you have any medical conditions that might affect space training?",
              "type": "multiselect",
              "options": [
                "Cardiovascular conditions",
                "Respiratory conditions",
                "Musculoskeletal issues",
                "Neurological conditions",
                "None of the above"
              ],
              "weight": 1.3
            },
            {
              "id": "altitude_adaptation",
              "text": "How well do you typically adapt to altitude or pressure changes?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Poorly - significant discomfort",
              "maxLabel": "Excellent - no issues",
              "weight": 1.2
            },
            {
              "id": "medication",
              "text": "Are you currently taking any medications?",
              "type": "options",
              "options": [
                "Yes - daily medication for chronic condition",
                "Yes - occasional medication",
                "No - no regular medications"
              ],
              "weight": 0.8
            }
          ]
        },
        "psychologicalReadiness": {
          "title": "Psychological Readiness",
          "description": "Mental readiness is as important as physical preparation for space training.",
          "questions": [
            {
              "id": "stress_response",
              "text": "How do you typically respond to high-stress situations?",
              "type": "options",
              "options": [
                "Remain calm and methodical",
                "Initial anxiety but then focus",
                "Function but with significant stress",
                "Difficulty functioning under pressure"
              ],
              "weight": 1.5
            },
            {
              "id": "claustrophobia",
              "text": "Rate your comfort level in confined spaces:",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Very uncomfortable",
              "maxLabel": "Completely comfortable",
              "weight": 1.4
            },
            {
              "id": "team_dynamics",
              "text": "How do you prefer to work in team environments?",
              "type": "options",
              "options": [
                "Prefer leadership roles",
                "Comfortable both leading and supporting",
                "Prefer supporting roles with clear direction",
                "Prefer working independently when possible"
              ],
              "weight": 1.0
            },
            {
              "id": "decision_making",
              "text": "When making decisions under pressure, you typically:",
              "type": "options",
              "options": [
                "Quickly analyze and act decisively",
                "Consider options systematically but efficiently",
                "Seek input from others when possible",
                "Prefer more time for careful consideration"
              ],
              "weight": 1.2
            },
            {
              "id": "sleep_quality",
              "text": "How would you rate your typical sleep quality?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Poor/Irregular",
              "maxLabel": "Excellent/Consistent",
              "weight": 1.0
            },
            {
              "id": "adaptation",
              "text": "How easily do you adapt to new environments and routines?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Difficult adjustment",
              "maxLabel": "Adapt very easily",
              "weight": 1.1
            }
          ]
        },
        "technicalAptitude": {
          "title": "Technical Aptitude",
          "description": "Understanding your technical background will help tailor your training program.",
          "questions": [
            {
              "id": "space_knowledge",
              "text": "Rate your current knowledge of space systems and operations:",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Minimal knowledge",
              "maxLabel": "Expert knowledge",
              "weight": 0.8
            },
            {
              "id": "technical_background",
              "text": "Which of these technical areas best describes your background?",
              "type": "multiselect",
              "options": [
                "Engineering",
                "Computer Science/Programming",
                "Physical Sciences",
                "Life Sciences/Medicine",
                "Aviation/Aerospace",
                "None of the above"
              ],
              "weight": 0.9
            },
            {
              "id": "problem_solving",
              "text": "When faced with a technical problem, you typically:",
              "type": "options",
              "options": [
                "Enjoy the challenge and solve methodically",
                "Solve it but may find it stressful",
                "Prefer to consult others with more expertise",
                "Tend to avoid technical problem-solving"
              ],
              "weight": 1.0
            },
            {
              "id": "learning_style",
              "text": "How do you learn new skills most effectively?",
              "type": "multiselect",
              "options": [
                "Visual learning (diagrams, videos, demonstrations)",
                "Reading technical documentation",
                "Hands-on practice",
                "Instructor-led training",
                "Self-guided exploration"
              ],
              "weight": 0.7
            },
            {
              "id": "tech_comfort",
              "text": "How comfortable are you with learning to use new technology systems?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Very uncomfortable",
              "maxLabel": "Highly comfortable",
              "weight": 0.9
            }
          ]
        }
      };
      
      // Module-specific questions
      const moduleQuestions = {
        "physical": {
          "title": "Physical Training Assessment",
          "description": "Let's assess your physical readiness for space training.",
          "questions": [
            {
              "id": "cardio_endurance",
              "text": "How long can you maintain moderate-intensity cardio exercise?",
              "type": "options",
              "options": [
                "Less than 10 minutes",
                "10-20 minutes",
                "20-30 minutes",
                "30-45 minutes",
                "More than 45 minutes"
              ],
              "weight": 1.2
            },
            {
              "id": "strength_assessment",
              "text": "How would you rate your overall body strength?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Beginner",
              "maxLabel": "Advanced",
              "weight": 1.0
            },
            {
              "id": "recovery_time",
              "text": "How quickly do you recover after intense physical activity?",
              "type": "options",
              "options": [
                "Very quickly - ready to go again in an hour",
                "Fairly quickly - fully recovered the same day",
                "Average - fully recovered by the next day",
                "Slow recovery - need multiple days"
              ],
              "weight": 1.1
            }
          ]
        },
        "mental": {
          "title": "Mental Fitness Assessment",
          "description": "Let's assess your mental and psychological readiness.",
          "questions": [
            {
              "id": "stress_tolerance",
              "text": "How do you handle prolonged stress situations?",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Poorly",
              "maxLabel": "Excellently",
              "weight": 1.3
            },
            {
              "id": "focus_duration",
              "text": "How long can you maintain deep focus on a complex task?",
              "type": "options",
              "options": [
                "Less than 30 minutes",
                "30-60 minutes",
                "1-2 hours",
                "More than 2 hours"
              ],
              "weight": 1.1
            }
          ]
        }
      };
      
      // Mission-specific questions
      const missionQuestions = {
        "core-balance": {
          "title": "Core & Balance Mission Assessment",
          "description": "Let's assess your readiness for the Core & Balance mission.",
          "questions": [
            {
              "id": "plank_duration",
              "text": "How long can you hold a standard plank position?",
              "type": "duration",
              "placeholder": "Minutes:Seconds",
              "weight": 1.4
            },
            {
              "id": "balance_challenge",
              "text": "Rate your confidence in performing balance exercises:",
              "type": "scale",
              "min": 1,
              "max": 10,
              "minLabel": "Not confident",
              "maxLabel": "Very confident",
              "weight": 1.2
            },
            {
              "id": "core_experience",
              "text": "Which core exercises are you familiar with?",
              "type": "multiselect",
              "options": [
                "Planks",
                "Russian twists",
                "Deadbugs",
                "Bird dogs",
                "Hollow holds",
                "Medicine ball exercises",
                "None of these"
              ],
              "weight": 1.0
            }
          ]
        }
      };
      
      // Determine which question set to use
      if (assessmentType === 'initial') {
        return baseQuestions;
      } else if (assessmentType.startsWith('module-')) {
        const moduleType = assessmentType.replace('module-', '');
        if (moduleQuestions[moduleType]) {
          return { [assessmentType]: moduleQuestions[moduleType] };
        }
      } else if (assessmentType.startsWith('mission-')) {
        const missionType = assessmentType.replace('mission-', '');
        if (missionQuestions[missionType]) {
          return { [assessmentType]: missionQuestions[missionType] };
        }
      }
      
      // Default to base questions if type not found
      return baseQuestions;
    }
  
    renderQuestion() {
      const sections = Object.keys(this.questions);
      if (this.currentSection >= sections.length) {
        this.showSubmitScreen();
        return;
      }
  
      const currentSectionKey = sections[this.currentSection];
      const section = this.questions[currentSectionKey];
      const question = section.questions[this.currentQuestion];
  
      if (!question) {
        this.currentSection++;
        this.currentQuestion = 0;
        this.renderQuestion();
        return;
      }
  
      let questionHTML = `
        <div class="section-info mb-6">
          <h2 class="text-2xl font-bold text-blue-400 mb-2">${section.title}</h2>
          <p class="text-gray-300">${section.description}</p>
        </div>
        <div class="question-container bg-gray-800/50 rounded-xl p-6 mb-6 border border-blue-500/20">
          <h3 class="text-xl font-semibold text-white mb-4">${question.text}</h3>
          <div class="answer-container">
      `;
  
      // Render different input types based on question type
      switch (question.type) {
        case 'scale':
          questionHTML += this.renderScaleQuestion(question);
          break;
        case 'options':
          questionHTML += this.renderOptionsQuestion(question);
          break;
        case 'multiselect':
          questionHTML += this.renderMultiselectQuestion(question);
          break;
        case 'numeric':
          questionHTML += this.renderNumericQuestion(question);
          break;
        case 'duration':
          questionHTML += this.renderDurationQuestion(question);
          break;
        default:
          questionHTML += `<div class="text-red-500">Unknown question type</div>`;
      }
  
      questionHTML += `
          </div>
        </div>
      `;
  
      if (this.assessmentContainer) {
        this.assessmentContainer.innerHTML = questionHTML;
        this.setupInputListeners();
      }
  
      // Update navigation buttons
      this.updateNavigationButtons();
    }
  
    renderScaleQuestion(question) {
      const value = this.getResponseValue(question.id) || Math.floor((question.max - question.min) / 2) + question.min;
      
      return `
        <div class="scale-container mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-sm text-gray-400">${question.minLabel}</span>
            <span class="text-sm text-gray-400">${question.maxLabel}</span>
          </div>
          <div class="relative">
            <input type="range" 
                   id="${question.id}" 
                   min="${question.min}" 
                   max="${question.max}" 
                   value="${value}" 
                   class="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer">
            <div class="absolute top-6 left-0 right-0 flex justify-between px-2">
              ${Array.from({length: question.max - question.min + 1}, (_, i) => i + question.min)
                .map(num => `<span class="text-xs text-gray-500">${num}</span>`)
                .join('')}
            </div>
          </div>
          <div class="text-center mt-8">
            <span class="text-xl font-bold text-blue-400" id="${question.id}-value">${value}</span>
          </div>
        </div>
      `;
    }
  
    renderOptionsQuestion(question) {
      const selectedValue = this.getResponseValue(question.id) || '';
      
      return `
        <div class="options-container space-y-3">
          ${question.options.map((option, index) => `
            <div class="option-item">
              <label class="flex items-start p-3 rounded-lg ${selectedValue === option ? 'bg-blue-800/40 border border-blue-500/40' : 'bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/40'} cursor-pointer transition-colors">
                <input type="radio" 
                       name="${question.id}" 
                       value="${option}" 
                       ${selectedValue === option ? 'checked' : ''}
                       class="mt-1 mr-3">
                <span>${option}</span>
              </label>
            </div>
          `).join('')}
        </div>
      `;
    }
  
    renderMultiselectQuestion(question) {
      const selectedValues = this.getResponseValue(question.id) || [];
      
      return `
        <div class="multiselect-container space-y-3">
          ${question.options.map((option, index) => `
            <div class="option-item">
              <label class="flex items-start p-3 rounded-lg ${selectedValues.includes(option) ? 'bg-blue-800/40 border border-blue-500/40' : 'bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/40'} cursor-pointer transition-colors">
                <input type="checkbox" 
                       name="${question.id}" 
                       value="${option}" 
                       ${selectedValues.includes(option) ? 'checked' : ''}
                       class="mt-1 mr-3">
                <span>${option}</span>
              </label>
            </div>
          `).join('')}
        </div>
      `;
    }
  
    renderNumericQuestion(question) {
      const value = this.getResponseValue(question.id) || '';
      
      return `
        <div class="numeric-container">
          <input type="number" 
                 id="${question.id}" 
                 value="${value}" 
                 placeholder="${question.placeholder || 'Enter a number'}" 
                 class="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white">
        </div>
      `;
    }
  
    renderDurationQuestion(question) {
      const value = this.getResponseValue(question.id) || '';
      
      return `
        <div class="duration-container">
          <input type="text" 
                 id="${question.id}" 
                 value="${value}" 
                 placeholder="${question.placeholder || 'MM:SS'}" 
                 class="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white">
          <p class="text-sm text-gray-400 mt-2">Format as minutes:seconds (e.g., 2:30 for 2 minutes and 30 seconds)</p>
        </div>
      `;
    }
  
    setupInputListeners() {
      // Setup listeners for all input types to save responses
      const sectionKeys = Object.keys(this.questions);
      const currentSectionKey = sectionKeys[this.currentSection];
      const question = this.questions[currentSectionKey].questions[this.currentQuestion];
  
      switch (question.type) {
        case 'scale':
          const scaleInput = document.getElementById(question.id);
          const valueDisplay = document.getElementById(`${question.id}-value`);
          
          if (scaleInput && valueDisplay) {
            scaleInput.addEventListener('input', () => {
              valueDisplay.textContent = scaleInput.value;
              this.saveResponse(question.id, parseInt(scaleInput.value));
            });
          }
          break;
          
        case 'options':
          const radioInputs = document.querySelectorAll(`input[name="${question.id}"]`);
          radioInputs.forEach(input => {
            input.addEventListener('change', () => {
              this.saveResponse(question.id, input.value);
              // Update styling
              document.querySelectorAll('.option-item label').forEach(label => {
                label.classList.remove('bg-blue-800/40', 'border-blue-500/40');
                label.classList.add('bg-gray-700/40', 'border-gray-600/40');
              });
              input.closest('label').classList.remove('bg-gray-700/40', 'border-gray-600/40');
              input.closest('label').classList.add('bg-blue-800/40', 'border-blue-500/40');
            });
          });
          break;
          
        case 'multiselect':
          const checkboxInputs = document.querySelectorAll(`input[name="${question.id}"]`);
          checkboxInputs.forEach(input => {
            input.addEventListener('change', () => {
              const selectedOptions = Array.from(document.querySelectorAll(`input[name="${question.id}"]:checked`))
                .map(checkbox => checkbox.value);
              this.saveResponse(question.id, selectedOptions);
              
              // Update styling for this checkbox
              const label = input.closest('label');
              if (input.checked) {
                label.classList.remove('bg-gray-700/40', 'border-gray-600/40');
                label.classList.add('bg-blue-800/40', 'border-blue-500/40');
              } else {
                label.classList.remove('bg-blue-800/40', 'border-blue-500/40');
                label.classList.add('bg-gray-700/40', 'border-gray-600/40');
              }
            });
          });
          break;
          
        case 'numeric':
        case 'duration':
          const input = document.getElementById(question.id);
          if (input) {
            input.addEventListener('change', () => {
              this.saveResponse(question.id, input.value);
            });
            input.addEventListener('blur', () => {
              this.saveResponse(question.id, input.value);
            });
          }
          break;
      }
    }
  
    saveResponse(questionId, value) {
      this.responses[questionId] = value;
      // Enable the next button once an answer is provided
      if (this.nextButton) {
        this.nextButton.removeAttribute('disabled');
      }
    }
  
    getResponseValue(questionId) {
      return this.responses[questionId];
    }
  
    updateNavigationButtons() {
      const sections = Object.keys(this.questions);
      const currentSection = this.questions[sections[this.currentSection]];
      const totalQuestionsInSection = currentSection.questions.length;
      
      // Disable/enable previous button
      if (this.prevButton) {
        if (this.currentSection === 0 && this.currentQuestion === 0) {
          this.prevButton.setAttribute('disabled', 'disabled');
          this.prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          this.prevButton.removeAttribute('disabled');
          this.prevButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
      
      // Update next button text for last question
      if (this.nextButton) {
        if (this.currentSection === sections.length - 1 && 
            this.currentQuestion === totalQuestionsInSection - 1) {
          this.nextButton.textContent = 'Finish';
        } else {
          this.nextButton.textContent = 'Next';
        }
        
        // Disable next if no answer provided yet
        const sectionKey = sections[this.currentSection];
        const questionId = this.questions[sectionKey].questions[this.currentQuestion].id;
        if (this.getResponseValue(questionId) === undefined) {
          this.nextButton.setAttribute('disabled', 'disabled');
          this.nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          this.nextButton.removeAttribute('disabled');
          this.nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    }
  
    nextQuestion() {
      const sections = Object.keys(this.questions);
      const currentSection = this.questions[sections[this.currentSection]];
      const totalQuestionsInSection = currentSection.questions.length;
      
      if (this.currentQuestion < totalQuestionsInSection - 1) {
        this.currentQuestion++;
      } else {
        this.currentSection++;
        this.currentQuestion = 0;
      }
      
      this.renderQuestion();
      this.updateProgressBar();
    }
  
    previousQuestion() {
      if (this.currentQuestion > 0) {
        this.currentQuestion--;
      } else if (this.currentSection > 0) {
        this.currentSection--;
        const sections = Object.keys(this.questions);
        const prevSection = this.questions[sections[this.currentSection]];
        this.currentQuestion = prevSection.questions.length - 1;
      }
      
      this.renderQuestion();
      this.updateProgressBar();
    }
  
    updateProgressBar() {
      if (!this.progressBar) return;
      
      const sections = Object.keys(this.questions);
      let totalQuestions = 0;
      let completedQuestions = 0;
      
      // Count total questions and questions completed so far
      for (let i = 0; i < sections.length; i++) {
        const section = this.questions[sections[i]];
        totalQuestions += section.questions.length;
        
        if (i < this.currentSection) {
          // All questions in previous sections are complete
          completedQuestions += section.questions.length;
        } else if (i === this.currentSection) {
          // Add questions completed in current section
          completedQuestions += this.currentQuestion;
        }
      }
      
      const progressPercentage = (completedQuestions / totalQuestions) * 100;
      this.progressBar.style.width = `${progressPercentage}%`;
      
      // Update section indicator if it exists
      const sectionIndicator = document.getElementById('section-indicator');
      if (sectionIndicator) {
        sectionIndicator.textContent = `Section ${this.currentSection + 1} of ${sections.length}`;
      }
    }
  
    showSubmitScreen() {
      if (!this.assessmentContainer) return;
      
      // Hide navigation buttons
      if (this.nextButton) this.nextButton.style.display = 'none';
      if (this.prevButton) this.prevButton.style.display = 'none';
      
      // Show submit button
      if (this.submitButton) this.submitButton.style.display = 'block';
      
      this.assessmentContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-5xl text-green-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-blue-400 mb-4">Assessment Complete!</h2>
          <p class="text-gray-300 mb-8">Thank you for completing your ${this.assessmentType === 'initial' ? 'AI-Readiness Assessment' : 'Training Assessment'}. We'll now analyze your responses to create your personalized space training plan.</p>
          
          <div class="bg-green-900/20 border border-green-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 class="text-xl font-semibold text-green-400 mb-3">What happens next?</h3>
            <ol class="text-left space-y-3 text-gray-300">
              <li class="flex items-start">
                <span class="bg-green-800 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">1</span>
                <span>STELLA will analyze your responses and create your personalized training program</span>
              </li>
              <li class="flex items-start">
                <span class="bg-green-800 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">2</span>
                <span>You'll receive a detailed readiness report with recommendations</span>
              </li>
              <li class="flex items-start">
                <span class="bg-green-800 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">3</span>
                <span>Your training dashboard will be customized based on your assessment results</span>
              </li>
              <li class="flex items-start">
                <span class="bg-green-800 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">4</span>
                <span>Begin your personalized mission sequence to prepare for space</span>
              </li>
            </ol>
          </div>
          
          <button id="submit-assessment-button" class="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors">
            Generate My Space Training Plan
          </button>
        </div>
      `;
      
      // Update progress bar to 100%
      if (this.progressBar) {
        this.progressBar.style.width = '100%';
      }
      
      // Add event listener to the new submit button
      const submitButton = document.getElementById('submit-assessment-button');
      if (submitButton) {
        submitButton.addEventListener('click', () => this.submitAssessment());
      }
    }
  
    async submitAssessment() {
      try {
        // Show loading state
        if (this.assessmentContainer) {
          this.assessmentContainer.innerHTML = `
            <div class="text-center py-16">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6"></div>
              <h2 class="text-2xl font-bold text-blue-400 mb-4">Analyzing Your Responses</h2>
              <p class="text-gray-300">STELLA is processing your assessment data and creating your personalized plan...</p>
            </div>
          `;
        }
        
        // Prepare assessment data
        const assessmentData = {
          type: this.assessmentType,
          responses: this.responses,
          timestamp: new Date().toISOString()
        };
        
        // Send assessment data to the server
        const response = await fetch('/api/assessment/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assessmentData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit assessment');
        }
        
        const result = await response.json();
        
        // Store results
        localStorage.setItem('latest_assessment_results', JSON.stringify(result));
        localStorage.setItem('assessmentId', result.assessmentId);
        
        // Call onComplete callback if provided
        if (typeof this.onComplete === 'function') {
          this.onComplete(result);
        }
        
        // Show success and redirect to results if no callback
        if (!this.onComplete) {
          // Show success screen
          this.showSuccessScreen(result);
          
          // Redirect to results page after a delay
          setTimeout(() => {
            window.location.href = `/assessment/results?type=${this.assessmentType}`;
          }, 1500);
        }
      } catch (error) {
        console.error('Error submitting assessment:', error);
        this.showErrorScreen(error);
      }
    }
    
    showSuccessScreen(result) {
      if (!this.assessmentContainer) return;
      
      this.assessmentContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-5xl text-green-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-blue-400 mb-4">Assessment Complete!</h2>
          <p class="text-gray-300 mb-8">STELLA has analyzed your responses and is ready with recommendations.</p>
          
          <div class="bg-green-900/20 border border-green-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 class="text-xl font-semibold text-green-400 mb-3">Analysis Summary</h3>
            <p class="text-gray-300 mb-4">${result.summary || 'Your personalized space training plan is ready!'}</p>
            <div class="grid grid-cols-2 gap-4 mt-4">
              ${result.scores ? Object.entries(result.scores).map(([key, value]) => `
                <div class="bg-green-900/30 p-3 rounded-lg">
                  <div class="text-sm text-green-300">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                  <div class="text-2xl font-bold">${value}%</div>
                </div>
              `).join('') : ''}
            </div>
          </div>
          
          <button id="view-results-button" class="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors">
            View Detailed Results
          </button>
        </div>
      `;
      
      // Add event listener to the results button
      const resultsButton = document.getElementById('view-results-button');
      if (resultsButton) {
        resultsButton.addEventListener('click', () => {
          window.location.href = `/assessment/results?type=${this.assessmentType}`;
        });
      }
    }
    
    showErrorScreen(error) {
      if (!this.assessmentContainer) return;
      
      this.assessmentContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-5xl text-red-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-red-400 mb-4">Something Went Wrong</h2>
          <p class="text-gray-300 mb-8">We encountered an error while processing your assessment. Please try again.</p>
          <button id="retry-submission" class="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors">
            Try Again
          </button>
        </div>
      `;
      
      // Add retry button functionality
      const retryButton = document.getElementById('retry-submission');
      if (retryButton) {
        retryButton.addEventListener('click', () => this.submitAssessment());
      }
    }
  }
  
  // Initialize the assessment when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const assessmentType = new URLSearchParams(window.location.search).get('type') || 'initial';
    const assessment = new ReadinessAssessment(assessmentType);
    assessment.initialize();
  });