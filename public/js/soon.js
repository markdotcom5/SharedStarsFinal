function sendMessage() {
    const inputField = document.getElementById('stella-input');
    const messagesContainer = document.getElementById('stella-messages');
    const message = inputField.value.trim();
    if (!message) return;

    // Display user message
    messagesContainer.innerHTML += `<div class="user-message">${message}</div>`;
    inputField.value = '';
    document.getElementById('stellaButton').addEventListener('click', function() {
        document.getElementById('stella-interface').classList.toggle('active');
    });
    document.getElementById('test-initialize').addEventListener('click', function() {
    fetch('/api/stella/initialize', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userType: 'tester', pageContext: 'api_test'})
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('api-test-results').textContent = JSON.stringify(data, null, 2);
    });
});

document.getElementById('test-guidance').addEventListener('click', function() {
    fetch('/api/stella/guidance', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId: 'guest', question: 'What is SharedStars?'})
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('api-test-results').textContent = JSON.stringify(data, null, 2);
    });
});

document.getElementById('test-connect').addEventListener('click', function() {
    fetch('/api/stella/connect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'test'})
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('api-test-results').textContent = JSON.stringify(data, null, 2);
    });
});

    // Fetch response from your backend API
    fetch('/api/stella/guidance', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId: 'guest', question: message})
    })
    .then(response => response.json())
    .then(data => {
        const stellaMessage = data.guidance?.message || "I'm experiencing technical issues.";
        messagesContainer.innerHTML += `<div class="stella-message">${stellaMessage}</div>`;
    })
    .catch(error => {
        console.error('STELLA API error:', error);
        messagesContainer.innerHTML += `<div class="stella-message">I'm currently experiencing dimensional interference. Try again later.</div>`;
    });
}
