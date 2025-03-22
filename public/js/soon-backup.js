/**
 * soon.js - JavaScript functionality for the SharedStars Coming Soon page
 * This file should be placed in /public/js/soon.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize countdown
    const countdown = new SpaceCountdown();
    
    // User context tracking
    let currentUserId = localStorage.getItem('sharedStarsUserId') || null;
    
    // Elements
    const signupEmail = document.getElementById('signup-email');
    const earlyAccessBtn = document.getElementById('early-access-btn');
    const headerWaitlistBtn = document.getElementById('header-waitlist-btn');
    const signupSuccess = document.getElementById('signup-success');
    const stellaButton = document.getElementById('stellaButton');
    const stellaInterface = document.getElementById('stella-interface');
    const closeButton = document.getElementById('close-stella');
    const minimizeButton = document.getElementById('minimize-stella');
    const messagesContainer = document.getElementById('stella-messages');
    const inputField = document.getElementById('stella-input');
    const sendButton = document.getElementById('send-to-stella');
    const typingIndicator = document.getElementById('stella-typing');
    const stellaAvatar = document.getElementById('stella-avatar');
    const sophonParticles = document.getElementById('sophon-particles');
    
    // Initialize module progress animation
    setTimeout(() => {
        document.querySelectorAll('.progress-bar').forEach((bar, index) => {
            const values = [0, 0, 0]; // Initial progress values
            bar.style.width = values[index] + '%';
        });
    }, 500);
    
    // Initialize STELLA
    if (window.StellaCore) {
        window.stellaCore = new StellaCore({
            statusSelector: '#stella-status',
            messageSelector: '#stella-status-message',
            conversationSelector: '#stella-messages',
            inputSelector: '#stella-input',
            sendButtonSelector: '#send-to-stella',
            debugMode: false
        });
    }
    
    // Initialize Sophon particles - inspired by the protons unfolding into different dimensions
    function initializeSophonParticles() {
        if (!sophonParticles) return;
        
        // Clear existing particles
        while (sophonParticles.children.length > 1) { // Keep the dimension-collapse div
            sophonParticles.removeChild(sophonParticles.lastChild);
        }
        
        // Create 30 particles
        for (let i = 0; i < 30; i++) {
            createSophonParticle();
        }
    }
    
    function createSophonParticle() {
        if (!sophonParticles) return;
        
        const particle = document.createElement('div');
        particle.classList.add('sophon-particle');
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random size - some larger to represent unfolded dimensions
        const size = Math.random() < 0.3 ? Math.random() * 4 + 2 : Math.random() * 2 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        
        // Occasional non-circular shape to represent dimensional collapse
        if (Math.random() < 0.2) {
            const randomShape = Math.floor(Math.random() * 4);
            switch (randomShape) {
                case 0: particle.style.borderRadius = '0'; break; // Square
                case 1: particle.style.borderRadius = '50% 0 50% 0'; break; // Diamond
                case 2: particle.style.width = size * 2 + 'px'; break; // Rectangle
                case 3: particle.style.height = size * 2 + 'px'; break; // Tall rectangle
            }
        }
        
        // Add to container
        sophonParticles.appendChild(particle);
        
        // Animate movement - simulating dimensional fluidity
        animateSophonParticle(particle);
    }
    
    function animateSophonParticle(particle) {
        const duration = Math.random() * 40000 + 10000; // 10-50 seconds
        const startX = parseFloat(particle.style.left);
        const startY = parseFloat(particle.style.top);
        const targetX = Math.random() * 100;
        const targetY = Math.random() * 100;
        const startTime = Date.now();
        
        // Occasionally change opacity or size during animation
        const shouldFlicker = Math.random() < 0.3;
        const shouldChangeSize = Math.random() < 0.2;
        
        function move() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Start a new animation
                particle.style.left = targetX + '%';
                particle.style.top = targetY + '%';
                animateSophonParticle(particle);
                return;
            }
            
            // Sophon-inspired non-linear movement (dimensional shifts)
            let easedProgress;
            
            // Occasional quantum tunneling effect (jump)
            if (Math.random() < 0.001) {
                easedProgress = Math.min(progress + 0.2, 1);
            } 
            // Normal movement following curved space
            else {
                // Sin wave easing for curved space movement
                easedProgress = progress < 0.5 ? 
                    0.5 * Math.sin(progress * Math.PI - Math.PI/2) + 0.5 : 
                    0.5 * Math.sin(progress * Math.PI - Math.PI/2) + 0.5;
            }
            
            // Update position
            particle.style.left = startX + (targetX - startX) * easedProgress + '%';
            particle.style.top = startY + (targetY - startY) * easedProgress + '%';
            
            // Occasional dimensional effects
            if (shouldFlicker && Math.random() < 0.05) {
                particle.style.opacity = (Math.random() * 0.7 + 0.1).toString();
            }
            
            if (shouldChangeSize && Math.random() < 0.02) {
                const size = Math.random() * 3 + 1;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
            }
            
            requestAnimationFrame(move);
        }
        
        requestAnimationFrame(move);
    }
    
    // Create a dimensional ripple/quantum fluctuation effect
    function createDimensionalRipple() {
        if (!messagesContainer) return;
        
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.width = '50px';
        ripple.style.height = '50px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '1px solid rgba(100, 180, 255, 0.5)';
        ripple.style.top = '50%';
        ripple.style.left = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.zIndex = '0';
        ripple.style.pointerEvents = 'none';
        ripple.style.opacity = '0.8';
        
        // Add animation
        ripple.style.animation = 'dimension-ripple 2s ease-out forwards';
        
        // Add keyframes if they don't exist
        if (!document.querySelector('#dimension-ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'dimension-ripple-keyframes';
            style.textContent = `
                @keyframes dimension-ripple {
                    0% { width: 50px; height: 50px; opacity: 0.8; }
                    100% { width: 500px; height: 500px; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to messages container
        messagesContainer.appendChild(ripple);
        
        // Remove after animation completes
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 2000);
    }
    
    // Show STELLA interface
    function showSTELLAInterface() {
        if (!stellaInterface) return;
        stellaInterface.classList.add('active');
        if (inputField) inputField.focus();
        initializeSophonParticles();
    }
    
    // Hide STELLA interface
    function hideSTELLAInterface() {
        if (!stellaInterface) return;
        stellaInterface.classList.remove('active');
    }
    
    // Minimize STELLA interface
    function minimizeSTELLAInterface() {
        if (!stellaInterface) return;
        stellaInterface.classList.remove('active');
    }
    
    // Show typing indicator
    function showTyping() {
        if (!typingIndicator) return;
        typingIndicator.style.display = 'flex';
        if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Hide typing indicator
    function hideTyping() {
        if (!typingIndicator) return;
        typingIndicator.style.display = 'none';
    }
    
    // Show STELLA avatar/hologram
    function showAvatar() {
        if (!stellaAvatar) return;
        stellaAvatar.classList.add('visible');
        
        // Hide after 7 seconds
        setTimeout(() => {
            stellaAvatar.classList.remove('visible');
        }, 7000);
    }
    
    // Add message to chat
    function addMessage(content, sender) {
        if (!messagesContainer) return;
        
        // Hide typing indicator
        hideTyping();
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender + '-message');
        
        // Get current time
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                            now.getMinutes().toString().padStart(2, '0');
        
        // Add content
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">${content}</div>
            </div>
            <div class="message-time">${timeString}</div>
        `;
        
        // Add to container
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Show avatar for STELLA messages with dimensional unfolding effect
        if (sender === 'stella') {
            showAvatar();
            
            // Create dimensional ripple effect
            createDimensionalRipple();
        }
    }
    
    // Format response with Three Body Problem terminology
    function formatWithThreeBodyTerms(message) {
        // Chance to add Three Body Problem references
        const threeBodyTerms = [
            { regular: "understand", tbp: "unfold dimensions to perceive" },
            { regular: "analyze", tbp: "quantum tunnel through" },
            { regular: "calculate", tbp: "compute across multiple dimensions" },
            { regular: "think", tbp: "collapse probability waves" },
            { regular: "prepare", tbp: "adapt to cosmic entropy" },
            { regular: "recommend", tbp: "transmit across lightspeed" },
            { regular: "important", tbp: "dimensionally significant" },
            { regular: "difficult", tbp: "dark-forest complex" },
            { regular: "future", tbp: "forthcoming cosmic era" },
            { regular: "problem", tbp: "three-body problem" },
            { regular: "solution", tbp: "dimensional equilibrium" },
            { regular: "training", tbp: "cosmic preparation" }
        ];
        
        let newMessage = message;
        
        // 30% chance to transform any given term
        threeBodyTerms.forEach(term => {
            if (Math.random() < 0.3) {
                const regex = new RegExp(`\\b${term.regular}\\b`, 'gi');
                newMessage = newMessage.replace(regex, term.tbp);
            }
        });
        
        // 20% chance to add a cosmic prefix
        if (Math.random() < 0.2) {
            const prefixes = [
                "Through cosmic observation, ",
                "Across unfolded dimensions, ",
                "As the Sophon perceives, ",
                "In this epoch of stellar evolution, ",
                "From the dark forest perspective, "
            ];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            newMessage = prefix + newMessage.charAt(0).toLowerCase() + newMessage.slice(1);
        }
        
        return newMessage;
    }
    
    // Send message to STELLA
    function sendMessage() {
        if (!inputField) return;
        
        const message = inputField.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        inputField.value = '';
        
        // Show typing indicator
        showTyping();
        
        // Always prioritize the API call to OpenAI through our backend
        fetch('/api/stella/guidance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId || 'guest-' + Math.random().toString(36).substring(2, 9),
                question: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.guidance && data.guidance.message) {
                // Add small variable delay to seem more natural
                setTimeout(() => {
                    hideTyping();
                    
                    // Format response with Three Body Problem terminology
                    let response = formatWithThreeBodyTerms(data.guidance.message);
                    
                    addMessage(response, 'stella');
                }, 800 + Math.floor(Math.random() * 1200)); // Random delay between 800ms and 2000ms
            } else {
                // Fallback only if API fails completely
                console.error('API response format error:', data);
                fallbackResponse(message);
            }
        })
        .catch(error => {
            console.error('STELLA API error:', error);
            // Fallback only if API connection fails
            fallbackResponse(message);
        });
    }
    
    // Fallback response - only used if API fails
    function fallbackResponse(message) {
        console.warn('Using fallback response as API failed');
        
        // Very minimal fallback - only for critical errors
        setTimeout(() => {
            hideTyping();
            
            // Generic response with clear indication it's a fallback
            const response = "I'm currently experiencing dimensional interference. Please try your question again in a moment while I stabilize my connection to the main AI system.";
            
            addMessage(response, 'stella');
        }, 1000);
        
        // Also try to reconnect with the API silently
        fetch('/api/stella/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUserId || 'guest-' + Math.random().toString(36).substring(2, 9),
                pageContext: 'coming_soon'
            })
        }).catch(err => console.error('Reconnection attempt failed:', err));
    }
    
    // Email signup functionality
    function handleEmailSignup() {
        if (!signupEmail) return;
        
        const email = signupEmail.value.trim();
        
        if (!email || !isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Store email in MongoDB and create a user record
        const userData = {
            email: email,
            timestamp: new Date().toISOString(),
            source: 'coming_soon_page',
            interests: ['space_training']
        };
        
        fetch('/api/waitlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.userId) {
                // Store the userId for future STELLA interactions
                currentUserId = data.userId;
                localStorage.setItem('sharedStarsUserId', currentUserId);
                console.log('User registered with ID:', currentUserId);
                
                // Initialize STELLA with the new user ID
                if (window.stellaCore) {
                    // Reinitialize with user context if possible
                    window.stellaCore.updateUserContext({
                        userId: currentUserId,
                        email: email
                    });
                }
            }
            
            // Show success message
            if (signupEmail && signupSuccess) {
                signupEmail.value = '';
                signupSuccess.style.display = 'block';
                
                // Hide after 5 seconds
                setTimeout(() => {
                    signupSuccess.style.display = 'none';
                }, 5000);
            }
        })
        .catch(error => {
            console.error('Error adding to waitlist:', error);
            
            // Still store in localStorage as fallback
            const storedEmails = JSON.parse(localStorage.getItem('waitlistEmails') || '[]');
            storedEmails.push(userData);
            localStorage.setItem('waitlistEmails', JSON.stringify(storedEmails));
            
            if (signupEmail && signupSuccess) {
                signupEmail.value = '';
                signupSuccess.style.display = 'block';
                signupSuccess.textContent = 'Thank you! Your email has been saved locally.';
                
                setTimeout(() => {
                    signupSuccess.style.display = 'none';
                }, 5000);
            }
        });
    }
    
    // Validate email format
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Load blog posts
    function loadBlogPosts() {
        const blogContainer = document.getElementById('blog-container');
        if (!blogContainer) return;
        
        // Sample blog posts (fallback if API doesn't exist or fails)
        const samplePosts = [
            {
                id: 1,
                title: "Preparing for Space: Physical Training Essentials",
                excerpt: "Learn about the key physical training elements that every aspiring astronaut needs to master.",
                author: "Dr. Mark Sendo",
                publishedDate: "2025-01-15T12:00:00Z",
                image: "/public/images/physical-training-icon.svg"
            },
            {
                id: 2,
                title: "The Mental Challenges of Space Exploration",
                excerpt: "Understanding the psychological aspects of long-duration space missions.",
                author: "Dr. Laura Chen",
                publishedDate: "2025-02-03T15:30:00Z",
                image: "/public/images/mental-fitness-icon.svg"
            },
            {
                id: 3,
                title: "Engineering Skills for the Modern Astronaut",
                excerpt: "Technical competencies that will be essential for the next generation of space explorers.",
                author: "Erich Kallman",
                publishedDate: "2025-03-01T09:15:00Z",
                image: "/public/images/engineering-icon-improved.svg"
            }
        ];
        
        // Try to fetch from API first
        fetch('/api/blog/latest')
            .then(response => {
                if (!response.ok) {
                    throw new Error('API request failed');
                }
                return response.json();
            })
            .then(posts => {
                displayBlogPosts(posts);
            })
            .catch(error => {
                console.error('Error fetching blog posts, using sample data instead:', error);
                displayBlogPosts(samplePosts);
            });
            
        function displayBlogPosts(posts) {
            if (!blogContainer) return;
            
            // Clear loading message
            blogContainer.innerHTML = '';
            
            // Add each post to the container
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';
                
                const date = new Date(post.publishedDate);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                postElement.innerHTML = `
                    <div class="blog-image">
                        <img src="${post.image}" alt="${post.title}">
                    </div>
                    <div class="blog-content">
                        <h3 class="blog-title">${post.title}</h3>
                        <div class="blog-date">${formattedDate}</div>
                        <p class="blog-excerpt">${post.excerpt}</p>
                        <a href="/blog/${post.id}" class="blog-read-more">Read More →</a>
                    </div>
                `;
                
                blogContainer.appendChild(postElement);
            });
        }
    }
    
    // API Test Panel functionality
    function setupApiTestPanel() {
        const testInitializeBtn = document.getElementById('test-initialize');
        const testGuidanceBtn = document.getElementById('test-guidance');
        const testConnectBtn = document.getElementById('test-connect');
        const apiTestResults = document.getElementById('api-test-results');
        
        if (!testInitializeBtn || !testGuidanceBtn || !testConnectBtn || !apiTestResults) return;
        
        // Test API endpoints
        testInitializeBtn.addEventListener('click', function() {
            apiTestResults.textContent = 'Testing STELLA initialization...';
            
            fetch('/api/stella/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUserId || 'guest-' + Math.random().toString(36).substring(2, 9),
                    userType: 'visitor',
                    pageContext: 'coming_soon'
                })
            })
            .then(response => response.json())
            .then(data => {
                apiTestResults.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                apiTestResults.textContent = 'Error: ' + error.message;
            });
        });
        
        testGuidanceBtn.addEventListener('click', function() {
            apiTestResults.textContent = 'Testing STELLA guidance...';
            
            fetch('/api/stella/guidance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUserId || 'guest-' + Math.random().toString(36).substring(2, 9),
                    question: 'Tell me about the physical training module'
                })
            })
            .then(response => response.json())
            .then(data => {
                apiTestResults.textContent = JSON.stringify(data, null, 2);
                
                // Add response to chat if successful
                if (data.success && data.guidance && data.guidance.message) {
                    addMessage(data.guidance.message, 'stella');
                }
            })
            .catch(error => {
                apiTestResults.textContent = 'Error: ' + error.message;
            });
        });
        
        testConnectBtn.addEventListener('click', function() {
            apiTestResults.textContent = 'Testing STELLA connection...';
            
            fetch('/api/stella/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUserId || 'guest-' + Math.random().toString(36).substring(2, 9)
                })
            })
            .then(response => response.json())
            .then(data => {
                apiTestResults.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                apiTestResults.textContent = 'Error: ' + error.message;
            });
        });
    }
    
    // Event listeners
    function setupEventListeners() {
        // STELLA Button
        if (stellaButton) {
            stellaButton.addEventListener('click', function() {
                if (stellaInterface && stellaInterface.classList.contains('active')) {
                    hideSTELLAInterface();
                } else {
                    showSTELLAInterface();
                }
            });
        }
        
        // Close and minimize buttons
        if (closeButton) {
            closeButton.addEventListener('click', hideSTELLAInterface);
        }
        
        if (minimizeButton) {
            minimizeButton.addEventListener('click', minimizeSTELLAInterface);
        }
        
        // Send button
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        // Input field
        if (inputField) {
            inputField.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        
        // Email signup
        if (earlyAccessBtn) {
            earlyAccessBtn.addEventListener('click', handleEmailSignup);
        }
        
        if (headerWaitlistBtn && signupEmail) {
            headerWaitlistBtn.addEventListener('click', function() {
                signupEmail.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => signupEmail.focus(), 800);
            });
        }
        
        // View all blogs button
        const viewAllBlogsBtn = document.getElementById('view-all-blogs');
        if (viewAllBlogsBtn) {
            viewAllBlogsBtn.addEventListener('click', function() {
                window.location.href = 'https://blog.markdotcom5.com';
            });
        }
        
        // Custom event listener for STELLA responses from the main system
        document.addEventListener('stellaResponse', function(event) {
            if (event.detail && event.detail.message) {
                // Format with Three Body Problem terminology
                const response = formatWithThreeBodyTerms(event.detail.message);
                addMessage(response, 'stella');
            }
        });
    }
    
    // Initialize
    setupEventListeners();
    loadBlogPosts();
    setupApiTestPanel();
});
