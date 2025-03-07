// public/js/modules/training/assessments.js
document.getElementById('initialAssessmentForm').addEventListener('submit', submitInitialAssessment);

function submitInitialAssessment(e) {
  e.preventDefault();

  const userId = 'user-id-from-session'; // Clearly retrieve user ID from logged-in session
  const formData = new FormData(e.target);

  const responses = {
    professionalBackground: {
      professionalCategory: formData.get('professionalCategory'),
      yearsExperience: formData.get('yearsExperience'),
      educationLevel: formData.get('educationLevel')
    },
    aptitudeSkills: {
      decisionMakingPreference: formData.get('decisionMakingPreference'),
      taskPreference: formData.get('taskPreference'),
      comfortWithTechnology: formData.get('comfortWithTechnology'),
      projectGoal: formData.get('projectGoal')
    },
    technicalCognitive: {
      troubleshootingConfidence: formData.get('troubleshootingConfidence'),
      instructionsPreference: formData.get('instructionsPreference'),
      logicalReasoning: formData.get('logicalReasoning'),
      multitaskingComfort: formData.get('multitaskingComfort')
    },
    personalityTraits: {
      environmentPreference: formData.get('environmentPreference'),
      feedbackResponse: formData.get('feedbackResponse'),
      colleagueDescription: formData.get('colleagueDescription')
    },
    spaceReadinessGoals: {
      primaryMotivation: formData.get('primaryMotivation'),
      interestArea: formData.get('interestArea'),
      physicalFitnessLevel: formData.get('physicalFitnessLevel')
    }
    // Include dynamically generated answers if needed
  };

  fetch('/api/assessments/initial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, responses })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      displayStellaRecommendations(data.recommendations);
    } else {
      alert('Error: ' + data.error);
    }
  })
  .catch(err => alert('Submission failed:', err));
}

function displayStellaRecommendations(recommendations) {
  const container = document.getElementById('stellaRecommendations');
  
  container.innerHTML = `
    <h3>Your Top Skills:</h3>
    <ul>
      ${recommendations.topSkills.map(skill => `<li>${skill}</li>`).join('')}
    </ul>

    <h3>Recommended Training Path:</h3>
    <ol>
      ${recommendations.personalizedPath.map(module => `<li>${module}</li>`).join('')}
    </ol>
  `;
}

// Sample frontend submitAssessment function
function submitPhysicalAssessment(userId, responses) {
    fetch('/api/assessments/physical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, responses })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Assessment saved:', data);
      localStorage.setItem('physicalAssessmentCompleted', 'true');
      // Redirect or show confirmation clearly to user
      window.location.href = '/html/physicalTraining.html';
    })
    .catch(err => console.error('Error saving assessment:', err));
  }
  
  