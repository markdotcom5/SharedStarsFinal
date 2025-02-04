document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const passwordToggle = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('signup-password');

    // Password visibility toggle
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });

    // Form validation
    const validatePassword = (password) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        };
        return requirements;
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Real-time validation
    passwordInput.addEventListener('input', () => {
        const requirements = validatePassword(passwordInput.value);
        const errorMsg = [];
        
        if (!requirements.length) errorMsg.push('At least 8 characters');
        if (!requirements.uppercase) errorMsg.push('One uppercase letter');
        if (!requirements.lowercase) errorMsg.push('One lowercase letter');
        if (!requirements.number) errorMsg.push('One number');

        document.getElementById('password-error').textContent = errorMsg.join(', ');
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.textContent = '');

        // Get form data
        const formData = {
            name: document.getElementById('signup-name').value.trim(),
            email: document.getElementById('signup-email').value.trim(),
            password: passwordInput.value,
            aiGuidance: {
                mode: 'full_guidance',
                personalizedSettings: {
                    pacePreference: 'balanced',
                    adaptiveUI: true
                },
                context: {
                    currentPhase: 'onboarding',
                    nextActions: ['complete_profile']
                }
            },
            settings: {
                notifications: {
                    aiSuggestions: true
                },
                aiPreferences: {
                    automationLevel: 'maximum',
                    interactionStyle: 'proactive',
                    dataCollection: 'comprehensive'
                }
            }
        };

        // Validate form data
        let isValid = true;
        const errors = {};

        if (!formData.name) {
            errors.name = 'Name is required';
            isValid = false;
        }

        if (!validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (!validatePassword(formData.password).length) {
            errors.password = 'Password does not meet requirements';
            isValid = false;
        }

        if (!document.getElementById('terms-checkbox').checked) {
            errors.terms = 'You must accept the terms and conditions';
            isValid = false;
        }

        // Display any validation errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
            }
        });

        if (!isValid) {
            document.getElementById('form-error').textContent = 'Please correct the errors above';
            return;
        }

        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Signing up...';

            const response = await fetch('/join-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store the token
                localStorage.setItem('token', data.data.token);
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = data.message;
                form.insertBefore(successMessage, form.firstChild);

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/welcome.html';
                }, 1500);
            } else {
                // Show error from server
                document.getElementById('form-error').textContent = data.error || 'Signup failed. Please try again.';
                
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('form-error').textContent = 'Houston, we have a problem. Please try again.';
            
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});