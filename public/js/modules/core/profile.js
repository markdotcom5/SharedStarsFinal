export const profile = {
    async getUserProfile(userId) {
        try {
            const response = await fetch(`/api/user/profile/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    },

    async updateProfile(userId, data) {
        try {
            const response = await fetch(`/api/user/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    },

    init() {
        console.log('Core profile module initialized');
    }
};