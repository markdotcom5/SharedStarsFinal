document.addEventListener('DOMContentLoaded', () => {
    async function openModuleModal(moduleType) {
        try {
            const token = localStorage.getItem('jwtToken'); // Ensure token is included
            const response = await fetch(`/api/modules/${moduleType}/details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Attach token if needed
                },
            });

            if (!response.ok) throw new Error('Module not found');
            const data = await response.json();
            const moduleData = data.module;

            // Get modal elements
            const moduleName = document.getElementById('moduleName');
            const moduleContent = document.getElementById('moduleContent');
            const subModulesList = document.getElementById('moduleSubModules');
            const moduleModal = document.getElementById('moduleModal');

            if (!moduleName || !moduleContent || !subModulesList || !moduleModal) {
                console.error('❌ One or more modal elements not found in DOM.');
                return;
            }

            // Update modal content
            moduleName.innerText = moduleData.name;
            moduleContent.innerText = moduleData.content;
            subModulesList.innerHTML = ''; // Clear previous items

            moduleData.subModules.forEach((sub) => {
                const li = document.createElement('li');
                li.innerText = sub;
                subModulesList.appendChild(li);
            });

            // Display the modal (remove the 'hidden' class)
            moduleModal.classList.remove('hidden');
        } catch (error) {
            console.error('❌ Error loading module:', error);
        }
    }

    // Attach event listeners to module buttons
    document.querySelectorAll('.module-button').forEach((button) => {
        button.addEventListener('click', (e) => {
            const moduleType = e.currentTarget.getAttribute('data-module');
            if (!moduleType) {
                console.error('❌ Module type not found on button.');
                return;
            }
            openModuleModal(moduleType);
        });
    });

    // Close modal functionality
    const closeModalBtn = document.getElementById('closeModal');
    const moduleModal = document.getElementById('moduleModal');

    if (!closeModalBtn || !moduleModal) {
        console.error(
            '❌ Close button or modal not found in DOM. Make sure #closeModal and #moduleModal exist.'
        );
        return;
    }

    closeModalBtn.addEventListener('click', () => {
        moduleModal.classList.add('hidden');
    });
});
