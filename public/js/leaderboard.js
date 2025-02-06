// Browser-compatible Event Emitter implementation
if (typeof window.CustomEventEmitter === 'undefined') {
    window.CustomEventEmitter = class {
        constructor() {
            this.events = {};
        }

        on(event, listener) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(listener);
            return this;
        }

        emit(event, ...args) {
            if (!this.events[event]) return;
            this.events[event].forEach(listener => listener.apply(this, args));
        }
    }
}
// Configuration
const CONFIG = {
    REFRESH_INTERVAL: 30000,
    ANIMATION_DURATION: 300,
    WEBSOCKET_URL: `wss://${window.location.host}/ws`
};

// UI Elements and Animations
const UI = {
    elements: {
        filters: {
            ranking: document.getElementById('rankingFilter'),
            time: document.getElementById('timeFilter'),
            search: document.getElementById('searchCadets')
        },
        pagination: {
            prev: document.getElementById('prevPage'),
            next: document.getElementById('nextPage')
        },
        sections: {
            hero: document.querySelector('#hero .stats'),
            modules: document.querySelector('#training-modules .card'),
            leaderboard: document.querySelector('#leaderboard-section .carousel')
        }
    },
    animations: {
        fadeIn: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ],
        pulse: [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ]
    }
};

// Leaderboard Manager Class
class LeaderboardManager extends window.CustomEventEmitter {
    constructor(webSocketService) {
        super();
        this.ws = webSocketService;
        this.cache = {
            data: new Map(),
            timeout: 5 * 60 * 1000
        };
        this.bindEvents();
    }

    bindEvents() {
        this.on('rankUpdate', this.handleRankUpdate.bind(this));
        this.on('achievementUnlocked', this.handleAchievement.bind(this));
        this.on('scoreUpdate', this.handleScoreUpdate.bind(this));
    }

    async handleRankUpdate({ userId, newRank }) {
        try {
            await this.broadcastUpdate('rank_change', { userId, newRank });
            this.clearCache();
        } catch (error) {
            console.error('Error handling rank update:', error);
        }
    }

    async handleScoreUpdate({ userId, newScore }) {
        try {
            const rankings = await this.calculateNewRankings(userId, newScore);
            await this.broadcastUpdate('score_update', { userId, newScore, rankings });
        } catch (error) {
            console.error('Error handling score update:', error);
        }
    }

    clearCache() {
        this.cache.data.clear();
    }

    showAchievementNotification(achievement) {
        console.log("🏆 Achievement Unlocked:", achievement);
        const notification = createNotification('Achievement Unlocked!', achievement);
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    showLevelUpNotification(level, rewards) {
        console.log("⬆️ Level Up:", { level, rewards });
        const notification = createNotification('Level Up!', { level, rewards });
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    }
}

// WebSocket Manager
const WebSocketManager = {
    socket: null,
    retryAttempts: 0,
    maxRetries: 5,

    connect() {
        try {
            const token = localStorage.getItem("authToken"); // ✅ Retrieve token from storage
            if (!token) {
                console.error("❌ WebSocket connection failed: No authentication token.");
                return;
            }

            const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws?token=" + token;
            this.socket = new WebSocket(WS_URL);

            this.setupEventHandlers();
            console.log("🔗 WebSocket connection initialized:", WS_URL);
        } catch (error) {
            console.error("❌ WebSocket connection error:", error);
            this.handleDisconnect();
        }
    },

    setupEventHandlers() {
        if (!this.socket) return;

        this.socket.onopen = () => {
            console.log("✅ WebSocket connected successfully.");
            this.retryAttempts = 0; // ✅ Reset retry counter on successful connection
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error("❌ Error handling WebSocket message:", error);
            }
        };

        this.socket.onclose = (event) => {
            console.warn("⚠️ WebSocket closed. Code:", event.code, "Reason:", event.reason);
            this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            this.handleDisconnect();
        };
    },

    handleMessage(data) {
        console.log("📩 Received WebSocket Message:", data);
    },

    handleDisconnect() {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
            console.warn(`⚠️ WebSocket disconnected. Reconnecting in ${delay / 1000} seconds...`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error("❌ Max WebSocket reconnection attempts reached. No further retries.");
        }
    }
};

// ✅ Initialize WebSocket when the page loads
document.addEventListener("DOMContentLoaded", () => {
    WebSocketManager.connect();
});

// ✅ Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.webSocketManager = WebSocketManager;
        window.webSocketManager.connect();
        
        class LeaderboardManager {
            constructor(webSocketManager) {
                this.webSocketManager = webSocketManager;
            }

            // ✅ Add this function to prevent "bindEvents is not a function" error
            bindEvents() {
                console.log("📌 bindEvents() called - No logic yet, but preventing errors");
            }
        }
        
