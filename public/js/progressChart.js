/**
 * Training Progress Chart
 * Visualizes user training progress across different modules
 * Handles cases where elements don't exist on certain pages
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Main function to fetch and render progress data
    const fetchProgress = async () => {
      try {
        // Mock data for development (will be replaced with actual API data)
        const trainingData = {
          moduleCompletion: { Physical: 80, Technical: 60, Psychological: 50 },
          badgesEarned: ['Beginner', 'Explorer'],
        };
        
        // API call to get progress analysis
        const response = await fetch('/api/training/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainingData }),
        }).catch(err => {
          console.warn('Progress API not available, using mock data');
          return { ok: false };
        });
        
        // Process the response or use mock data if API fails
        const data = response.ok ? await response.json() : { 
          success: true, 
          analysis: 'Your training is progressing well. Physical training is your strongest area.' 
        };
        
        if (data.success) {
          // Render chart if the canvas element exists
          const chartCanvas = document.getElementById('progress-chart');
          if (chartCanvas && typeof Chart !== 'undefined') {
            const ctx = chartCanvas.getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Physical', 'Technical', 'Psychological'],
                datasets: [
                  {
                    label: 'Completion Rate (%)',
                    data: Object.values(trainingData.moduleCompletion),
                    backgroundColor: ['#4caf50', '#2196f3', '#ff5722'],
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Percentage (%)',
                    },
                  },
                },
              },
            });
          } else if (chartCanvas) {
            console.warn('Chart.js library not loaded');
          }
          
          // Update textual analysis if element exists
          const analysisElement = document.getElementById('progress-analysis');
          if (analysisElement) {
            analysisElement.innerText = data.analysis;
          }
          
          // Update progress indicators if they exist
          updateProgressIndicators(trainingData.moduleCompletion);
        } else {
          console.error('Error fetching progress analysis:', data.error);
        }
      } catch (error) {
        console.error('Error fetching progress data:', error.message);
      }
    };
    
    // Function to update various progress indicators on the page
    const updateProgressIndicators = (moduleData) => {
      // Update mission progress bar if it exists
      const missionProgress = document.getElementById('mission-progress');
      if (missionProgress && moduleData.Physical) {
        missionProgress.style.width = `${moduleData.Physical}%`;
      }
      
      // Update progress text if it exists
      const progressText = document.getElementById('mission-progress-text');
      if (progressText && moduleData.Physical) {
        progressText.textContent = `${moduleData.Physical}%`;
      }
      
      // Update circle progress if it exists
      const circleProgress = document.getElementById('mission-circle-progress');
      if (circleProgress && moduleData.Physical) {
        // Calculate circle progress (339.292 is the circumference of a circle with r=54)
        const circumference = 339.292;
        const offset = circumference - (moduleData.Physical / 100) * circumference;
        circleProgress.style.strokeDashoffset = offset;
      }
    };
    
    // Set up event listeners for interactive elements
    const setupEventListeners = () => {
      // Add click handler to fetch progress button if it exists
      const fetchProgressButton = document.getElementById('fetch-progress');
      if (fetchProgressButton) {
        fetchProgressButton.addEventListener('click', fetchProgress);
      }
      
      // Add handlers for other progress-related buttons
      const refreshProgressButton = document.getElementById('refresh-progress');
      if (refreshProgressButton) {
        refreshProgressButton.addEventListener('click', fetchProgress);
      }
      
      // Track progress button
      const trackProgressButton = document.getElementById('track-progress');
      if (trackProgressButton) {
        trackProgressButton.addEventListener('click', () => {
          window.location.href = '/training-modules/progress-tracker.html';
        });
      }
    };
    
    // Run setup functions
    setupEventListeners();
    
    // Auto-fetch progress on pages with progress displays
    const hasProgressElements = document.getElementById('progress-chart') || 
                               document.getElementById('mission-progress') ||
                               document.getElementById('mission-circle-progress');
    
    if (hasProgressElements) {
      fetchProgress();
    }
  });