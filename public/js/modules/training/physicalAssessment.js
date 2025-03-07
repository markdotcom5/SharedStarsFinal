document.addEventListener('DOMContentLoaded', () => {
  const introPopup = document.getElementById('assessmentPopup');
  const formPopup = document.getElementById('physicalAssessmentFormPopup');
  const startAssessmentBtn = document.getElementById('startAssessmentBtn');
  const assessmentForm = document.getElementById('physicalAssessmentForm');
  
  console.log("Physical Assessment JS loaded");
  console.log("Intro popup:", introPopup);
  console.log("Form popup:", formPopup);
  console.log("Start button:", startAssessmentBtn);
  console.log("Form:", assessmentForm);
  
  // Show the assessment popup
  if (introPopup) {
      introPopup.classList.remove('hidden');
      console.log("Showing intro popup");
  }
  
  // Add click event to start button
  if (startAssessmentBtn) {
      startAssessmentBtn.addEventListener('click', () => {
          console.log("Start button clicked");
          if (introPopup) introPopup.classList.add('hidden');
          if (formPopup) formPopup.classList.remove('hidden');
      });
  }
  
  // Add submit event to form
  // Add this to your form submit handler
if (assessmentForm) {
  assessmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log("Form submitted");
      
      // Get form data
      const formData = new FormData(assessmentForm);
      let responses = {};
      
      for (let [key, value] of formData.entries()) {
          responses[key] = value;
          console.log(key, value);
      }
      
      // Important: Add visual feedback that the form is being processed
      const submitBtn = assessmentForm.querySelector('button[type="submit"]');
      if (submitBtn) {
          submitBtn.textContent = "Processing...";
          submitBtn.disabled = true;
      }
      
      // Delay hiding the form to give user time to see what's happening
      setTimeout(() => {
          console.log("Simulating successful submission");
          if (formPopup) formPopup.classList.add('hidden');
          
          // Show recommendations
          const recommendationsDiv = document.getElementById('stellaRecommendations');
          const recommendationsContent = document.getElementById('recommendationsContent');
          
          if (recommendationsContent && recommendationsDiv) {
              recommendationsContent.innerHTML = `
                  <h4 class="font-semibold text-lg mb-2">Recommended Training:</h4>
                  <ul class="list-disc pl-5 mb-4">
                      <li>Core & Balance Foundation</li>
                      <li>Endurance Boost Training</li>
                      <li>Flexibility Development</li>
                  </ul>
                  <h4 class="font-semibold text-lg mb-2">Personalized Tips:</h4>
                  <ul class="list-disc pl-5 mb-4">
                      <li>Focus on proper form during all exercises</li>
                      <li>Gradually increase duration of balance exercises</li>
                      <li>Maintain consistent training 3-4 times per week</li>
                  </ul>
              `;
              recommendationsDiv.classList.remove('hidden');
              console.log("Showing recommendations");
          }
      }, 2000); // Increased delay to 2 seconds for better user experience
  });
}
});