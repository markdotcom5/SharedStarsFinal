// public/js/faq.js - Complete FAQ functionality

document.addEventListener('DOMContentLoaded', function() {
    // ========== ACCORDION FUNCTIONALITY ==========
    const questions = document.querySelectorAll('.faq-question');
    
    questions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = this.classList.contains('active');
            
            // Close all other questions
            questions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.classList.remove('show');
            });
            
            // Toggle this question
            if (!isOpen) {
                this.classList.add('active');
                answer.classList.add('show');
            }
        });
    });
    
    // ========== CATEGORY FILTERING ==========
    const categoryBtns = document.querySelectorAll('.category-btn');
    const faqItems = document.querySelectorAll('.faq-item');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter FAQ items
            filterItems(category, getSearchTerm());
        });
    });
    
    // ========== SEARCH FUNCTIONALITY ==========
    const searchInput = document.getElementById('faq-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const activeCategory = document.querySelector('.category-btn.active')?.getAttribute('data-category') || 'all';
            
            filterItems(activeCategory, searchTerm);
        });
    }
    
    // Function to get current search term
    function getSearchTerm() {
        return searchInput ? searchInput.value.toLowerCase().trim() : '';
    }
    
    // Function to filter items by category and search term
    function filterItems(category, searchTerm) {
        faqItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            const questionText = item.querySelector('.faq-question').textContent.toLowerCase();
            const answerText = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            const matchesCategory = category === 'all' || itemCategory === category;
            const matchesSearch = searchTerm === '' || 
                                  questionText.includes(searchTerm) || 
                                  answerText.includes(searchTerm);
            
            if (matchesCategory && matchesSearch) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show/hide section headers based on visible items
        const sections = document.querySelectorAll('.faq-section');
        sections.forEach(section => {
            const sectionItems = section.querySelectorAll('.faq-item');
            const visibleItems = Array.from(sectionItems).filter(item => 
                item.style.display !== 'none'
            );
            
            if (visibleItems.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
        
        // Show "no results" message if needed
        const noResultsMessage = document.getElementById('no-results-message');
        const hasVisibleItems = Array.from(faqItems).some(item => item.style.display !== 'none');
        
        if (noResultsMessage) {
            noResultsMessage.style.display = hasVisibleItems ? 'none' : 'block';
        }
    }
    
    // ========== SEARCH HIGHLIGHTING ==========
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm) {
                // Remove existing highlights
                document.querySelectorAll('.highlight').forEach(el => {
                    el.outerHTML = el.innerHTML;
                });
                
                // Add new highlights
                const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                
                document.querySelectorAll('.faq-question, .faq-answer p, .faq-answer li').forEach(el => {
                    if (!el.querySelector('input, select, button')) { // Don't highlight form elements
                        el.innerHTML = el.innerHTML.replace(regex, '<span class="highlight">$1</span>');
                    }
                });
            } else {
                // Remove all highlights when search is cleared
                document.querySelectorAll('.highlight').forEach(el => {
                    el.outerHTML = el.innerHTML;
                });
            }
        });
    }
    
    // Helper function to escape regex special characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // ========== HANDLE DATA ATTRIBUTES FOR CSP COMPLIANCE ==========
    // Handle button redirects
    document.querySelectorAll('[data-href]').forEach(button => {
        button.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        });
    });
    
    // Handle email links
    document.querySelectorAll('[data-email]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const email = this.getAttribute('data-email');
            if (email) {
                window.location.href = `mailto:${email}`;
            }
        });
    });
    
    // ========== EXPAND ALL / COLLAPSE ALL ==========
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function() {
            const visibleQuestions = Array.from(questions).filter(q => 
                q.closest('.faq-item').style.display !== 'none'
            );
            
            visibleQuestions.forEach(question => {
                question.classList.add('active');
                question.nextElementSibling.classList.add('show');
            });
        });
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', function() {
            questions.forEach(question => {
                question.classList.remove('active');
                question.nextElementSibling.classList.remove('show');
            });
        });
    }
    
    // ========== SCROLL TO QUESTION BY URL HASH ==========
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetQuestion = document.getElementById(targetId);
        
        if (targetQuestion && targetQuestion.classList.contains('faq-question')) {
            // Scroll to the question
            setTimeout(() => {
                targetQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Open the question
                targetQuestion.classList.add('active');
                targetQuestion.nextElementSibling.classList.add('show');
            }, 300);
        }
    }
    
    // ========== AUTO-OPEN FIRST QUESTION IN EACH SECTION ==========
    const openFirstQuestions = false; // Set to true if you want first questions open by default
    
    if (openFirstQuestions) {
        document.querySelectorAll('.faq-section').forEach(section => {
            const firstQuestion = section.querySelector('.faq-question');
            if (firstQuestion) {
                firstQuestion.classList.add('active');
                firstQuestion.nextElementSibling.classList.add('show');
            }
        });
    }
    
    // ========== UPDATE CURRENT YEAR ==========
    document.querySelectorAll('#current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
});