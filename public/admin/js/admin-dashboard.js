document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    setupNavigation();
    
    // Check authentication
    checkAdminAuth();
  });
  
  async function checkAdminAuth() {
    try {
      const response = await fetch('/api/admin/auth/check');
      const data = await response.json();
      
      if (!data.authenticated || !data.isAdmin) {
        // Redirect to login if not authenticated
        window.location.href = '/admin/login.html';
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Redirect on error
      window.location.href = '/admin/login.html';
    }
  }
  
  function setupNavigation() {
    // Handle navigation clicks
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state
        document.querySelectorAll('[data-section]').forEach(l => {
          l.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show selected section
        const sectionId = this.dataset.section;
        showSection(sectionId);
      });
    });
    
    // Handle logout
    document.getElementById('admin-logout').addEventListener('click', function() {
      fetch('/api/admin/auth/logout', { method: 'POST' })
        .then(() => {
          window.location.href = '/admin/login.html';
        })
        .catch(error => {
          console.error('Logout error:', error);
          window.location.href = '/admin/login.html';
        });
    });
  }
  
  function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    
    // Load section data if needed
    switch(sectionId) {
      case 'dashboard':
        loadDashboardData();
        break;
      case 'applications':
        loadApplicationsData();
        break;
      case 'stella':
        loadStellaOverview();
        break;
      case 'common-questions':
        loadCommonQuestions();
        break;
      case 'feedback-analysis':
        loadFeedbackData();
        break;
      case 'response-improvements':
        loadImprovementData();
        break;
      case 'users':
        // Future implementation
        break;
      case 'briefings':
        // Future implementation
        break;
    }
  }
  // Near the top of the file, add or modify the checkAdminAuth function:
