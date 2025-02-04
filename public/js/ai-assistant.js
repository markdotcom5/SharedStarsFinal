// Ensure this file is recognized as a module
import AISpaceCoach from './AISpaceCoach.js';
import AIGuidanceSystem from './AIGuidanceSystem.js';
import { fetchOpenAIResponse } from './checkOpenAI.js';

const aiCoach = new AISpaceCoach();
const guidanceSystem = new AIGuidanceSystem();
// ✅ Define functions globally so they work with script tags in HTML
// ✅ Remove duplicate functions and correctly export them
// ✅ Define functions globally so they work with script tags in HTML
function openChat() {
    document.getElementById('ai-chat-container').classList.remove('hidden');
}

function closeChat() {
    document.getElementById('ai-chat-container').classList.add('hidden');
}

async function startAITraining() {
    openChat();
    sendAIMessage("Welcome! I will guide you through your space training journey.");

    setTimeout(() => {
        sendAIMessage("Let's start by understanding your fitness level. Are you a Beginner, Intermediate, or Advanced?");
    }, 2000);
}


// Send AI Message
function sendAIMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML += `<div class="ai-msg"><strong>AI:</strong> ${message}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// User Input Processing
async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput.trim()) return;

    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML += `<div class="user-msg"><strong>You:</strong> ${userInput}</div>`;
    document.getElementById('user-input').value = '';

    // **Step 1: AI Space Coach Processes Input**
    const trainingRecommendation = aiCoach.processUserInput(userInput);
    sendAIMessage(trainingRecommendation);

    // **Step 2: Fetch OpenAI Response**
    const openAIReply = await fetchOpenAIResponse(userInput);
    sendAIMessage(openAIReply);

    // **Step 3: Guidance System Updates Progress**
    guidanceSystem.updateUserProgress(userInput);

    // **Step 4: AI Determines Next Step**
    setTimeout(() => {
        determineNextStep();
    }, 3000);
}

// AI Determines Next Steps
function determineNextStep() {
    sendAIMessage("Now, let's test your reaction speed. Follow this quick reflex exercise...");
    setTimeout(() => {
        sendAIMessage("Touch the screen when you see the countdown reach 0!");
    }, 2000);
}

