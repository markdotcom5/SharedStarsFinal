document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-password-form');
    const emailStep = document.getElementById('email-step');
    const codeStep = document.getElementById('code-step');
    const passwordStep = document.getElementById('password-step');
    const message = document.getElementById('reset-message');
    let resetToken = '';

    // Step 1: Handle email submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;

        try {
            const response = await fetch('/api/auth/reset-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                emailStep.classList.remove('active');
                codeStep.classList.add('active');
                message.textContent = "A verification code has been sent to your email.";
                message.className = 'message success';
            } else {
                throw new Error('Failed to send reset code');
            }
        } catch (error) {
            message.textContent = "Error: Could not send reset link.";
            message.className = 'message error';
        }
    });

    // Step 2: Handle code verification
    document.querySelector('#code-step button').addEventListener('click', async () => {
        const code = document.getElementById('reset-code').value;

        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('reset-email').value,
                    code
                })
            });

            if (response.ok) {
                const data = await response.json();
                resetToken = data.token;
                codeStep.classList.remove('active');
                passwordStep.classList.add('active');
                message.textContent = "Code verified successfully. Please reset your password.";
                message.className = 'message success';
            } else {
                throw new Error('Invalid code');
            }
        } catch (error) {
            message.textContent = "Error: Invalid verification code.";
            message.className = 'message error';
        }
    });

    // Step 3: Handle password reset
    document.querySelector('#password-step button').addEventListener('click', async () => {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            message.className = 'message error';
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resetToken}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (response.ok) {
                message.textContent = "Password reset successful. Redirecting to login...";
                message.className = 'message success';
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                throw new Error('Failed to reset password');
            }
        } catch (error) {
            message.textContent = "Error: Could not reset password.";
            message.className = 'message error';
        }
    });
});