async function checkAdminAuth() {
  // For development mode, check for dev token
  const devToken = localStorage.getItem('devToken');
  if (devToken === 'dev_access_token') {
    console.log('Development mode active');
    return; // Allow access in dev mode
  }

  // Normal authentication check
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    window.location.href = '/admin/login.html';
    return;
  }

  try {
    const response = await fetch('/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!data.authenticated || !data.isAdmin) {
      window.location.href = '/admin/login.html';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    window.location.href = '/admin/login.html';
  }
}
  async function initializeDashboard() {
    try {
      // Load dashboard data first
      await loadDashboardData();
      
      // Hide loading indicator and show dashboard section
      document.getElementById('loading-indicator').classList.add('hidden');
      document.getElementById('dashboard-section').classList.remove('hidden');
      
      // Setup application detail panel
      setupApplicationDetail();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      alert('Failed to load dashboard data. Please try refreshing the page.');
    }
  }
  
  // Dashboard overview functions
  async function loadDashboardData() {
    try {
      // Load key metrics for dashboard
      const [stellaResponse, applicationsResponse] = await Promise.all([
        fetch('/api/admin/stella-analytics/overview'),
        fetch('/api/admin/applications?limit=1')
      ]);
      
      const stellaData = await stellaResponse.json();
      const applicationsData = await applicationsResponse.json();
      
      if (stellaData.success) {
        // Update dashboard metrics
        document.getElementById('metric-total-users').textContent = 
          stellaData.metrics.uniqueUsers.toLocaleString();
        document.getElementById('metric-ai-interactions').textContent = 
          stellaData.metrics.totalQuestions.toLocaleString();
        document.getElementById('metric-satisfaction').textContent = 
          stellaData.metrics.responseMetrics?.feedbackStats?.positivePercentage + '%' || "N/A";
      }
      
      if (applicationsData.success) {
        document.getElementById('metric-pending-applications').textContent = 
          applicationsData.stats.pending.toLocaleString();
      }
      
      // Load recent activity
      await loadRecentActivity();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }
  
  async function loadRecentActivity() {
    // This would fetch recent activity from your API
    // For now, we'll use placeholder data
    const recentActivityContainer = document.getElementById('recent-activity');
    
    if (!recentActivityContainer) return;
    
    // Clear container
    recentActivityContainer.innerHTML = '';
    
    // Add placeholder activities
    const activities = [
      {
        type: 'application',
        text: 'New application received from John Doe',
        timestamp: new Date(Date.now() - 30 * 60000) // 30 minutes ago
      },
      {
        type: 'stella',
        text: 'STELLA AI received 15 new questions in the last hour',
        timestamp: new Date(Date.now() - 60 * 60000) // 1 hour ago
      },
      {
        type: 'user',
        text: 'New user registered: jane.smith@example.com',
        timestamp: new Date(Date.now() - 120 * 60000) // 2 hours ago
      },
      {
        type: 'feedback',
        text: 'Positive feedback received for STELLA response #12345',
        timestamp: new Date(Date.now() - 180 * 60000) // 3 hours ago
      }
    ];
    
    // Add each activity to the container
    activities.forEach(activity => {
      const activityEl = document.createElement('div');
      activityEl.className = 'flex items-start p-3 rounded-lg bg-gray-800/50';
      
      // Icon based on activity type
      let icon;
      switch(activity.type) {
        case 'application':
          icon = '<svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
          break;
        case 'stella':
          icon = '<svg class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>';
          break;
        case 'user':
          icon = '<svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
          break;
        case 'feedback':
          icon = '<svg class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
          break;
      }
      
      // Format time
      const formattedTime = activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      activityEl.innerHTML = `
        <div class="mr-3 mt-1">${icon}</div>
        <div class="flex-1">
          <p>${activity.text}</p>
          <p class="text-xs text-gray-400 mt-1">${formattedTime}</p>
        </div>
      `;
      
      recentActivityContainer.appendChild(activityEl);
    });
  }
  
  // Applications section functions
  let currentPage = 1;
  let totalPages = 1;
  let currentApplicationId = null;
  
  async function loadApplicationsData() {
    const status = document.getElementById('status-filter')?.value || '';
    const search = document.getElementById('search-input')?.value || '';
    
    // Build query string
    let queryParams = `page=${currentPage}`;
    if (status) queryParams += `&status=${status}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    
    try {
      // Fetch applications
      const response = await fetch(`/api/admin/applications?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        displayApplications(data.applications);
        updatePagination(data.pagination);
        updateApplicationStats(data.stats);
      } else {
        console.error('Error loading applications:', data.error);
        alert('Error loading applications. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading applications. Please try again.');
    }
  }
  
  function displayApplications(applications) {
    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList) return;
    
    // Clear existing applications
    applicationsList.innerHTML = '';
    
    if (applications.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="7" class="text-center py-4">No applications found</td>
      `;
      applicationsList.appendChild(emptyRow);
      return;
    }
    
    // Add each application to the table
    applications.forEach(app => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(app.createdAt);
      const formattedDate = date.toLocaleDateString();
      
      // Create status badge
      const statusClass = `status-${app.status}`;
      
      row.innerHTML = `
        <td>${app.name}</td>
        <td>${app.email}</td>
        <td>${app.background}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${app.status}</span></td>
        <td>${app.aiReview?.score?.toFixed(2) || 'N/A'}</td>
        <td>
          <button class="view-detail action-btn" data-id="${app._id}">View</button>
        </td>
      `;
      
      applicationsList.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-detail').forEach(button => {
      button.addEventListener('click', () => {
        const applicationId = button.getAttribute('data-id');
        viewApplicationDetail(applicationId);
      });
    });
  }
  
  function updatePagination(pagination) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;
    
    // Update pagination state
    currentPage = pagination.page;
    totalPages = pagination.totalPages;
    
    // Clear existing pagination
    paginationElement.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.classList.add('page-btn');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadApplicationsData();
      }
    });
    paginationElement.appendChild(prevButton);
    
    // Page buttons
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.classList.add('page-btn');
      if (i === currentPage) pageButton.classList.add('active');
      pageButton.textContent = i;
      pageButton.addEventListener('click', () => {
        currentPage = i;
        loadApplicationsData();
      });
      paginationElement.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.classList.add('page-btn');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadApplicationsData();
      }
    });
    paginationElement.appendChild(nextButton);
  }
  
  function updateApplicationStats(stats) {
    if (!stats) return;
    
    const elements = {
      'total-applications': stats.total,
      'pending-applications': stats.pending,
      'approved-applications': stats.approved,
      'rejected-applications': stats.rejected,
      'waitlisted-applications': stats.waitlisted,
      'last-week-applications': stats.lastWeek
    };
    
    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }
  }
  
  function setupApplicationDetail() {
    const closeDetail = document.getElementById('close-detail');
    const approveBtn = document.getElementById('approve-btn');
    const waitlistBtn = document.getElementById('waitlist-btn');
    const rejectBtn = document.getElementById('reject-btn');
    
    if (closeDetail) {
      closeDetail.addEventListener('click', () => {
        const applicationDetail = document.getElementById('application-detail');
        applicationDetail.classList.remove('visible');
        currentApplicationId = null;
      });
    }
    
    if (approveBtn) approveBtn.addEventListener('click', () => updateApplicationStatus('approved'));
    if (waitlistBtn) waitlistBtn.addEventListener('click', () => updateApplicationStatus('waitlisted'));
    if (rejectBtn) rejectBtn.addEventListener('click', () => updateApplicationStatus('rejected'));
    
    // Set up event listeners for application filters
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        currentPage = 1;
        loadApplicationsData();
      });
    }
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        currentPage = 1;
        loadApplicationsData();
      });
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (statusFilter) statusFilter.value = '';
        if (searchInput) searchInput.value = '';
        currentPage = 1;
        loadApplicationsData();
      });
    }
  }
  
  async function viewApplicationDetail(applicationId) {
    // Save current application ID
    currentApplicationId = applicationId;
    
    // Fetch application details
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      const data = await response.json();
      
      if (data.success) {
        displayApplicationDetail(data.application);
      } else {
        console.error('Error loading application detail:', data.error);
        alert('Error loading application detail. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading application detail. Please try again.');
    }
  }
  
  function displayApplicationDetail(application) {
    // Populate detail fields
    document.getElementById('detail-name').textContent = application.name;
    document.getElementById('detail-email').textContent = application.email;
    
    const date = new Date(application.createdAt);
    document.getElementById('detail-date').textContent = date.toLocaleString();
    
    document.getElementById('detail-background').textContent = application.background;
    document.getElementById('detail-motivation').textContent = application.motivation;
    
    document.getElementById('detail-score').textContent = 
      application.aiReview?.score ? application.aiReview.score.toFixed(2) : 'N/A';
    document.getElementById('detail-ai-notes').textContent = 
      application.aiReview?.notes || 'No AI notes available';
    document.getElementById('detail-pathway').textContent = 
      application.aiReview?.recommendedPathway || 'Not specified';
    
    // Set admin notes
    const adminNotes = document.getElementById('admin-notes');
    if (adminNotes) adminNotes.value = application.adminNotes || '';
    
    // Update button states based on current status
    const currentStatus = application.status;
    const approveBtn = document.getElementById('approve-btn');
    const waitlistBtn = document.getElementById('waitlist-btn');
    const rejectBtn = document.getElementById('reject-btn');
    
    if (approveBtn) approveBtn.disabled = currentStatus === 'approved';
    if (waitlistBtn) waitlistBtn.disabled = currentStatus === 'waitlisted';
    if (rejectBtn) rejectBtn.disabled = currentStatus === 'rejected';
    
    // Show the detail panel
    const applicationDetail = document.getElementById('application-detail');
    applicationDetail.classList.add('visible');
  }
  
  async function updateApplicationStatus(newStatus) {
    if (!currentApplicationId) return;
    
    // Get admin notes
    const notes = document.getElementById('admin-notes')?.value || '';
    
    // Update the application status
    try {
      const response = await fetch(`/api/admin/applications/${currentApplicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        alert(`Application ${newStatus} successfully${newStatus === 'approved' ? ' and acceptance email sent' : ''}.`);
        
        // Close detail panel
        const applicationDetail = document.getElementById('application-detail');
        applicationDetail.classList.remove('visible');
        
        // Reload applications
        loadApplicationsData();
      } else {
        console.error('Error updating application status:', data.error);
        alert('Error updating application status. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating application status. Please try again.');
    }
  }
  
  // STELLA Analytics functions - Include your existing STELLA analytics code here
  async function loadStellaOverview() {
    try {
      const response = await fetch('/api/admin/stella-analytics/overview');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load overview data');
      }
      
      const metrics = data.metrics;
      
      // Update metrics
      document.getElementById('metric-total-questions').textContent = metrics.totalQuestions.toLocaleString();
      document.getElementById('metric-total-responses').textContent = metrics.totalResponses.toLocaleString();
      document.getElementById('metric-unique-users').textContent = metrics.uniqueUsers.toLocaleString();
      document.getElementById('metric-satisfaction').textContent = 
        metrics.responseMetrics.feedbackStats.positivePercentage + '%';
      
      // Create charts
      createDailyTrendsChart(metrics.dailyStats);
      createQuestionTypesChart(metrics.questionTypes);
      
      // Update topics
      updatePopularTopics(metrics.commonTopics);
      
    } catch (error) {
      console.error('Error loading STELLA overview data:', error);
      throw error;
    }
  }
  
  // Include other STELLA functions from your existing stella-dashboard.js file
  // Including createDailyTrendsChart(), createQuestionTypesChart(), etc.
  
  // Include these functions from your existing stella-dashboard.js
  function loadCommonQuestions() {
    // Implementation from your existing code
  }
  
  function loadFeedbackData() {
    // Implementation from your existing code
  }
  
  function loadImprovementData() {
    // Implementation from your existing code
  }
  
  // Add the remaining STELLA Analytics functions here...
  // Additional STELLA Analytics functions

