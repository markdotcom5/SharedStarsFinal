// /public/js/training/physical/mission-handler.js
try {
  class MissionHandler {
      constructor() {
        // Load missions from the global variable set by mission-data.js
        this.missions = window.physicalMissions || [];
        this.currentMission = null;
        this.sessionId = null;
        this.exerciseTimers = {};
        this.currentMetricsInterval = null;
      }
      
      initialize() {
        this.renderMissionList();
        this.setupEventListeners();
        
        // Check if URL has a mission parameter
        const urlParams = new URLSearchParams(window.location.search);
        const missionId = urlParams.get('mission');
        
        if (missionId) {
          this.loadMission(missionId);
        }
      }
      renderMissionList() {
        const missionListEl = document.getElementById('mission-list');
        if (!missionListEl) return;
        
        missionListEl.innerHTML = this.missions.map(mission => `
          <div class="mission-card" data-mission-id="${mission.id}">
            <div class="flex justify-between items-center cursor-pointer mission-header">
              <div class="flex-grow">
                <h3 class="text-xl font-bold">${mission.name}</h3>
                <div class="flex items-center mt-2">
                  <div class="text-blue-400 text-sm mr-4">STELLA AI Tracks: ${mission.metrics?.join(', ') || 'Performance metrics'}</div>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <div class="bg-gray-700 rounded-full px-3 py-1 text-sm flex items-center">
                  <span class="text-blue-400">${mission.progress || 0}%</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 mission-toggle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div class="mission-content">
              <div class="mission-progress mt-4">
                <div class="mission-progress-fill" style="width: ${mission.progress || 0}%"></div>
              </div>
              <div class="mt-4 flex justify-center">
                <button class="load-mission-btn bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-colors"
                        data-mission-id="${mission.id}">
                  ${mission.progress > 0 ? 'Continue Mission' : 'Start Mission'}
                </button>
              </div>
            </div>
          </div>
        `).join('');
        
        // Add event listeners to mission cards
        document.querySelectorAll('.mission-header').forEach(header => {
          header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const toggle = header.querySelector('.mission-toggle');
            
            content.classList.toggle('expanded');
            if (content.classList.contains('expanded')) {
              toggle.style.transform = 'rotate(180deg)';
            } else {
              toggle.style.transform = 'rotate(0)';
            }
          });
        });
        
        // Add event listeners to mission buttons
        document.querySelectorAll('.load-mission-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const missionId = e.target.dataset.missionId;
            this.loadMission(missionId);
          });
        });
      }
      
      async loadMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) return;
        
        this.currentMission = mission;
        
        // Update URL without refreshing
        window.history.pushState({}, '', `?mission=${missionId}`);
        
        // Hide mission list and show mission content
        const missionListContainer = document.getElementById('mission-list')?.parentElement;
        if (missionListContainer) {
          missionListContainer.classList.add('hidden');
        }
        
        const missionContentEl = document.getElementById('mission-content');
        if (!missionContentEl) return;
        
        missionContentEl.classList.remove('hidden');
        
        // Load mission content based on ID
        if (mission.id === 'mission1') {
          missionContentEl.innerHTML = this.renderCoreBalanceMission(mission);
        } else if (mission.id === 'mission2') {
          missionContentEl.innerHTML = this.renderEnduranceMission(mission);
        } else if (mission.id === 'mission3') {
          missionContentEl.innerHTML = this.renderStrengthMission(mission);
        } else if (mission.id === 'mission4') {
          missionContentEl.innerHTML = this.renderCoordinationMission(mission);
        } else if (mission.id === 'mission5') {
          missionContentEl.innerHTML = this.renderGripDexterityMission(mission);
        } else if (mission.id === 'mission6') {
          missionContentEl.innerHTML = this.renderFlexibilityMission(mission);
        } else if (mission.id === 'mission7') {
          missionContentEl.innerHTML = this.renderPosturalMission(mission);
        } else if (mission.id === 'mission8') {
          missionContentEl.innerHTML = this.renderReactionMission(mission);
        } else if (mission.id === 'mission9') {
          missionContentEl.innerHTML = this.renderPowerMission(mission);
        } else if (mission.id === 'mission10') {
          missionContentEl.innerHTML = this.renderRecoveryMission(mission);
        } else {
          // Generic mission renderer
          missionContentEl.innerHTML = this.renderGenericMission(mission);
        }
        
        // Initialize STELLA integration for this mission
        this.initializeSTELLA(mission);
        
        // Add back button event listener
        document.getElementById('back-to-missions')?.addEventListener('click', () => this.showMissionList());
        
        // Start training session
        await this.startTrainingSession(mission.slug || mission.id);
        
        // Load leaderboard if the container exists
        if (document.getElementById('leaderboard-container')) {
          this.loadLeaderboard();
        }
      }
      
      showMissionList() {
        const missionListContainer = document.getElementById('mission-list')?.parentElement;
        if (missionListContainer) {
          missionListContainer.classList.remove('hidden');
        }
        
        const missionContentEl = document.getElementById('mission-content');
        if (missionContentEl) {
          missionContentEl.classList.add('hidden');
        }
        
        // Clear URL parameter
        window.history.pushState({}, '', window.location.pathname);
        
        // Clear any active timers
        if (this.currentMetricsInterval) {
          clearInterval(this.currentMetricsInterval);
          this.currentMetricsInterval = null;
        }
        
        // Clear exercise timers
        Object.values(this.exerciseTimers).forEach(timer => clearInterval(timer));
        this.exerciseTimers = {};
      }
      
      async startTrainingSession(missionSlug) {
        try {
          const response = await fetch(`/api/training/physical/session/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              missionId: missionSlug
            })
          });
          
          const data = await response.json();
          if (data.success) {
            this.sessionId = data.sessionId;
            console.log('Session started:', this.sessionId);
          }
        } catch (error) {
          console.error('Error starting training session:', error);
          // Fall back to a mock session ID for demo purposes
          this.sessionId = 'mock-' + Date.now();
        }
      }
      
      initializeSTELLA(mission) {
        if (window.stellaCore) {
          // Use the existing guidance and metrics methods from StellaCore
          const metrics = mission.metrics || [];
          
          // Update STELLA status with mission information
          window.stellaCore.updateMetrics({
            missionId: mission.id,
            missionType: mission.type,
            progress: mission.progress || 0
          });
          
          // Get initial guidance for this mission type
          window.stellaCore.getGuidance(mission.type, {
            activityType: 'session-start',
            missionId: mission.id
          });
          
          // Create custom event listeners for STELLA guidance
          document.addEventListener('stella-guidance', (event) => {
            const guidance = event.detail.guidance;
            
            // Update the mission's guidance element if it exists
            const missionTypeShort = mission.type || 'generic';
            const guidanceElement = document.getElementById(`stella-${missionTypeShort}-feedback`) || 
                                   document.getElementById('stella-generic-feedback');
            
            if (guidanceElement && guidance.message) {
              guidanceElement.innerHTML = `
                <p>${guidance.message}</p>
                ${guidance.actionItems && guidance.actionItems.length ? `
                  <ul class="mt-2 space-y-1 list-disc list-inside">
                    ${guidance.actionItems.map(item => `<li class="text-yellow-300">${item}</li>`).join('')}
                  </ul>
                ` : ''}
              `;
            }
          });
        }
      }
      
      // Mission type-specific renderers
      renderCoreBalanceMission(mission) {
        return `
          <div class="mb-8 relative">
            <!-- Video background -->
            <div class="video-bg rounded-xl overflow-hidden">
              <video autoplay muted loop playsinline>
                <source src="/videos/core-training.mp4" type="video/mp4">
              </video>
            </div>
            
            <div class="relative z-10">
              <div class="flex items-center mb-4">
                <button id="back-to-missions" class="text-blue-400 hover:text-blue-300 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 class="text-3xl font-bold">${mission.name}</h1>
                
                <!-- OSHA compliance badge -->
                <span class="ml-3 compliance-badge">
                  OSHA 1910.158 Compliant
                </span>
              </div>
              <p class="text-gray-400">${mission.description}</p>
              
              <!-- Credit earning indicator -->
              <div class="flex items-center mt-2 space-x-3">
                <div class="credit-counter">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>+25 credits per exercise</span>
                </div>
                
                <!-- Certification progress -->
                <div class="flex items-center text-xs text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>${mission.certification || 'Training Certification'}: ${mission.progress || 0}% Complete</span>
                </div>
              </div>
              
              <!-- Mission Progress -->
              <div class="mt-6">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-400">Mission Progress</span>
                  <span class="text-blue-400">${mission.progress || 0}%</span>
                </div>
                <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" style="width: ${mission.progress || 0}%"></div>
                </div>
              </div>
            </div>
          </div>
    
          <!-- STELLA Guidance -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8 border border-blue-500/20">
            <div class="flex items-start">
              <div class="stella-avatar mr-4 flex-shrink-0">
                <span class="text-2xl">🤖</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-blue-400 mb-2">STELLA's Guidance</h2>
                <div id="stella-balance-feedback" class="text-gray-300">
                  <p>Focus on engaging your core muscles throughout each exercise. I'm monitoring your form and will provide real-time feedback.</p>
                </div>
              </div>
            </div>
          </div>
    
          <!-- Exercise List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            ${mission.exercises ? mission.exercises.map(exercise => `
              <!-- Exercise: ${exercise.name} -->
              <div class="exercise-card" data-exercise="${exercise.id}">
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center">
                    <h3 class="text-xl font-bold">${exercise.name}</h3>
                    <span class="ml-2 badge badge-blue">${exercise.type}</span>
                  </div>
                  <div class="credit-counter">
                    <span>+25</span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <p class="text-gray-300 mb-2">${exercise.description}</p>
                  
                  <!-- OSHA compliance indicator -->
                  <div class="flex items-center text-xs text-green-400 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${exercise.compliance || 'Training Standard Compliant'}</span>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 mt-4">
                    ${exercise.sets ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Sets</span>
                        <div class="text-lg font-bold">${exercise.sets}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.duration ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Duration</span>
                        <div class="text-lg font-bold">${exercise.duration}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.reps ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Reps</span>
                        <div class="text-lg font-bold">${exercise.reps}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.rest ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Rest</span>
                        <div class="text-lg font-bold">${exercise.rest}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="mr-2 text-sm text-gray-400">Form Score:</span>
                    <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full" style="width: 0%"></div>
                    </div>
                  </div>
                  <button class="start-exercise-btn bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    Start Exercise
                  </button>
                </div>
              </div>
            `).join('') : ''}
            
            ${mission.premiumExercises ? mission.premiumExercises.map(exercise => `
              <!-- Premium Exercise: ${exercise.name} -->
              <div class="exercise-card premium-feature" data-exercise="${exercise.id}">
                <!-- Premium overlay for Elite-only content -->
                <div class="premium-overlay">
                  <div class="text-center">
                    <div class="text-purple-400 font-bold mb-2">Elite Tier Feature</div>
                    <button class="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-full transition-colors">
                      Upgrade to Unlock
                    </button>
                  </div>
                </div>
                
                <!-- Exercise content same as regular exercises -->
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center">
                    <h3 class="text-xl font-bold">${exercise.name}</h3>
                    <span class="ml-2 badge badge-red">${exercise.type}</span>
                  </div>
                  <div class="credit-counter">
                    <span>+50</span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <p class="text-gray-300 mb-2">${exercise.description}</p>
                  
                  <!-- OSHA compliance indicator -->
                  <div class="flex items-center text-xs text-green-400 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${exercise.compliance || 'Training Standard Compliant'}</span>
                  </div>
                </div>
              </div>
            `).join('') : ''}
          </div>
    
          <!-- Performance Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-xl font-bold mb-4">Core Metrics</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="metric-box">
                  <span class="text-sm text-gray-400">Core Engagement</span>
                  <div class="text-xl font-bold text-blue-400" id="core-engagement">0%</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">Balance Score</span>
                  <div class="text-xl font-bold text-blue-400" id="balance-score">0%</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">Stability Index</span>
                  <div class="text-xl font-bold text-blue-400" id="stability-score">0%</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">Posture Quality</span>
                  <div class="text-xl font-bold text-blue-400" id="posture-score">0%</div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-xl font-bold mb-4">Progress Tracking</h3>
              <div id="progress-chart" class="h-48">
                <!-- Chart will be rendered here -->
              </div>
            </div>
          </div>
          
          <!-- Certification Progress -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">Certification Progress</h3>
            <div class="grid grid-cols-4 gap-2">
              <div class="certification-milestone ${(mission.progress || 0) >= 25 ? 'completed' : ''}">
                <div class="milestone-circle">1</div>
                <div class="milestone-label">Basics</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 50 ? 'completed' : ''}">
                <div class="milestone-circle">2</div>
                <div class="milestone-label">Intermediate</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 75 ? 'completed' : ''}">
                <div class="milestone-circle">3</div>
                <div class="milestone-label">Advanced</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 100 ? 'completed' : ''}">
                <div class="milestone-circle">4</div>
                <div class="milestone-label">Expert</div>
              </div>
            </div>
          </div>
          
          <!-- Leaderboard -->
          <div id="leaderboard-container" class="bg-gray-800 rounded-xl p-6 mb-8">
            <!-- Leaderboard content will be loaded dynamically -->
          </div>
          
          <!-- Next Steps -->
          <div class="bg-gray-800 rounded-xl p-6">
            <h3 class="text-xl font-bold mb-4">Next Steps</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="next-step-card">
                <h4 class="text-lg font-bold mb-2">Complete All Exercises</h4>
                <p class="text-sm text-gray-300">Finish all exercises to earn the Core Balance Specialist certification.</p>
              </div>
              <div class="next-step-card">
                <h4 class="text-lg font-bold mb-2">Advanced Training</h4>
                <p class="text-sm text-gray-300">Unlock advanced training modules by completing this mission.</p>
              </div>
            </div>
          </div>
        `;
      }
      
      renderEnduranceMission(mission) {
        return `
          <div class="mb-8 relative">
            <!-- Video background -->
            <div class="video-bg rounded-xl overflow-hidden">
              <video autoplay muted loop playsinline>
                <source src="/videos/endurance-training.mp4" type="video/mp4">
              </video>
            </div>
            
            <div class="relative z-10">
              <div class="flex items-center mb-4">
                <button id="back-to-missions" class="text-blue-400 hover:text-blue-300 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 class="text-3xl font-bold">${mission.name}</h1>
                
                <!-- OSHA compliance badge -->
                <span class="ml-3 compliance-badge">
                  OSHA 1910.158 Compliant
                </span>
              </div>
              <p class="text-gray-400">${mission.description}</p>
              
              <!-- Credit earning indicator -->
              <div class="flex items-center mt-2 space-x-3">
                <div class="credit-counter">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>+25 credits per exercise</span>
                </div>
                
                <!-- Certification progress -->
                <div class="flex items-center text-xs text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>${mission.certification || 'Endurance Certification'}: ${mission.progress || 0}% Complete</span>
                </div>
              </div>
              
              <!-- Mission Progress -->
              <div class="mt-6">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-400">Mission Progress</span>
                  <span class="text-blue-400">${mission.progress || 0}%</span>
                </div>
                <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" style="width: ${mission.progress || 0}%"></div>
                </div>
              </div>
            </div>
          </div>
    
          <!-- STELLA Guidance -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8 border border-blue-500/20">
            <div class="flex items-start">
              <div class="stella-avatar mr-4 flex-shrink-0">
                <span class="text-2xl">🤖</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-blue-400 mb-2">STELLA's Guidance</h2>
                <div id="stella-endurance-feedback" class="text-gray-300">
                  <p>Focus on maintaining your heart rate within the target zones. I'll monitor your fatigue levels and provide guidance to maximize your endurance training.</p>
                </div>
              </div>
            </div>
          </div>
    
          <!-- Heart Rate Zones -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8">
            <h2 class="text-xl font-bold mb-4">Heart Rate Zones</h2>
            <div class="space-y-4">
              ${mission.zones ? mission.zones.map(zone => `
                <div class="zone-card" data-zone-id="${zone.id}" data-target-hr="${zone.targetHR}">
                  <div class="flex justify-between items-center">
                    <h4 class="text-lg font-semibold">${zone.name}</h4>
                    <span class="text-blue-400">${zone.duration}</span>
                  </div>
                  <div class="mt-2 grid grid-cols-4 gap-2">
                    <div class="metric-box">
                      <span class="text-sm text-gray-400">Target HR</span>
                      <span class="text-lg font-bold">${zone.targetHR} bpm</span>
                    </div>
                    <div class="metric-box">
                      <span class="text-sm text-gray-400">Time in Zone</span>
                      <span class="zone-time">--</span>
                    </div>
                    <div class="metric-box">
                      <span class="text-sm text-gray-400">Efficiency</span>
                      <span class="efficiency-score">--</span>
                    </div>
                    <div class="metric-box">
                      <span class="text-sm text-gray-400">Recovery</span>
                      <span class="recovery-rate">--</span>
                    </div>
                  </div>
                </div>
              `).join('') : ''}
            </div>
          </div>
    
          <!-- Exercise List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            ${mission.exercises ? mission.exercises.map(exercise => `
              <!-- Exercise: ${exercise.name} -->
              <div class="exercise-card" data-exercise="${exercise.id}">
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center">
                    <h3 class="text-xl font-bold">${exercise.name}</h3>
                    <span class="ml-2 badge badge-blue">${exercise.type}</span>
                  </div>
                  <div class="credit-counter">
                    <span>+25</span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <p class="text-gray-300 mb-2">${exercise.description}</p>
                  
                  <!-- OSHA compliance indicator -->
                  <div class="flex items-center text-xs text-green-400 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${exercise.compliance || 'Training Standard Compliant'}</span>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 mt-4">
                    ${exercise.sets ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Sets</span>
                        <div class="text-lg font-bold">${exercise.sets}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.duration ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Duration</span>
                        <div class="text-lg font-bold">${exercise.duration}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.reps ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Reps</span>
                        <div class="text-lg font-bold">${exercise.reps}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.rest ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Rest</span>
                        <div class="text-lg font-bold">${exercise.rest}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="mr-2 text-sm text-gray-400">Form Score:</span>
                    <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full" style="width: 0%"></div>
                    </div>
                  </div>
                  <button class="start-exercise-btn bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    Start Exercise
                  </button>
                </div>
              </div>
            `).join('') : ''}
          </div>
          
          <!-- Performance Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-xl font-bold mb-4">Endurance Metrics</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="metric-box">
                  <span class="text-sm text-gray-400">Heart Rate</span>
                  <div class="text-xl font-bold text-blue-400" id="heart-rate">0 bpm</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">O₂ Saturation</span>
                  <div class="text-xl font-bold text-blue-400" id="o2-saturation">0%</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">HRV</span>
                  <div class="text-xl font-bold text-blue-400" id="hrv">0 ms</div>
                </div>
                <div class="metric-box">
                  <span class="text-sm text-gray-400">VO₂ Estimate</span>
                  <div class="text-xl font-bold text-blue-400" id="vo2">0 ml/kg/min</div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-xl font-bold mb-4">Heart Rate Monitoring</h3>
              <div id="hr-chart" class="h-48">
                <!-- Heart rate chart will be rendered here -->
              </div>
            </div>
          </div>
          
          <!-- Certification Progress -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">Certification Progress</h3>
            <div class="grid grid-cols-4 gap-2">
              <div class="certification-milestone ${(mission.progress || 0) >= 25 ? 'completed' : ''}">
                <div class="milestone-circle">1</div>
                <div class="milestone-label">Basic Endurance</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 50 ? 'completed' : ''}">
                <div class="milestone-circle">2</div>
                <div class="milestone-label">Advanced Zones</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 75 ? 'completed' : ''}">
                <div class="milestone-circle">3</div>
                <div class="milestone-label">Recovery Pro</div>
              </div>
              <div class="certification-milestone ${(mission.progress || 0) >= 100 ? 'completed' : ''}">
                <div class="milestone-circle">4</div>
                <div class="milestone-label">Elite Endurance</div>
              </div>
            </div>
          </div>
          
          <!-- Leaderboard -->
          <div id="leaderboard-container" class="bg-gray-800 rounded-xl p-6 mb-8">
            <!-- Leaderboard content will be loaded dynamically -->
          </div>
        `;
      }
      
      // For simplicity, we'll use a generic mission renderer for the remaining mission types
      renderStrengthMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderCoordinationMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderGripDexterityMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderFlexibilityMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderPosturalMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderReactionMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderPowerMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderRecoveryMission(mission) {
        return this.renderGenericMission(mission);
      }
      
      renderGenericMission(mission) {
        // Generic mission renderer that works for any mission type
        return `
          <div class="mb-8 relative">
            <div class="relative z-10">
              <div class="flex items-center mb-4">
                <button id="back-to-missions" class="text-blue-400 hover:text-blue-300 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 class="text-3xl font-bold">${mission.name}</h1>
                
                <!-- OSHA compliance badge -->
                <span class="ml-3 compliance-badge">
                  OSHA 1910.158 Compliant
                </span>
              </div>
              <p class="text-gray-400">${mission.description}</p>
              
              <!-- Credit earning indicator -->
              <div class="flex items-center mt-2 space-x-3">
                <div class="credit-counter">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>+25 credits per exercise</span>
                </div>
                
                <!-- Certification progress -->
                <div class="flex items-center text-xs text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>${mission.certification || 'Training Certification'}: ${mission.progress || 0}% Complete</span>
                </div>
              </div>
              
              <!-- Mission Progress -->
              <div class="mt-6">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-400">Mission Progress</span>
                  <span class="text-blue-400">${mission.progress || 0}%</span>
                </div>
                <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" style="width: ${mission.progress || 0}%"></div>
                </div>
              </div>
            </div>
          </div>
    
          <!-- STELLA Guidance -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8 border border-blue-500/20">
            <div class="flex items-start">
              <div class="stella-avatar mr-4 flex-shrink-0">
                <span class="text-2xl">🤖</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-blue-400 mb-2">STELLA's Guidance</h2>
                <div id="stella-generic-feedback" class="text-gray-300">
                  <p>I'm monitoring your performance metrics and will provide real-time guidance to optimize your training.</p>
                </div>
              </div>
            </div>
          </div>
    
          <!-- Exercise List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            ${mission.exercises ? mission.exercises.map(exercise => `
              <div class="exercise-card" data-exercise="${exercise.id}">
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center">
                    <h3 class="text-xl font-bold">${exercise.name}</h3>
                    <span class="ml-2 badge badge-blue">${exercise.type}</span>
                  </div>
                  <div class="credit-counter">
                    <span>+25</span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <p class="text-gray-300 mb-2">${exercise.description}</p>
                  
                  <!-- OSHA compliance indicator -->
                  <div class="flex items-center text-xs text-green-400 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${exercise.compliance || 'Training Standard Compliant'}</span>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 mt-4">
                    ${exercise.sets ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Sets</span>
                        <div class="text-lg font-bold">${exercise.sets}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.duration ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Duration</span>
                        <div class="text-lg font-bold">${exercise.duration}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.reps ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Reps</span>
                        <div class="text-lg font-bold">${exercise.reps}</div>
                      </div>
                    ` : ''}
                    
                    ${exercise.rest ? `
                      <div class="metric-box">
                        <span class="text-xs text-gray-400">Rest</span>
                        <div class="text-lg font-bold">${exercise.rest}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="mr-2 text-sm text-gray-400">Progress:</span>
                    <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full" style="width: 0%"></div>
                    </div>
                  </div>
                  <button class="start-exercise-btn bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    Start Exercise
                  </button>
                </div>
              </div>
            `).join('') : ''}
          </div>
          
          <!-- Generic metrics based on mission type -->
          <div class="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">Performance Metrics</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${mission.metrics ? mission.metrics.map(metric => `
                <div class="metric-box">
                  <span class="text-sm text-gray-400">${this.formatMetricName(metric)}</span>
                  <div class="text-xl font-bold text-blue-400" id="${metric}-value">--</div>
                </div>
              `).join('') : ''}
            </div>
          </div>
          
          <!-- Leaderboard -->
          <div id="leaderboard-container" class="bg-gray-800 rounded-xl p-6 mb-8">
            <!-- Leaderboard content will be loaded dynamically -->
          </div>
        `;
      }
      
      // Helper to format metric names for display
      formatMetricName(metric) {
        // Convert camelCase to Title Case with spaces
        return metric
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
      }
      
      setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', (e) => {
          if (e.target.classList.contains('start-exercise-btn')) {
            this.handleExerciseStart(e.target);
          }
        });
      }
      
      handleExerciseStart(button) {
        const exerciseCard = button.closest('.exercise-card');
        if (!exerciseCard) return;
        
        const exerciseId = exerciseCard.dataset.exercise;
        if (!exerciseId) return;
        
        // Find the exercise data from the current mission
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) return;
        
        // Toggle button text/state
        if (button.textContent.trim() === 'Start Exercise') {
          button.textContent = 'In Progress...';
          exerciseCard.classList.add('ring', 'ring-blue-500');
          
          // Start exercise timer if duration is available
          if (exercise.duration) {
            this.startExerciseTimer(exercise.duration, exerciseId);
          }
          
          // Start metrics simulation based on mission ID
          this.startMetricsSimulation(exerciseId);
          
        } else {
          button.textContent = 'Start Exercise';
          exerciseCard.classList.remove('ring', 'ring-blue-500');
          
          // Clear any ongoing simulations
          if (this.currentMetricsInterval) {
            clearInterval(this.currentMetricsInterval);
            this.currentMetricsInterval = null;
          }
        }
      }
      
      findExerciseById(exerciseId) {
        if (!this.currentMission) return null;
        
        // Check in regular exercises
        if (this.currentMission.exercises) {
          const exercise = this.currentMission.exercises.find(e => e.id === exerciseId);
          if (exercise) return exercise;
        }
        
        // Check in premium exercises
        if (this.currentMission.premiumExercises) {
          const premiumExercise = this.currentMission.premiumExercises.find(e => e.id === exerciseId);
          if (premiumExercise) return premiumExercise;
        }
        
        return null;
      }
      
      startExercise(exercise, exerciseCard, button) {
        console.log("Starting exercise:", exercise.name);
        
        // Update button
        button.textContent = 'Complete Exercise';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        button.classList.add('bg-green-600', 'hover:bg-green-500');
        
        // Show exercise timer if applicable
        // (rest of your existing code for timer)
        
        // Get STELLA guidance for this exercise
        if (window.stellaCore) {
          window.stellaCore.getGuidance('exercise', {
            exerciseId: exercise.id,
            exerciseType: exercise.type,
            activityType: 'exercise-start'
          });
          
          // Update STELLA status
          window.stellaCore.updateMetrics({
            currentExercise: exercise.id,
            exerciseType: exercise.type
          });
        }
        
        // Track active exercise
        this.activeExercise = exercise;
      }
      
      completeExercise(exercise, exerciseCard, button) {
        console.log("Completing exercise:", exercise.name);
        
        // Update button
        button.textContent = 'Exercise Completed';
        button.disabled = true;
        button.classList.remove('bg-green-600', 'hover:bg-green-500');
        button.classList.add('bg-gray-600');
        
        // Add completion styling
        exerciseCard.classList.add('border-green-500');
        exerciseCard.classList.add('border-2');
        
        // Clear timer if exists
        if (this.exerciseTimers[exercise.id]) {
          clearInterval(this.exerciseTimers[exercise.id]);
          delete this.exerciseTimers[exercise.id];
        }
        
        // Award credits via PhysicalTrainingService API
        this.awardCredits(exercise.id);
        
        // Update mission progress
        this.updateMissionProgress();
        
        // Inform STELLA of exercise completion
        if (window.stellaCore) {
          window.stellaCore.getGuidance('exercise', {
            exerciseId: exercise.id,
            exerciseType: exercise.type,
            activityType: 'exercise-complete',
            performance: 'good'
          });
        }
        
       // Clear active exercise
this.activeExercise = null;
}

startExerciseTimer(duration, exerciseId) {
  // Create timer display if it doesn't exist
  let timerElement = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"] .exercise-timer`);
  if (!timerElement) {
    timerElement = document.createElement('div');
    timerElement.className = 'exercise-timer mt-2 text-center text-xl font-bold text-blue-400';
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'mt-1 w-full h-2 bg-gray-700 rounded-full overflow-hidden';
    progressBar.innerHTML = '<div class="progress-bar-fill h-full bg-blue-500 rounded-full" style="width: 0%"></div>';
    
    // Add to exercise card
    const exerciseCard = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"]`);
    if (exerciseCard) {
      exerciseCard.querySelector('.mb-4').appendChild(timerElement);
      exerciseCard.querySelector('.mb-4').appendChild(progressBar);
    }
  }

        
        // Clear any existing timer
        if (this.exerciseTimers[exerciseId]) {
          clearInterval(this.exerciseTimers[exerciseId]);
        }
        
        const updateTimer = () => {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          
          // Update progress bar
          const progressBar = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"] .progress-bar-fill`);
          if (progressBar) {
            const percentage = 100 - ((seconds / originalSeconds) * 100);
            progressBar.style.width = `${percentage}%`;
          }
        };
        
        // Initial display
        updateTimer();
        
        // Start countdown
        this.exerciseTimers[exerciseId] = setInterval(() => {
          seconds--;
          updateTimer();
          
          if (seconds <= 0) {
            clearInterval(this.exerciseTimers[exerciseId]);
            delete this.exerciseTimers[exerciseId];
            this.completeExercise(exerciseId);
          }
        }, 1000);
      }
      parseDuration(duration) {
        if (typeof duration === 'number') return duration;
        if (!duration) return 30; // Default to 30 seconds
        
        // Parse duration formats: "30s", "2m", "60 sec", etc.
        const match = duration.match(/(\d+)\s*([a-z]*)/i);
        if (!match) return 30;
        
        const value = parseInt(match[1]);
        const unit = (match[2] || 's').toLowerCase();
        
        if (unit.startsWith('m')) {
          return value * 60; // Minutes to seconds
        } else {
          return value; // Assume seconds
        }
      }
      
      startMetricsSimulation(exerciseId) {
        // Clear any existing simulation
        if (this.currentMetricsInterval) {
          clearInterval(this.currentMetricsInterval);
          this.currentMetricsInterval = null;
        }
        
        // Get exercise details for better simulation
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) {
          console.warn(`Exercise with ID ${exerciseId} not found`);
          return;
        }
        
        // Update STELLA status if available
        if (window.stellaCore) {
          window.stellaCore.updateMetrics({
            exerciseId,
            exerciseType: exercise.type,
            missionId: this.currentMission.id,
            activityStarted: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Choose simulation based on mission type
        if (this.currentMission.id === 'mission1') {
          this.simulateCoreBalanceMetrics(exerciseId);
        } else if (this.currentMission.id === 'mission2') {
          this.simulateEnduranceMetrics(exerciseId);
        } else {
          this.simulateGenericMetrics(exerciseId);
        }
      }
      
      simulateCoreBalanceMetrics(exerciseId) {
        // Initial values for smoother transitions
        let currentMetrics = {
          coreEngagement: 65,
          balanceScore: 60,
          stabilityScore: 70,
          postureScore: 75
        };
        
        // Simulate metrics for core balance mission
        this.currentMetricsInterval = setInterval(() => {
          // Gradually change metrics with some randomness for realism
          currentMetrics.coreEngagement = Math.min(95, Math.max(50, currentMetrics.coreEngagement + (Math.random() * 10 - 4)));
          currentMetrics.balanceScore = Math.min(95, Math.max(50, currentMetrics.balanceScore + (Math.random() * 10 - 4)));
          currentMetrics.stabilityScore = Math.min(95, Math.max(50, currentMetrics.stabilityScore + (Math.random() * 8 - 3)));
          currentMetrics.postureScore = Math.min(95, Math.max(50, currentMetrics.postureScore + (Math.random() * 8 - 3)));
          
          // Round values for display
          const coreEngagement = Math.round(currentMetrics.coreEngagement);
          const balanceScore = Math.round(currentMetrics.balanceScore);
          const stabilityScore = Math.round(currentMetrics.stabilityScore);
          const postureScore = Math.round(currentMetrics.postureScore);
          
          // Create the metrics object
          const metricValues = {
            coreEngagement,
            balanceScore,
            stabilityScore,
            postureScore,
            exerciseId,
            timestamp: new Date().toISOString()
          };
          
         // Update UI
         document.getElementById('core-engagement')?.textContent = `${coreEngagement}%`;
         document.getElementById('balance-score')?.textContent = `${balanceScore}%`;
         document.getElementById('stability-score')?.textContent = `${stabilityScore}%`;
         document.getElementById('posture-score')?.textContent = `${postureScore}%`;
         
         // Update form score
         const formBar = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"] .bg-green-500`);
         if (formBar) {
           const formScore = Math.floor((coreEngagement + balanceScore + stabilityScore + postureScore) / 4);
           formBar.style.width = `${formScore}%`;
           
           // Add data attribute for tracking
           formBar.dataset.currentScore = formScore;
         }
         
         // Update STELLA with the metrics
         if (window.stellaCore) {
           window.stellaCore.updateMetrics(metricValues);
           
           // Get exercise guidance if metrics indicate issues
           if (balanceScore < 60 || postureScore < 65) {
             window.stellaCore.getGuidance('exercise', {
               exerciseId,
               metrics: metricValues,
               needsCorrection: true
             }).catch(err => console.warn('STELLA guidance error:', err));
           }
         }
         
         // Send metrics to backend
         this.sendMetrics(exerciseId, metricValues);
       }, 3000);
     }
     
     /**
      * Simulates endurance metrics for cardio-based exercises
      * @param {string} exerciseId - The ID of the exercise
      */
     simulateEnduranceMetrics(exerciseId) {
       // Initial values
       let heartRate = 90; // Starting HR
       let o2Saturation = 96;
       let hrv = 45;
       let vo2 = 35;
       let timeInZone = 0;
       
       this.currentMetricsInterval = setInterval(() => {
         // Simulate gradual heart rate increase with some variability
         heartRate = Math.min(180, Math.max(85, heartRate + (Math.random() * 5 - 1.5)));
         o2Saturation = Math.min(99, Math.max(92, o2Saturation + (Math.random() * 2 - 1)));
         hrv = Math.min(60, Math.max(25, hrv + (Math.random() * 8 - 4)));
         vo2 = Math.min(50, Math.max(30, vo2 + (Math.random() * 3 - 1)));
         timeInZone += 3; // 3 seconds since last interval
         
         // Round values for display
         const roundedHR = Math.round(heartRate);
         const roundedO2 = Math.round(o2Saturation);
         const roundedHRV = Math.round(hrv);
         const roundedVO2 = Math.round(vo2);
         
         // Create the metrics object
         const metricValues = {
           heartRate: roundedHR,
           o2Saturation: roundedO2,
           hrv: roundedHRV,
           vo2: roundedVO2,
           timeInZone,
           exerciseId,
           timestamp: new Date().toISOString()
         };
         
         // Update UI
         document.getElementById('heart-rate')?.textContent = `${roundedHR} bpm`;
         document.getElementById('o2-saturation')?.textContent = `${roundedO2}%`;
         document.getElementById('hrv')?.textContent = `${roundedHRV} ms`;
         document.getElementById('vo2')?.textContent = `${roundedVO2} ml/kg/min`;
         
         // Update heart rate zones
         if (this.currentMission?.zones) {
           this.updateHeartRateZones(roundedHR);
         }
         
         // Update STELLA with the metrics
         if (window.stellaCore) {
           window.stellaCore.updateMetrics(metricValues);
           
           // Get STELLA guidance if heart rate is too high
           if (roundedHR > 160) {
             window.stellaCore.getGuidance('zone', {
               zoneId: 'threshold',
               metrics: metricValues,
               warning: 'high_heart_rate'
             }).catch(err => console.warn('STELLA guidance error:', err));
           }
         }
         
         // Send metrics to backend
         this.sendMetrics(exerciseId, metricValues);
       }, 3000);
     }
     
     /**
      * Updates heart rate zone indicators based on current heart rate
      * @param {number} heartRate - Current heart rate
      * @returns {string|null} - The active zone ID or null
      */
     updateHeartRateZones(heartRate) {
       if (!this.currentMission?.zones) return null;
       
       // Track active zone for UI updates
       let activeZoneId = null;
       
       this.currentMission.zones.forEach(zone => {
         const zoneElement = document.querySelector(`.zone-card[data-zone-id="${zone.id}"]`);
         if (!zoneElement) return;
         
         const targetHR = parseInt(zone.targetHR || 0);
         const hrDiff = Math.abs(heartRate - targetHR);
         
         // Check if user is in this zone (within 10 bpm)
         if (hrDiff <= 10) {
           zoneElement.classList.add('active-zone');
           activeZoneId = zone.id;
           
           // Update time in zone
           const timeElement = zoneElement.querySelector('.zone-time');
           if (timeElement && timeElement.textContent === '--') {
             timeElement.textContent = '00:30';
           } else if (timeElement) {
             const [mins, secs] = timeElement.textContent.split(':').map(Number);
             let newSecs = secs + 30;
             let newMins = mins;
             
             if (newSecs >= 60) {
               newSecs = 0;
               newMins += 1;
             }
             
             timeElement.textContent = `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
           }
           
           // Update efficiency score based on how close to target HR
           const efficiencyElement = zoneElement.querySelector('.efficiency-score');
           if (efficiencyElement) {
             const efficiency = Math.max(0, 100 - hrDiff * 10);
             efficiencyElement.textContent = `${efficiency}%`;
             
             // Add color class based on efficiency
             efficiencyElement.classList.remove('text-green-400', 'text-yellow-400', 'text-red-400');
             if (efficiency >= 85) {
               efficiencyElement.classList.add('text-green-400');
             } else if (efficiency >= 60) {
               efficiencyElement.classList.add('text-yellow-400');
             } else {
               efficiencyElement.classList.add('text-red-400');
             }
             
             // Update STELLA with active zone if available
             if (window.stellaCore && activeZoneId) {
               window.stellaCore.updateMetrics({
                 activeZone: activeZoneId,
                 zoneEfficiency: efficiency,
                 heartRate
               });
             }
           }
         } else {
           zoneElement.classList.remove('active-zone');
         }
       });
       
       return activeZoneId;
     }
     
     /**
      * Simulates generic exercise metrics for non-specialized exercises
      * @param {string} exerciseId - The ID of the exercise
      */
     simulateGenericMetrics(exerciseId) {
       // Get metrics from current mission or use defaults
       const metrics = this.currentMission?.metrics || [
         'progress', 'formScore', 'intensity', 'technique'
       ];
       
       // Initial values for more realistic simulation
       const currentValues = {};
       metrics.forEach(metric => {
         currentValues[metric] = 65 + Math.floor(Math.random() * 10);
       });
       
       this.currentMetricsInterval = setInterval(() => {
         // Generate metrics with realistic progression
         const metricValues = { exerciseId, timestamp: new Date().toISOString() };
         
         metrics.forEach(metric => {
           // Adjust current value with some randomness
           currentValues[metric] = Math.min(95, Math.max(50, 
             currentValues[metric] + (Math.random() * 6 - 2)
           ));
           
           // Round for display
           const value = Math.round(currentValues[metric]);
           metricValues[metric] = value;
           
           // Update UI if element exists
           const element = document.getElementById(`${metric}-value`);
           if (element) {
             if (metric.toLowerCase().includes('rate')) {
               element.textContent = `${value} bpm`;
             } else if (metric.toLowerCase().includes('percentage') || 
                       metric.toLowerCase().includes('score')) {
               element.textContent = `${value}%`;
             } else {
               element.textContent = `${value}`;
             }
           }
         });
         
         // Update form score bar
         const formBar = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"] .bg-green-500`);
         if (formBar) {
           const formScore = metricValues.formScore || Math.round(currentValues.technique || 75);
           formBar.style.width = `${formScore}%`;
           formBar.dataset.currentScore = formScore;
         }
         
         // Update STELLA with the metrics
         if (window.stellaCore) {
           window.stellaCore.updateMetrics(metricValues);
           
           // Get guidance if technique or form score is low
           if ((metricValues.technique && metricValues.technique < 65) || 
               (metricValues.formScore && metricValues.formScore < 65)) {
             window.stellaCore.getGuidance('exercise', {
               exerciseId,
               metrics: metricValues,
               needsCorrection: true
             }).catch(err => console.warn('STELLA guidance error:', err));
           }
         }
         
         // Send metrics to backend
         this.sendMetrics(exerciseId, metricValues);
       }, 3000);
     }
     
     /**
      * Marks an exercise as completed and updates progress
      * @param {string} exerciseId - The ID of the completed exercise
      */
     completeExercise(exerciseId) {
       // Handle exercise completion
       const exerciseCard = document.querySelector(`.exercise-card[data-exercise="${exerciseId}"]`);
       if (!exerciseCard) return;
       
       // Clear any ongoing metrics simulation
       if (this.currentMetricsInterval) {
         clearInterval(this.currentMetricsInterval);
         this.currentMetricsInterval = null;
       }
       
       // Get final metrics for completion
       const formBar = exerciseCard.querySelector('.bg-green-500');
       const finalScore = formBar ? parseInt(formBar.dataset.currentScore || '75') : 75;
       
       // Update UI
       exerciseCard.classList.add('completed');
       const button = exerciseCard.querySelector('.start-exercise-btn');
       if (button) {
         button.textContent = 'Completed';
         button.disabled = true;
         button.classList.remove('bg-green-600', 'hover:bg-green-500');
         button.classList.add('bg-gray-600');
       }
       
       // Award credits
       this.awardCredits(exerciseId, finalScore);
       
       // Update mission progress
       this.updateMissionProgress();
       
       // Send completion to STELLA
       if (window.stellaCore) {
         window.stellaCore.exerciseCompleted({
           exerciseId,
           missionId: this.currentMission?.id,
           performance: finalScore >= 85 ? 'excellent' : finalScore >= 70 ? 'good' : 'needs_improvement',
           finalScore,
           completionTime: new Date().toISOString()
         });
       }
       
       // Add completion animation
       const completionBadge = document.createElement('div');
       completionBadge.className = 'absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 animate-pulse';
       completionBadge.textContent = 'COMPLETED';
       exerciseCard.style.position = 'relative';
       exerciseCard.appendChild(completionBadge);
     }
     
     /**
      * Updates the current mission's progress based on completed exercises
      */
     updateMissionProgress() {
       if (!this.currentMission) return;
       
       // Calculate new progress percentage based on completed exercises
       const completedExercises = document.querySelectorAll('.exercise-card.completed').length;
       const totalExercises = document.querySelectorAll('.exercise-card:not(.premium-feature)').length;
       
       if (totalExercises === 0) return;
       
       const newProgress = Math.min(100, Math.round((completedExercises / totalExercises) * 100));
       
       // Update progress in the UI
       const progressElements = document.querySelectorAll('.progress-indicator, .mission-progress-value');
       progressElements.forEach(el => {
         if (el.closest('.mission-progress') || el.closest('[data-progress]')) {
           el.textContent = `${newProgress}%`;
         }
       });
       
       const progressBars = document.querySelectorAll('.progress-fill, .progress-bar-fill');
       progressBars.forEach(bar => {
         if (bar.closest('.mission-progress') || bar.closest('[data-progress]')) {
           bar.style.width = `${newProgress}%`;
         }
       });
       
       // Update certification milestones
       document.querySelectorAll('.certification-milestone').forEach((milestone, index) => {
         const threshold = (index + 1) * 25; // 25%, 50%, 75%, 100%
         if (newProgress >= threshold) {
           milestone.classList.add('completed');
         } else {
           milestone.classList.remove('completed');
         }
       });
       
       // Update mission object
       this.currentMission.progress = newProgress;
       
       // Update session progress display
       const progressPercentage = document.getElementById('progress-percentage');
       if (progressPercentage) {
         progressPercentage.textContent = `${newProgress}%`;
       }
       
       // Send progress update to server
       this.updateMissionProgressOnServer(newProgress);
       
       // Update STELLA with progress info
       if (window.stellaCore) {
         window.stellaCore.updateMetrics({
           missionProgress: newProgress,
           missionId: this.currentMission.id,
           completedExercises,
           totalExercises,
           updateType: 'progress'
         });
         
         // Check for mission completion
         if (newProgress >= 100) {
           window.stellaCore.getGuidance('session-end', {
             missionId: this.currentMission.id,
             completionStatus: 'success',
             finalProgress: 100
           }).catch(err => console.warn('STELLA guidance error:', err));
         }
       }
     }
     
     /**
      * Updates mission progress on the server
      * @param {number} progress - The mission progress percentage
      * @returns {Promise<void>}
      */
     async updateMissionProgressOnServer(progress) {
       if (!this.sessionId || !this.currentMission?.id) return;
       
       try {
         const response = await fetch(`/api/training/physical/mission/${this.currentMission.id}/progress`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           credentials: 'include',
           body: JSON.stringify({
             progress,
             sessionId: this.sessionId,
             timestamp: new Date().toISOString()
           })
         });
         
         const data = await response.json();
         if (!data.success) {
           console.warn('Server reported issue updating progress:', data.error);
         }
       } catch (error) {
         console.error('Error updating mission progress:', error);
         // Fallback: Update local progress only
         this.updateLocalProgress(progress);
       }
     }
     
     /**
      * Updates local progress storage as a fallback when server is unavailable
      * @param {number} progress - The mission progress percentage
      */
     updateLocalProgress(progress) {
       if (!this.currentMission?.id) return;
       
       try {
         // Get existing progress data
         const progressData = JSON.parse(localStorage.getItem('missionProgress') || '{}');
         
         // Update with new progress
         progressData[this.currentMission.id] = {
           progress,
           timestamp: new Date().toISOString()
         };
         
         // Save back to localStorage
         localStorage.setItem('missionProgress', JSON.stringify(progressData));
         
         console.log('Mission progress saved locally:', progress);
       } catch (error) {
         console.error('Error saving progress locally:', error);
       }
     }
     
     /**
      * Awards credits for completing an exercise
      * @param {string} exerciseId - The ID of the completed exercise
      * @param {number} qualityScore - The quality score of the exercise performance (0-100)
      * @returns {Promise<void>}
      */
     async awardCredits(exerciseId, qualityScore = 85) {
       if (!this.sessionId || !this.currentMission?.id) return;
       
       const exercise = this.findExerciseById(exerciseId);
       const creditAmount = exercise?.premium ? 50 : 25;
       
       try {
         const response = await fetch(`/api/training/physical/credits/calculate`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           credentials: 'include',
           body: JSON.stringify({
             exerciseId,
             sessionId: this.sessionId,
             missionId: this.currentMission.id,
             performanceData: {
               completion: true,
               timeSpent: this.exerciseTimers[exerciseId] ? 
                         this.parseDuration(exercise?.duration || '150s') : 150,
               quality: qualityScore / 100, // 0-1 scale
               exerciseType: exercise?.type || 'standard'
             }
           })
         });
         
         const data = await response.json();
         
         if (data.success) {
           // Show detailed credit notification
           this.showDetailedCreditNotification(data);
           
           // Update total credits display if it exists
           const totalCreditsEl = document.getElementById('total-credits');
           if (totalCreditsEl && data.newBalance) {
             totalCreditsEl.textContent = data.newBalance;
             
             // Add brief animation to the credits display
             totalCreditsEl.classList.add('text-yellow-400', 'scale-110', 'transition-all');
             setTimeout(() => {
               totalCreditsEl.classList.remove('text-yellow-400', 'scale-110');
             }, 1000);
           }
         } else {
           // Show basic notification if server had an issue
           this.showCreditNotification(creditAmount);
         }
       } catch (error) {
         console.error('Error awarding credits:', error);
         
         // Show notification anyway for better UX
         this.showCreditNotification(creditAmount);
         
         // Store credits locally for later sync
         this.storeCreditsLocally(exerciseId, creditAmount, qualityScore);
       }
     }
     
     /**
      * Stores earned credits locally when server is unavailable
      * @param {string} exerciseId - The ID of the completed exercise
      * @param {number} amount - The amount of credits earned
      * @param {number} qualityScore - The quality score (0-100)
      */
     storeCreditsLocally(exerciseId, amount, qualityScore) {
       try {
         // Get existing pending credits
         const pendingCredits = JSON.parse(localStorage.getItem('pendingCredits') || '[]');
         
         // Add new credit entry
         pendingCredits.push({
           exerciseId,
           missionId: this.currentMission?.id,
           amount,
           qualityScore,
           timestamp: new Date().toISOString()
         });
         
         // Save back to localStorage
         localStorage.setItem('pendingCredits', JSON.stringify(pendingCredits));
         
         console.log('Credits stored locally for later sync:', amount);
       } catch (error) {
         console.error('Error storing credits locally:', error);
       }
     }
     
     /**
      * Shows a simple credit notification
      * @param {number} amount - The amount of credits earned
      */
     showCreditNotification(amount) {
       const notification = document.createElement('div');
       notification.className = 'credit-notification';
       notification.innerHTML = `
         <div class="flex items-center justify-center p-3 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-yellow-500/30">
           <div class="font-bold text-lg text-center text-yellow-400">+${amount} Credits</div>
         </div>
       `;
       
       document.body.appendChild(notification);
       
       // Add animation class
       setTimeout(() => notification.classList.add('credit-earned'), 10);
       
       // Remove after animation
       setTimeout(() => {
         notification.classList.remove('credit-earned');
         setTimeout(() => notification.remove(), 500);
       }, 3000);
     }
     
     /**
      * Shows an enhanced credit notification with breakdown
      * @param {Object} creditData - Credit breakdown data from server
      */
     showDetailedCreditNotification(creditData) {
       const notification = document.createElement('div');
       notification.className = 'credit-notification';
       notification.innerHTML = `
         <div class="flex flex-col space-y-1 p-3 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-blue-500/30">
           <div class="font-bold text-lg text-center text-yellow-400">+${creditData.totalEarned || 25} Credits</div>
           ${creditData.base ? `<div class="text-sm flex justify-between"><span>Base:</span> <span class="text-white">+${creditData.base}</span></div>` : ''}
           ${creditData.bonusChallenge ? `<div class="text-sm flex justify-between"><span>Challenge Bonus:</span> <span class="text-green-400">+${creditData.bonusChallenge}</span></div>` : ''}
           ${creditData.timeBonus ? `<div class="text-sm flex justify-between"><span>Time Bonus:</span> <span class="text-blue-400">+${creditData.timeBonus}</span></div>` : ''}
           ${creditData.qualityBonus ? `<div class="text-sm flex justify-between"><span>Quality Bonus:</span> <span class="text-purple-400">+${creditData.qualityBonus}</span></div>` : ''}
         </div>
       `;
       
       document.body.appendChild(notification);
       
       // Add animation class
       setTimeout(() => notification.classList.add('credit-earned'), 10);
       
       // Remove after animation
       setTimeout(() => {
         notification.classList.remove('credit-earned');
         setTimeout(() => notification.remove(), 500);
       }, 5000);
     }
     
     /**
      * Finds an exercise by ID in the current mission
      * @param {string} exerciseId - The exercise ID to find
      * @returns {Object|null} - The exercise object or null if not found
      */
     findExerciseById(exerciseId) {
       if (!this.currentMission) return null;
       
       // Check regular exercises
       if (this.currentMission.exercises) {
         const exercise = this.currentMission.exercises.find(ex => ex.id === exerciseId);
         if (exercise) return exercise;
       }
       
       // Check premium exercises
       if (this.currentMission.premiumExercises) {
         const premiumExercise = this.currentMission.premiumExercises.find(ex => ex.id === exerciseId);
         if (premiumExercise) return { ...premiumExercise, premium: true };
       }
       
       return null;
     }
     
     /**
      * Parses duration string into seconds
      * @param {string} durationStr - Duration string (e.g., "2m", "30s", "1h30m")
      * @returns {number} - Duration in seconds
      */
     parseDuration(durationStr) {
       if (!durationStr) return 150; // Default to 150 seconds
       
       let seconds = 0;
       
       // Handle hour format
       if (durationStr.includes('h')) {
         const hourParts = durationStr.split('h');
         seconds += parseInt(hourParts[0], 10) * 3600;
         durationStr = hourParts[1] || '';
       }
       
       // Handle minute format
       if (durationStr.includes('m')) {
         const minuteParts = durationStr.split('m');
         seconds += parseInt(minuteParts[0], 10) * 60;
         durationStr = minuteParts[1] || '';
       }
       
       // Handle second format
       if (durationStr.includes('s')) {
         seconds += parseInt(durationStr.replace('s', ''), 10);
       } else if (durationStr && !isNaN(parseInt(durationStr, 10))) {
         // Plain number is assumed to be seconds
         seconds += parseInt(durationStr, 10);
       }
       
       return Math.max(1, seconds); // Ensure at least 1 second
     }
     
     /**
      * Sends metrics to the backend
      * @param {string} exerciseId - The ID of the exercise
      * @param {Object} metrics - The metrics to send
      * @returns {Promise<void>}
      */
     async sendMetrics(exerciseId, metrics) {
       if (!this.sessionId || !metrics) return;
       
       try {
         const response = await fetch('/api/training/physical/metrics', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           credentials: 'include',
           body: JSON.stringify({
             sessionId: this.sessionId,
             missionId: this.currentMission?.id,
             exerciseId,
             metrics,
             timestamp: new Date().toISOString()
           })
         });
         
         if (!response.ok) {
           throw new Error(`HTTP error: ${response.status}`);
         }
       } catch (error) {
         console.warn('Failed to send metrics to server:', error);
         // Store metrics locally for later sync
         this.storeMetricsLocally(exerciseId, metrics);
       }
     }
     
     /**
      * Stores metrics locally when server is unavailable
      * @param {string} exerciseId - The ID of the exercise
      * @param {Object} metrics - The metrics to store
      */
     storeMetricsLocally(exerciseId, metrics) {
       try {
         // Get existing metrics
         const localMetrics = JSON.parse(localStorage.getItem('pendingMetrics') || '[]');
         
         // Add new metrics
         localMetrics.push({
           sessionId: this.sessionId,
           missionId: this.currentMission?.id,
           exerciseId,
           metrics,
           timestamp: new Date().toISOString()
         });
         
         // Limit size to prevent localStorage overflow
         if (localMetrics.length > 100) {
           localMetrics.splice(0, localMetrics.length - 100);
         }
         
         // Save back to localStorage
         localStorage.setItem('pendingMetrics', JSON.stringify(localMetrics));
       } catch (error) {
         console.error('Error storing metrics locally:', error);
       }
     }