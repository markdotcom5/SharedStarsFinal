export const profile = {
    renderProfile(userData) {
        return `
            <div class="profile-container p-4">
                <h2 class="text-2xl font-bold mb-4">${userData.name}'s Profile</h2>
                <div class="space-y-4">
                    <div class="profile-field">
                        <label class="block text-sm font-medium text-gray-700">Email</label>
                        <p class="mt-1">${userData.email}</p>
                    </div>
                    <div class="profile-field">
                        <label class="block text-sm font-medium text-gray-700">Member Since</label>
                        <p class="mt-1">${new Date(userData.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        `;
    },

    renderEditForm(userData) {
        return `
            <form id="profileEditForm" class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="name" name="name" value="${userData.name}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>
                <button type="submit" class="bg-blue-500 text-white rounded-md py-2 px-4">Save Changes</button>
            </form>
        `;
    },

    init() {
        console.log('UI profile module initialized');
    },
};