function createDailyTrendsChart(dailyStats) {
    const ctx = document.getElementById('daily-trends-chart')?.getContext('2d');
    if (!ctx) return;
    
    // Convert data to chart format
    const dates = Object.keys(dailyStats).sort();
    const questions = dates.map(date => dailyStats[date].questions || 0);
    const responses = dates.map(date => dailyStats[date].responses || 0);
    
    // Format dates for display
    const formattedDates = dates.map(date => {
      const [year, month, day] = date.split('-');
      return `${month}/${day}`;
    });
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Questions',
            data: questions,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            borderWidth: 2,
            fill: true
          },
          {
            label: 'Responses',
            data: responses,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            borderWidth: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(75, 85, 99, 0.2)'
            },
            ticks: {
              color: '#94a3b8'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(75, 85, 99, 0.2)'
            },
            ticks: {
              color: '#94a3b8'
            }
          }
        }
      }
    });
  }
  
  function createQuestionTypesChart(questionTypes) {
    const ctx = document.getElementById('question-types-chart')?.getContext('2d');
    if (!ctx) return;
    
    const labels = questionTypes.map(qt => formatQuestionType(qt.type));
    const data = questionTypes.map(qt => qt.count);
    
    // Colors for different question types
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(249, 115, 22, 0.8)',   // orange
      'rgba(139, 92, 246, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)'    // pink
    ];
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: 'rgba(30, 41, 59, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        }
      }
    });
  }
  
  function formatQuestionType(type) {
    if (!type) return 'Other';
    
    // Convert from camelCase or snake_case to readable format
    return type
      .replace(/([A-Z])/g, ' $1') // Convert camelCase
      .replace(/_/g, ' ')         // Convert snake_case
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  function updatePopularTopics(topics) {
    const topicsContainer = document.getElementById('popular-topics');
    
    if (!topicsContainer) return;
    
    // Clear container
    topicsContainer.innerHTML = '';
    
    // Determine max count for scaling
    const maxCount = Math.max(...topics.map(t => t.count));
    
    // Add each topic
    topics.forEach(topic => {
      // Scale the size based on count
      const size = Math.max(1, Math.min(5, Math.round((topic.count / maxCount) * 5)));
      let bgColor, textColor;
      
      switch(size) {
        case 5:
          bgColor = 'bg-blue-700';
          textColor = 'text-white';
          break;
        case 4:
          bgColor = 'bg-blue-600';
          textColor = 'text-white';
          break;
        case 3:
          bgColor = 'bg-blue-500';
          textColor = 'text-white';
          break;
        case 2:
          bgColor = 'bg-blue-400';
          textColor = 'text-gray-900';
          break;
        default:
          bgColor = 'bg-blue-300';
          textColor = 'text-gray-900';
      }
      
      const topicEl = document.createElement('div');
      topicEl.className = `${bgColor} ${textColor} rounded-full px-3 py-1 text-sm font-medium`;
      topicEl.textContent = topic.topic;
      
      // Add tooltip with count
      topicEl.title = `${topic.count} questions`;
      
      topicsContainer.appendChild(topicEl);
    });
  }
  
  async function loadCommonQuestions() {
    try {
      const response = await fetch('/api/admin/stella-analytics/common-questions');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load common questions');
      }
      
      const tableBody = document.getElementById('common-questions-table');
      
      if (!tableBody) return;
      
      // Clear table
      tableBody.innerHTML = '';
      
      // Add each question
      data.questions.forEach(question => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-800 hover:bg-gray-800/50 transition-colors';
        
        // Format date
        const lastAsked = new Date(question.lastAsked);
        const formattedDate = `${lastAsked.toLocaleDateString()} ${lastAsked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        row.innerHTML = `
          <td class="py-3 px-4">${question.content}</td>
          <td class="py-3 px-4">${question.frequency}</td>
          <td class="py-3 px-4">${formatQuestionType(question.questionType)}</td>
          <td class="py-3 px-4">${formattedDate}</td>
          <td class="py-3 px-4">
            <button class="text-blue-400 hover:text-blue-300 view-responses-btn" data-question-id="${question.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Add event listeners to view response buttons
      document.querySelectorAll('.view-responses-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const questionId = this.dataset.questionId;
          // This would open a modal or navigate to a detail page
          alert(`View responses for question ID: ${questionId}`);
        });
      });
    } catch (error) {
      console.error('Error loading common questions:', error);
    }
  }
  
  async function loadFeedbackData() {
    try {
      const response = await fetch('/api/admin/stella-analytics/feedback');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load feedback data');
      }
      
      // Update metrics
      const feedbackCount = data.feedback.length;
      const positiveFeedback = data.feedback.filter(f => f.helpful).length;
      const negativeFeedback = data.feedback.filter(f => f.helpful === false).length;
      
      document.getElementById('metric-feedback-count').textContent = feedbackCount;
      document.getElementById('metric-positive-feedback').textContent = positiveFeedback;
      document.getElementById('metric-negative-feedback').textContent = negativeFeedback;
      
      // Update feedback entries
      const feedbackContainer = document.getElementById('feedback-entries');
      
      if (!feedbackContainer) return;
      
      // Clear container
      feedbackContainer.innerHTML = '';
      
      // Add each feedback entry
      data.feedback.forEach(entry => {
        const entryEl = document.createElement('div');
        entryEl.className = 'feedback-entry p-4 rounded-lg border border-gray-700 bg-gray-800/50';
        
        // Determine feedback style
        const feedbackClass = entry.helpful ? 'text-green-400' : 'text-red-400';
        const feedbackIcon = entry.helpful ? 
          `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>` : 
          `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>`;
        
        // Format date
        const receivedAt = new Date(entry.receivedAt);
        const formattedDate = `${receivedAt.toLocaleDateString()} ${receivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        entryEl.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center ${feedbackClass}">
              ${feedbackIcon}
              <span class="ml-2 font-medium">${entry.helpful ? 'Helpful' : 'Not Helpful'}</span>
            </div>
            <div class="text-sm text-gray-400">${formattedDate}</div>
          </div>
          
          <div class="mb-3">
            <div class="text-sm text-gray-400 mb-1">Question:</div>
            <div class="bg-gray-900/50 px-3 py-2 rounded">${entry.question}</div>
          </div>
          
          <div class="mb-3">
            <div class="text-sm text-gray-400 mb-1">STELLA's Response:</div>
            <div class="bg-gray-900/50 px-3 py-2 rounded">${entry.response}</div>
          </div>
          
          ${entry.feedback ? `
          <div>
            <div class="text-sm text-gray-400 mb-1">User Feedback:</div>
            <div class="bg-gray-900/50 px-3 py-2 rounded italic">${entry.feedback}</div>
          </div>
          ` : ''}
        `;
        
        feedbackContainer.appendChild(entryEl);
      });
      
    } catch (error) {
      console.error('Error loading feedback data:', error);
    }
  }
  
  async function loadImprovementData() {
    try {
      // Load common questions for the selector
      const response = await fetch('/api/admin/stella-analytics/common-questions?limit=50');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load questions for improvement');
      }
      
      const questionSelector = document.getElementById('question-selector');
      
      if (!questionSelector) return;
      
      // Clear selector
      questionSelector.innerHTML = '<option value="">Select a question...</option>';
      
      // Add each question as an option
      data.questions.forEach(question => {
        const option = document.createElement('option');
        option.value = question.id;
        
        // Truncate long questions for the dropdown
        const displayContent = question.content.length > 80 ? 
          question.content.substring(0, 80) + '...' : 
          question.content;
        
        option.textContent = displayContent;
        questionSelector.appendChild(option);
      });
      
      // Set up event listener for question selection
      questionSelector.addEventListener('change', async function() {
        const questionId = this.value;
        const currentResponseEl = document.getElementById('current-response');
        const improvedResponseInput = document.getElementById('improved-response');
        
        // Reset form
        currentResponseEl.textContent = 'Select a question to see its current response';
        improvedResponseInput.value = '';
        
        if (!questionId) return;
        
        try {
          // Get current response for this question
          const responseData = await fetch(`/api/admin/stella-analytics/question-response/${questionId}`).then(res => res.json());
          
          if (responseData.success && responseData.response) {
            currentResponseEl.textContent = responseData.response.content;
          } else {
            currentResponseEl.textContent = 'No existing response found for this question';
          }
        } catch (error) {
          console.error('Error fetching response:', error);
          currentResponseEl.textContent = 'Error fetching response';
        }
      });
      
      // Set up event listener for submitting improvements
      const submitButton = document.getElementById('submit-improvement');
      
      if (submitButton) {
        submitButton.addEventListener('click', async function() {
          const questionId = questionSelector.value;
          const improvedResponse = document.getElementById('improved-response').value.trim();
          
          if (!questionId) {
            alert('Please select a question');
            return;
          }
          
          if (!improvedResponse) {
            alert('Please enter an improved response');
            return;
          }
          
          try {
            const response = await fetch('/api/admin/stella-analytics/improve-response', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                questionId,
                improvedResponse
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('Response improvement saved successfully!');
              // Reset form
              questionSelector.value = '';
              document.getElementById('current-response').textContent = 'Select a question to see its current response';
              document.getElementById('improved-response').value = '';
            } else {
              throw new Error(data.error || 'Failed to save improvement');
            }
          } catch (error) {
            console.error('Error saving improvement:', error);
            alert(`Error saving improvement: ${error.message}`);
          }
        });
      }
    } catch (error) {
      console.error('Error loading improvement data:', error);
    }
  }