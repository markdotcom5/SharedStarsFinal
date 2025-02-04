document.addEventListener('DOMContentLoaded', async () => {
    const translations = {
        profile: {
            updateSuccess: "Profile updated successfully!",
            updateError: "Failed to update profile."
        }
    };

    // Load profile data
    try {
        const response = await fetch('/api/profile');
        const profileData = await response.json();

        if (response.ok) {
            document.getElementById('fullname').value = profileData.fullname || '';
            document.getElementById('email').value = profileData.email || '';
            document.getElementById('location').value = profileData.location || '';
            document.getElementById('bio').value = profileData.bio || '';
            document.getElementById('modules-count').textContent = profileData.modulesCompleted || '0';
            document.getElementById('current-rank').textContent = profileData.rank || 'Beginner';
            document.getElementById('total-points').textContent = profileData.points || '0';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }

    // Handle form submission
    document.getElementById('profile-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const profileMessage = document.getElementById('profile-message');

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();
            if (response.ok) {
                profileMessage.textContent = translations.profile.updateSuccess;
                profileMessage.className = 'message success';
            } else {
                profileMessage.textContent = data.error || translations.profile.updateError;
                profileMessage.className = 'message error';
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            profileMessage.textContent = translations.profile.updateError;
            profileMessage.className = 'message error';
        }
    });

    // Handle logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
});
