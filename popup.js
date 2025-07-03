// FocusBubble Popup JavaScript
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let isPaused = false;

// Motivational quotes for the popup
const motivationalQuotes = [
    "You're capable of amazing things! ✨",
    "Every small step counts, beautiful! 🌸",
    "Your focus is your superpower! 💪",
    "Believe in yourself, gorgeous! 💎",
    "You've got this, queen! 👑",
    "Stay focused and sparkle! ✨",
    "Your dreams are worth the effort! 🌟",
    "Progress over perfection, babe! 💕",
    "You're stronger than your distractions! 🛡️",
    "Focus today, celebrate tomorrow! 🎉"
];

// DOM elements
const goalInput = document.getElementById('goalInput');
const saveGoalBtn = document.getElementById('saveGoal');
const currentGoalDiv = document.getElementById('currentGoal');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');
const timerStatus = document.getElementById('timerStatus');
const completedSessionsSpan = document.getElementById('completedSessions');
const blockedSitesSpan = document.getElementById('blockedSites');
const dailyQuoteDiv = document.getElementById('dailyQuote');

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
    loadGoal();
    loadStats();
    loadDailyQuote();
    loadTimerState();
    
    // Event listeners
    saveGoalBtn.addEventListener('click', saveGoal);
    goalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveGoal();
        }
    });
    
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
});

// Goal management
function saveGoal() {
    const goal = goalInput.value.trim();
    if (goal) {
        chrome.storage.local.set({ dailyGoal: goal }, function() {
            displayGoal(goal);
            goalInput.value = '';
            showToast('Goal saved! You\'re amazing! 💕');
        });
    }
}

function loadGoal() {
    chrome.storage.local.get(['dailyGoal'], function(result) {
        if (result.dailyGoal) {
            displayGoal(result.dailyGoal);
        }
    });
}

function displayGoal(goal) {
    currentGoalDiv.innerHTML = `
        <div class="goal-display">
            <span class="goal-text">${goal}</span>
            <button class="delete-goal" onclick="deleteGoal()">❌</button>
        </div>
    `;
}

function deleteGoal() {
    chrome.storage.local.remove(['dailyGoal'], function() {
        currentGoalDiv.innerHTML = '';
        showToast('Goal cleared! 🗑️');
    });
}

// Timer management
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        
        // Save timer state
        chrome.storage.local.set({
            timerRunning: true,
            timerStartTime: Date.now(),
            timerDuration: timeLeft
        });
        
        timerInterval = setInterval(updateTimer, 1000);
        
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        timerStatus.textContent = 'You\'re doing amazing! Keep going! 🌟';
        
        // Send message to background to start timer
        chrome.runtime.sendMessage({
            action: 'startTimer',
            duration: timeLeft
        });
    } else if (isPaused) {
        isPaused = false;
        timerInterval = setInterval(updateTimer, 1000);
        
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        timerStatus.textContent = 'Back to focus mode! You\'ve got this! 🌟';
    }
}

function pauseTimer() {
    if (isRunning && !isPaused) {
        isPaused = true;
        clearInterval(timerInterval);
        
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
        timerStatus.textContent = 'Paused - Ready to continue when you are! 💕';
        
        // Update stored timer state
        chrome.storage.local.set({
            timerRunning: false,
            timerTimeLeft: timeLeft
        });
    }
}

function resetTimer() {
    isRunning = false;
    isPaused = false;
    timeLeft = 25 * 60;
    
    clearInterval(timerInterval);
    updateDisplay();
    
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    timerStatus.textContent = '';
    
    // Clear stored timer state
    chrome.storage.local.remove(['timerRunning', 'timerStartTime', 'timerDuration', 'timerTimeLeft']);
    
    // Send message to background to reset timer
    chrome.runtime.sendMessage({ action: 'resetTimer' });
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
        
        // Update stored time
        chrome.storage.local.set({ timerTimeLeft: timeLeft });
    } else {
        // Timer finished
        completeSession();
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function completeSession() {
    isRunning = false;
    isPaused = false;
    clearInterval(timerInterval);
    
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    timerStatus.textContent = 'Session complete! You\'re incredible! 🎉';
    
    // Update completed sessions
    chrome.storage.local.get(['completedSessions'], function(result) {
        const sessions = (result.completedSessions || 0) + 1;
        chrome.storage.local.set({ completedSessions: sessions });
        completedSessionsSpan.textContent = sessions;
    });
    
    // Reset timer
    timeLeft = 25 * 60;
    updateDisplay();
    
    // Clear stored timer state
    chrome.storage.local.remove(['timerRunning', 'timerStartTime', 'timerDuration', 'timerTimeLeft']);
    
    // Show celebration
    showToast('Pomodoro completed! Take a break, you earned it! 🌟');
}

function loadTimerState() {
    chrome.storage.local.get(['timerRunning', 'timerStartTime', 'timerDuration', 'timerTimeLeft'], function(result) {
        if (result.timerRunning && result.timerStartTime && result.timerDuration) {
            // Calculate elapsed time
            const elapsed = Math.floor((Date.now() - result.timerStartTime) / 1000);
            timeLeft = Math.max(0, result.timerDuration - elapsed);
            
            if (timeLeft > 0) {
                startTimer();
            } else {
                completeSession();
            }
        } else if (result.timerTimeLeft) {
            timeLeft = result.timerTimeLeft;
            updateDisplay();
        }
    });
}

// Stats management
function loadStats() {
    chrome.storage.local.get(['completedSessions', 'blockedSites'], function(result) {
        completedSessionsSpan.textContent = result.completedSessions || 0;
        blockedSitesSpan.textContent = result.blockedSites || 0;
    });
}

// Daily quote
function loadDailyQuote() {
    const today = new Date().toDateString();
    chrome.storage.local.get(['dailyQuoteDate', 'dailyQuoteText'], function(result) {
        if (result.dailyQuoteDate === today && result.dailyQuoteText) {
            dailyQuoteDiv.textContent = result.dailyQuoteText;
        } else {
            // Get new quote for today
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            dailyQuoteDiv.textContent = randomQuote;
            chrome.storage.local.set({
                dailyQuoteDate: today,
                dailyQuoteText: randomQuote
            });
        }
    });
}

// Utility functions
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'timerComplete') {
        completeSession();
    }
});