/**
 * EnhancedEnduranceTracker Class
 * Handles endurance training exercises and metrics
 */
class EnhancedEnduranceTracker {
    constructor() {
      this.activeZone = null;
      this.metrics = {
        heartRate: 70,
        hrv: 65,
        timeInZone: {},
        o2Saturation: 98
      };
      
      this.setupEventListeners();
      this.startHeartRateSimulation();
      this.setupStellaModal();
    }
    
    setupEventListeners() {
      // Add event listeners for training zones
      document.querySelectorAll('.zone-card').forEach(card => {
        card.addEventListener('click', () => {
          const zoneId = card.dataset.zoneId;
          
          // Remove active class from all zones
          document.querySelectorAll('.zone-card').forEach(c => {
            c.classList.remove('border-blue-500', 'border-2');
          });
          
          // Add active class to selected zone
          card.classList.add('border-blue-500', 'border-2');
          
          this.activeZone = zoneId;
          
          // Update STELLA guidance
          const guidanceElement = document.getElementById('stella-guidance');
  
          if (guidanceElement) {
            switch(zoneId) {
              case 'recovery':
                guidanceElement.innerHTML = `
                  <div class="bg-green-500/10 rounded-lg p-3">
                    <p class="text-sm text-green-300">Recovery Zone: Focus on controlled breathing and maintaining a steady pace. This zone builds your aerobic base and improves fat metabolism.</p>
                  </div>
                `;
                break;
              case 'endurance':
                guidanceElement.innerHTML = `
                  <div class="bg-green-500/10 rounded-lg p-3">
                    <p class="text-sm text-green-300">Endurance Zone: You're building cardiovascular efficiency. This is the ideal zone for long-duration space missions. Maintain this intensity.</p>
                  </div>
                `;
                break;
              case 'threshold':
                guidanceElement.innerHTML = `
                  <div class="bg-green-500/10 rounded-lg p-3">
                    <p class="text-sm text-yellow-300">Threshold Zone: You're at your lactate threshold. This zone significantly improves your VO2 max and endurance. Monitor your breathing and maintain control.</p>
                  </div>
                `;
                break;
            }
          }
  
          // Update zone metrics
          this.updateZoneMetrics(zoneId);
  
          // Update HRV graph
          this.updateHRVGraph(zoneId);
  
          // Update O2 utilization graph
          this.updateO2Graph(zoneId);
        });
      });
    }
  
    startHeartRateSimulation() {
      // Simulate heart rate changes
      this.heartRateInterval = setInterval(() => {
        if (this.activeZone) {
          // Simulate heart rate fluctuations in the active zone
          const zoneCard = document.querySelector(`.zone-card[data-zone-id="${this.activeZone}"]`);
          const targetHR = parseInt(zoneCard.dataset.targetHr);
          const hrVariation = Math.floor(Math.random() * 10) - 5;
          
          this.metrics.heartRate = targetHR + hrVariation;
          
          // Update zone metrics
          this.updateZoneMetrics(this.activeZone);
        }
      }, 3000);
    }
  
