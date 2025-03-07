document.addEventListener('DOMContentLoaded', function() {
    // Check if user has completed physical assessment
    checkPhysicalAssessment();
    
    // Set up mission card event listeners
    setupMissionCards();
  });
  
  function checkPhysicalAssessment() {
    // Fetch from API if user has completed physical assessment
    // For MVP, we'll just show the assessment popup
    const userId = getUserIdFromSession(); // Implement this function
    
    fetch(`/api/user/${userId}/assessments/physical/status`)
      .then(response => response.json())
      .then(data => {
        if (!data.completed) {
          showAssessmentPopup();
        }
      })
      .catch(error => {
        console.error('Error checking assessment status:', error);
        // For MVP, show the popup anyway
        showAssessmentPopup();
      });
  }
  
  function showAssessmentPopup() {
    const popup = document.getElementById('assessmentPopup');
    popup.classList.remove('hidden');
    
    // Add event listener to start assessment button
    document.getElementById('startAssessmentBtn').addEventListener('click', function() {
      hideAssessmentPopup();
      showAssessmentForm();
    });
  }
  
  function hideAssessmentPopup() {
    document.getElementById('assessmentPopup').classList.add('hidden');
  }
  
  function showAssessmentForm() {
    document.getElementById('physicalAssessmentFormPopup').classList.remove('hidden');
  }
  
  function setupMissionCards() {
    // Add click handlers for mission cards
    document.querySelectorAll('.mission-card').forEach(card => {
      card.querySelector('.mission-header').addEventListener('click', function() {
        toggleMission(this);
      });
      
      const button = card.querySelector('button');
      if (button) {
        button.addEventListener('click', function(e) {
          e.stopPropagation();
          const missionTitle = card.querySelector('h3').textContent;
          startMission(missionTitle);
        });
      }
    });
  }
  
  function startMission(missionTitle) {
    console.log(`Starting mission: ${missionTitle}`);
    // Redirect to mission page or show mission popup
    // window.location.href = `/training/physical/mission/${missionTitle.toLowerCase().replace(/\s+/g, '-')}`;
    alert(`Mission "${missionTitle}" would start here in the full implementation.`);
  }
  
  function getUserIdFromSession() {
    // In a real app, get the user ID from session/local storage
    // For MVP, return a placeholder
    return 'current-user-id';
  }