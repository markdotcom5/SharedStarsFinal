export const signup = {
    validateForm(formData) {
        const errors = {};
        if (!formData.email) errors.email = 'Email is required';
        if (!formData.password) errors.password = 'Password is required';
        return errors;
    },

    async submitForm(formData) {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    init() {
        console.log('Core signup module initialized');
    }
};