    updateZoneMetrics(zoneId) {
      // Simulate time in zone
      if (!this.metrics.timeInZone[zoneId]) {
        this.metrics.timeInZone[zoneId] = 0;
      }
  
      this.metrics.timeInZone[zoneId] += 1;
  
      // Update UI for the zone
      const zoneCard = document.querySelector(`.zone-card[data-zone-id="${zoneId}"]`);
      if (zoneCard) {
        const timeElement = zoneCard.querySelector('.zone-time');
        if (timeElement) {
          const mins = Math.floor(this.metrics.timeInZone[zoneId] / 60);
          const secs = this.metrics.timeInZone[zoneId] % 60;
          timeElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        // Update efficiency score
        const efficiencyElement = zoneCard.querySelector('.efficiency-score');
        if (efficiencyElement) {
          const hrDiff = Math.abs(this.metrics.heartRate - parseInt(zoneCard.dataset.targetHr));
          const efficiency = hrDiff <= 5 ? 'Optimal' : (hrDiff <= 10 ? 'Good' : 'Adjust');
          efficiencyElement.textContent = efficiency;
          
          // Apply color based on efficiency
          if (efficiency === 'Optimal') {
            efficiencyElement.classList.add('text-green-400');
            efficiencyElement.classList.remove('text-yellow-400', 'text-red-400');
          } else if (efficiency === 'Good') {
            efficiencyElement.classList.add('text-yellow-400');
            efficiencyElement.classList.remove('text-green-400', 'text-red-400');
          } else {
            efficiencyElement.classList.add('text-red-400');
            efficiencyElement.classList.remove('text-green-400', 'text-yellow-400');
          }
        }
        
        // Update recovery rate
        const recoveryElement = zoneCard.querySelector('.recovery-rate');
        if (recoveryElement) {
          const recoveryRate = Math.floor(Math.random() * 30) + 70;
          recoveryElement.textContent = `${recoveryRate}%`;
        }
      }
    }
  
    updateHRVGraph(zoneId) {
      // Simulate HRV graph update
      const hrvGraph = document.querySelector('.hrv-graph');
      if (hrvGraph) {
        hrvGraph.innerHTML = `
          <div class="relative z-10 p-4 h-full">
            <div class="flex justify-between items-center mb-2">
              <div class="text-sm text-gray-400">Heart Rate Variability</div>
              <div class="text-sm text-green-400">${this.metrics.hrv}ms</div>
            </div>
            
            <div class="flex justify-center items-center h-24">
              <div class="graph-line w-full h-1 bg-gray-600 relative">
                <!-- HRV Visualization -->
                ${this.generateHRVGraphLines()}
              </div>
            </div>
            
            <div class="flex justify-between items-center mt-2">
              <div class="text-xs text-gray-500">Time</div>
              <div class="text-xs text-gray-500">Now</div>
            </div>
          </div>
        `;
      }
    }
  
    generateHRVGraphLines() {
      // Generate random HRV graph lines for simulation
      let lines = '';
      const numPoints = 20;
  
      for (let i = 0; i < numPoints; i++) {
        const height = Math.floor(Math.random() * 30) + 5;
        lines += `<div class="absolute bottom-0 bg-green-400 w-1" style="height: ${height}px; left: ${i * (100 / numPoints)}%"></div>`;
      }
  
      return lines;
    }
  
    updateO2Graph(zoneId) {
      // Simulate O2 utilization graph update
      const o2Graph = document.querySelector('.o2-graph');
      if (o2Graph) {
        // Generate O2 utilization values based on zone
        let efficiency = 0;
        switch(zoneId) {
          case 'recovery':
            efficiency = Math.floor(Math.random() * 10) + 65;
            break;
          case 'endurance':
            efficiency = Math.floor(Math.random() * 10) + 75;
            break;
          case 'threshold':
            efficiency = Math.floor(Math.random() * 10) + 85;
            break;
        }
        
        o2Graph.innerHTML = `
          <div class="relative z-10 p-4 h-full">
            <div class="flex justify-between items-center mb-2">
              <div class="text-sm text-gray-400">Oxygen Utilization</div>
              <div class="text-sm text-blue-400">${efficiency}%</div>
            </div>
            
            <div class="flex justify-center items-center h-24">
              <div class="w-full bg-gray-700 rounded-full h-4">
                <div class="h-full bg-blue-500 rounded-full" style="width: ${efficiency}%"></div>
              </div>
            </div>
            
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>Baseline</span>
              <span>Optimal</span>
            </div>
          </div>
        `;
      }
    }
            
    showCreditNotification(amount) {
      const notification = document.getElementById('credit-notification');
      if (notification) {
        // Update amount
        const amountText = notification.querySelector('span');
        if (amountText) {
          amountText.textContent = `+${amount} Credits Earned!`;
        }
        
        // Show notification
        notification.classList.remove('hidden');
        
        // Hide after delay
        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);
      }
    }
            
    updateMissionProgress() {
      // Calculate progress based on time spent in zones
      let totalTime = 0;
      Object.values(this.metrics.timeInZone).forEach(time => {
        totalTime += time;
      });
      
      // Calculate progress percentage (max 30% for this simulation)
      const progressPercent = Math.min(30, Math.floor(totalTime / 10));
      
      // Update mission progress UI
      const progressBar = document.querySelector('.mission-progress .bg-green-500');
      const progressText = document.querySelector('.mission-progress + .flex .text-green-400');
      
      if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${progressPercent}%`;
      }
    }
            
    setupStellaModal() {
      // Set up STELLA AI help modal
      const aiHelpButton = document.getElementById('ai-help-button');
      const closeModalButton = document.getElementById('close-stella-modal');
      const stellaModal = document.getElementById('stella-help-modal');
      const sendButton = document.getElementById('send-to-stella');
      const questionInput = document.getElementById('stella-question');
      const conversation = document.querySelector('.stella-conversation');
      
      if (aiHelpButton && stellaModal) {
        aiHelpButton.addEventListener('click', () => {
          stellaModal.classList.remove('hidden');
        });
      }
      
      if (closeModalButton && stellaModal) {
        closeModalButton.addEventListener('click', () => {
          stellaModal.classList.add('hidden');
        });
      }
      
      if (sendButton && questionInput && conversation) {
        sendButton.addEventListener('click', () => {
          const question = questionInput.value.trim();
          if (question) {
            // Add user question to conversation
            conversation.innerHTML += `
              <div class="mb-2">
                <div class="font-semibold">You:</div>
                <div class="pl-2">${question}</div>
              </div>
            `;
            
            // Clear input
            questionInput.value = '';
            
            // Simulate STELLA response
            setTimeout(() => {
              // Add STELLA response
              const responses = [
                "To improve cardiovascular endurance, focus on Zone 2 training for 80% of your workouts. This builds aerobic efficiency for long-term space missions.",
                "Your heart rate variability indicates good recovery capacity, but I recommend increasing hydration to optimize oxygen delivery during training.",
                "Space environments cause cardiovascular deconditioning. The most effective countermeasure is consistent interval training combining Zones 2 and 3.",
                "I've analyzed your training data and recommend focusing on recovery intervals. This will improve mitochondrial density for better oxygen utilization."
              ];
              
              const randomResponse = responses[Math.floor(Math.random() * responses.length)];
              
              conversation.innerHTML += `
                <div class="mb-2">
                  <div class="font-semibold text-green-400">STELLA:</div>
                  <div class="pl-2 text-green-300">${randomResponse}</div>
                </div>
              `;
              
              // Scroll to bottom
              conversation.scrollTop = conversation.scrollHeight;
            }, 1000);
          }
        });
        
        // Allow Enter key to send
        questionInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            sendButton.click();
          }
        });
      }
    }
  }
  
  // Initialize enhanced endurance tracker when document is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const enduranceTracker = new EnhancedEnduranceTracker();
  });