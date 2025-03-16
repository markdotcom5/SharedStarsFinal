/**
 * about.js - Enhanced JavaScript for the SharedStars About page
 * Provides smooth animations, team member interactions, and timeline functionality
 * without dependencies on STELLA AI or other complex services
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('About page initialization started');
    
    // Initialize all components
    initAnimations();
    initTeamInteractions();
    initTimeline();
    initTestimonialCarousel();
    initMissionVision();
    initScrollEffects();
    
    console.log('About page fully initialized');
    
    /**
     * Initialize scroll-triggered animations
     */
    function initAnimations() {
        // Elements that should animate when scrolled into view
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        // Observer for animation triggers
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Only animate once
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2, // Trigger when 20% visible
            rootMargin: '0px 0px -50px 0px' // Adjust trigger point
        });
        
        // Observe all animated elements
        animatedElements.forEach(element => {
            observer.observe(element);
        });
        
        console.log(`Initialized animations for ${animatedElements.length} elements`);
    }
    
    /**
     * Initialize team member interactions
     */
    function initTeamInteractions() {
        const teamMembers = document.querySelectorAll('.team-member');
        
        teamMembers.forEach(member => {
            // Show bio on hover/click
            member.addEventListener('mouseenter', function() {
                this.querySelector('.member-bio')?.classList.add('visible');
            });
            
            member.addEventListener('mouseleave', function() {
                this.querySelector('.member-bio')?.classList.remove('visible');
            });
            
            // Mobile-friendly click toggle
            member.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    const bio = this.querySelector('.member-bio');
                    if (bio) {
                        bio.classList.toggle('visible');
                    }
                }
            });
        });
        
        // Fix image loading issues
        document.querySelectorAll('.member-photo img').forEach(img => {
            img.addEventListener('error', function() {
                // If image fails to load, use a placeholder
                console.warn(`Failed to load image: ${this.src}`);
                this.src = '/images/male1.png'; // Default fallback
            });
        });
        
        console.log(`Initialized interactions for ${teamMembers.length} team members`);
    }
    
    /**
     * Initialize company timeline
     */
    function initTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        // Animate timeline items as they come into view
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Calculate delay based on position
                    const index = Array.from(timelineItems).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
        
        console.log(`Initialized timeline with ${timelineItems.length} events`);
    }
    
    /**
     * Initialize testimonial carousel
     */
    function initTestimonialCarousel() {
        const carousel = document.querySelector('.testimonial-carousel');
        if (!carousel) return;
        
        const testimonials = carousel.querySelectorAll('.testimonial');
        const indicators = carousel.querySelectorAll('.carousel-indicator');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        
        let currentIndex = 0;
        
        // Update visible testimonial
        function showTestimonial(index) {
            testimonials.forEach((testimonial, i) => {
                testimonial.classList.toggle('active', i === index);
                testimonial.setAttribute('aria-hidden', i !== index);
            });
            
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
            
            currentIndex = index;
        }
        
        // Setup navigation
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
                showTestimonial(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % testimonials.length;
                showTestimonial(newIndex);
            });
        }
        
        // Setup indicators
        indicators.forEach((indicator, i) => {
            indicator.addEventListener('click', () => {
                showTestimonial(i);
            });
        });
        
        // Auto-advance carousel (if desired)
        let autoplayInterval;
        
        function startAutoplay() {
            stopAutoplay(); // Clear any existing interval
            autoplayInterval = setInterval(() => {
                const newIndex = (currentIndex + 1) % testimonials.length;
                showTestimonial(newIndex);
            }, 5000); // Change every 5 seconds
        }
        
        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
            }
        }
        
        // Start autoplay, pause on hover
        startAutoplay();
        
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        
        console.log(`Initialized testimonial carousel with ${testimonials.length} testimonials`);
    }
    
    /**
     * Initialize mission and vision section
     */
    function initMissionVision() {
        const missionVisionToggle = document.querySelectorAll('.mission-vision-toggle');
        const missionContent = document.querySelector('.mission-content');
        const visionContent = document.querySelector('.vision-content');
        
        if (!missionVisionToggle.length || !missionContent || !visionContent) return;
        
        missionVisionToggle.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                
                // Update active toggle
                missionVisionToggle.forEach(t => {
                    t.classList.toggle('active', t === this);
                });
                
                // Show appropriate content
                if (type === 'mission') {
                    missionContent.classList.add('active');
                    visionContent.classList.remove('active');
                } else {
                    visionContent.classList.add('active');
                    missionContent.classList.remove('active');
                }
            });
        });
        
        console.log('Initialized mission/vision toggle');
    }
    
    /**
     * Initialize scroll effects for section transitions
     */
    function initScrollEffects() {
        // Parallax effect for hero section
        const heroSection = document.querySelector('.hero-section');
        const heroContent = document.querySelector('.hero-content');
        
        if (heroSection && heroContent) {
            window.addEventListener('scroll', () => {
                const scrollPosition = window.scrollY;
                if (scrollPosition < window.innerHeight) {
                    heroContent.style.transform = `translateY(${scrollPosition * 0.3}px)`;
                    heroSection.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
                }
            });
        }
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Account for fixed header
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        console.log('Initialized scroll effects');
    }
});