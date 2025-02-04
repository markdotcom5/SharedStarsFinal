document.addEventListener('DOMContentLoaded', () => {
  // Function to fetch and update content for a given module
  async function loadModuleContent(endpoint, elementId) {
    try {
      const response = await fetch(endpoint);

      // ✅ Check if the response is OK before processing
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        const container = document.getElementById(elementId);

        // ✅ Check if the element exists before updating
        if (!container) {
          console.warn(`Element with ID '${elementId}' not found.`);
          return;
        }

        container.innerHTML = `
          <h3 class="text-2xl font-semibold">${data.title}</h3>
          <p class="mb-2">${data.description || ''}</p>
          ${ data.objectives 
              ? `<ul class="list-disc pl-5">${data.objectives.map(obj => `<li>${obj}</li>`).join('')}</ul>` 
              : '' }
        `;
      } else {
        console.error('Failed to load module content:', result.error || 'Invalid API response');
      }
    } catch (error) {
      console.error('Error fetching module content:', error);
    }
  }

  // Load content for each module section
  loadModuleContent('/api/training/modules/physical', 'physical-content');
  loadModuleContent('/api/training/modules/technical', 'technical-content');
  loadModuleContent('/api/training/modules/ai-guided', 'ai-content');
});