// ✅ Achievement Notification System
const NotificationManager = {
    showAchievementNotification(achievement) {
        console.log("🏆 Achievement Unlocked:", achievement);
        const notification = createNotification('Achievement Unlocked!', achievement);
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    showLevelUpNotification(level, rewards) {
        console.log("⬆️ Level Up:", { level, rewards });
        const notification = createNotification('Level Up!', { level, rewards });
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    }
};

// ✅ Animation Controller for UI Effects
const AnimationController = {
    animateElement(element, keyframes, options = {}) {
        if (!element) {
            console.warn("⚠️ Animation skipped: Element not found.");
            return;
        }
        
        const defaultOptions = {
            duration: CONFIG.ANIMATION_DURATION,
            easing: 'ease-out',
            fill: 'forwards'
        };

        return element.animate(keyframes, { ...defaultOptions, ...options });
    },

    fadeIn(element, duration = CONFIG.ANIMATION_DURATION) {
        if (!element) return;
        element.style.opacity = 0;
        element.style.display = "block";
        this.animateElement(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    },

    fadeOut(element, duration = CONFIG.ANIMATION_DURATION) {
        if (!element) return;
        this.animateElement(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration }).onfinish = () => {
            element.style.display = "none";
        };
    }
};

const TournamentManager = {
    active: null,
    rankings: new Map(),
 
    initialize(config) {
        this.active = {
            id: config.id,
            name: config.name,
            startTime: new Date(config.startTime),
            endTime: new Date(config.endTime),
            rewards: config.rewards,
            standings: []
        };
        this.startTimer();
        this.refreshStandings();
    },
 
    startTimer() {
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = this.active.endTime - now;
            
            if (timeLeft <= 0) {
                this.endTournament();
                return;
            }
 
            document.getElementById('tournamentTimer').textContent = 
                this.formatTimeLeft(timeLeft);
            requestAnimationFrame(updateTimer);
        };
        updateTimer();
    },
 
    async refreshStandings() {
        try {
            const response = await fetch(`/api/tournament/${this.active.id}/standings`);
            const data = await response.json();
            this.updateStandings(data.standings);
        } catch (error) {
            console.error('Tournament refresh error:', error);
        }
    },
 
    updateStandings(newStandings) {
        const tbody = document.getElementById('tournamentBody');
        if (!tbody) return;
 
        newStandings.forEach((player, index) => {
            const row = this.createStandingRow(player, index + 1);
            const existing = tbody.querySelector(`tr[data-user-id="${player.id}"]`);
            
            if (existing) {
                if (existing.dataset.rank !== String(index + 1)) {
                    AnimationController.slideSort(
                        existing,
                        existing.offsetTop,
                        row.offsetTop
                    );
                }
                existing.replaceWith(row);
            } else {
                tbody.appendChild(row);
                AnimationController.fadeIn(row);
            }
        });
    }
 };
 
 const AchievementSystem = {
    badges: new Map(),
    unlocked: new Set(),

    showAchievementNotification(achievement) {
        const notification = this.createNotification('Achievement Unlocked!', achievement);
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    showLevelUpNotification(level, rewards) {
        const notification = this.createNotification('Level Up!', { level, rewards });
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    async checkPendingAchievements() {
        try {
            const response = await fetch('/api/achievements/pending');
            const pending = await response.json();

            pending.forEach(achievement => {
                if (!this.unlocked.has(achievement.id)) {
                    this.unlockAchievement(achievement);
                }
            });
        } catch (error) {
            console.error("Error fetching pending achievements:", error);
        }
    },

    unlockAchievement(achievement) {
        this.unlocked.add(achievement.id);

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="flex items-center space-x-4 bg-gray-800/90 p-4 rounded-lg border border-blue-500/30">
                <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    ${achievement.icon}
                </div>
                <div>
                    <h4 class="text-blue-400 font-bold">Achievement Unlocked!</h4>
                    <p class="text-white">${achievement.name}</p>
                    <p class="text-sm text-gray-400">${achievement.description}</p>
                </div>
            </div>
        `;

        const container = document.getElementById('achievementContainer');
        if (container) {
            container.appendChild(notification);
            AnimationController.fadeIn(notification);
            setTimeout(() => notification.remove(), 5000);
        } else {
            console.error("Error: `achievementContainer` not found in the DOM.");
        }
    },

    getProgressBar(achievementId) {
        const achievement = this.badges.get(achievementId);
        if (!achievement) return '';

        return `
            <div class="w-full h-2 bg-gray-700 rounded-full mt-2">
                <div class="h-full bg-blue-500 rounded-full" 
                     style="width: ${achievement.progress}%"></div>
            </div>
        `;
    },

    createNotification(title, data) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="flex items-center space-x-4 bg-gray-800/90 p-4 rounded-lg border border-blue-500/30">
                <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    ${data.icon || '🏆'}
                </div>
                <div>
                    <h4 class="text-blue-400 font-bold">${title}</h4>
                    <p class="text-white">${data.name || "Unknown Achievement"}</p>
                    <p class="text-sm text-gray-400">${data.description || "No description available."}</p>
                </div>
            </div>
        `;
        return notification;
    }
};

const LeaderboardAPI = {
    async getGlobalRankings(page, filter, timeRange, search) {
        const params = new URLSearchParams({ 
            page, 
            filter, 
            timeRange, 
            search,
            squadronId: state.squadronFilter,
            tournamentId: state.activeTournament
        });
        return await this.fetchWithRetry(`/api/leaderboard/global?${params}`);
    },
 
    async getUserStats() {
        return await this.fetchWithRetry('/api/leaderboard/user-stats');
    },
 
    async getTournamentStandings(tournamentId) {
        return await this.fetchWithRetry(`/api/tournament/${tournamentId}/standings`);
    },
 
    async getSquadronStats(squadronId) {
        return await this.fetchWithRetry(`/api/squadron/${squadronId}/stats`);
    },
 
    async fetchWithRetry(url, retries = 3) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(response.statusText);
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    }
 };
 
 const state = {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    filter: 'global',
    timeRange: 'allTime',
    searchQuery: '',
    squadronFilter: null,
    activeTournament: null,
    sortColumn: 'rank',
    sortDirection: 'asc',
    selectedDivision: null,
    updateQueue: new Set(),
    animations: {
        enabled: true,
        duration: 300
    },
    filters: {
        rankColors: {
            1: 'text-yellow-400',
            2: 'text-gray-300',
            3: 'text-amber-600'
        },
        divisionClasses: {
            'Alpha': 'bg-purple-500/20 text-purple-400',
            'Beta': 'bg-blue-500/20 text-blue-400',
            'Gamma': 'bg-green-500/20 text-green-400'
        },
        statusStyles: {
            online: { dot: 'bg-green-500', text: 'text-green-400' },
            away: { dot: 'bg-yellow-500', text: 'text-yellow-400' },
            offline: { dot: 'bg-gray-500', text: 'text-gray-400' }
        }
    },
    cache: {
        data: new Map(),
        timeout: 5 * 60 * 1000,
        clear() {
            this.data.clear();
        },
        get(key) {
            const item = this.data.get(key);
            if (!item) return null;
            if (Date.now() - item.timestamp > this.timeout) {
                this.data.delete(key);
                return null;
            }
            return item.value;
        },
        set(key, value) {
            this.data.set(key, {
                value,
                timestamp: Date.now()
            });
        }
    }
};

function initializeState() {
    const params = new URLSearchParams(window.location.search);
    state.currentPage = parseInt(params.get('page')) || 1;
    state.filter = params.get('filter') || 'global';
    state.timeRange = params.get('timeRange') || 'allTime';
    state.squadronFilter = params.get('squadron') || null;
    state.selectedDivision = params.get('division') || null;
}

const EventHandlers = {
    setupEventListeners() {
        UI.elements?.filters?.ranking?.addEventListener('change', this.handleFilterChange);
        UI.elements?.filters?.time?.addEventListener('change', this.handleFilterChange);
        UI.elements?.filters?.search?.addEventListener('input', this.handleSearch);
        UI.elements?.pagination?.prev?.addEventListener('click', () => this.handlePageChange('prev'));
        UI.elements?.pagination?.next?.addEventListener('click', () => this.handlePageChange('next'));

        const videoSections = document.querySelectorAll('.video-section video');
        videoSections.forEach(video => {
            video.addEventListener('error', this.handleVideoError);
            video.addEventListener('canplay', () => this.handleVideoLoad(video));
        });

        document.addEventListener('tournament:update', this.handleTournamentUpdate);
        document.addEventListener('achievement:unlock', this.handleAchievementUnlock);
    },

    handleFilterChange(e) {
        state[e.target.id] = e.target.value;
        state.currentPage = 1;
        state.cache.clear();
        updateURL();
        refreshLeaderboard();
    },

    handleSearch: debounce((e) => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        refreshLeaderboard();
    }, 300)
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.webSocketManager = WebSocketManager;
        window.webSocketManager.connect();
        window.leaderboardManager = new LeaderboardManager(window.webSocketManager);
        initializeState();
        EventHandlers.setupEventListeners();
        Promise.all([
            refreshLeaderboard(),
            LeaderboardAPI.getUserStats()
        ]).then(([leaderboardData, userStats]) => {
            updateUI(leaderboardData);
            updateUserStats(userStats);
        }).catch(error => {
            console.error('Initialization error:', error);
            showError('Failed to initialize leaderboard');
        });
        setInterval(refreshLeaderboard, CONFIG.REFRESH_INTERVAL);
        console.log('Leaderboard system initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Failed to initialize leaderboard system');
    }
});

function updateURL() {
    if (typeof state === 'undefined') {
        console.error("State object is not defined.");
        return;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
        if (value !== null && value !== undefined) {
            params.set(key, value);
        }
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}

function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

function handlePageChange(direction) {
    if (!state || typeof refreshLeaderboard !== 'function') {
        console.error("State object or refreshLeaderboard function is not defined.");
        return;
    }
    if (direction === 'prev' && state.currentPage > 1) {
        state.currentPage--;
    } else if (direction === 'next' && state.currentPage < state.totalPages) {
        state.currentPage++;
    }
    refreshLeaderboard();
}

function showError(message) {
    if (!document.body) {
        console.error("Document body not found. Ensure this script runs after the DOM is loaded.");
        return;
    }
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    notification.style.opacity = "1";
    notification.style.transition = "opacity 0.5s ease-in-out";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("moduleModal")?.classList.add("hidden");
}); // Fixed: Added closing parenthesis here