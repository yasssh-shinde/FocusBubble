// FocusBubble Background Service Worker
let timerAlarm = null;

// Handle extension installation
chrome.runtime.onInstalled.addListener(function() {
    console.log('FocusBubble installed! ✨');
    
    // Set up daily stats reset
    chrome.storage.local.get(['lastResetDate'], function(result) {
        const today = new Date().toDateString();
        if (result.lastResetDate !== today) {
            // Reset daily stats
            chrome.storage.local.set({
                blockedSites: 0,
                completedSessions: 0,
                lastResetDate: today
            });
        }
    });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'startTimer':
            startPomodoroTimer(request.duration);
            break;
            
        case 'resetTimer':
            resetPomodoroTimer();
            break;
            
        case 'openPopup':
            chrome.action.openPopup();
            break;
            
        case 'startPomodoro':
            startPomodoroTimer(25 * 60); // 25 minutes
            break;
    }
});

// Pomodoro timer functions
function startPomodoroTimer(duration) {
    // Clear any existing timer
    if (timerAlarm) {
        chrome.alarms.clear('pomodoroTimer');
    }
    
    // Create new alarm
    chrome.alarms.create('pomodoroTimer', {
        delayInMinutes: duration / 60
    });
    
    console.log(`Pomodoro timer started for ${duration} seconds`);
}

function resetPomodoroTimer() {
    if (timerAlarm) {
        chrome.alarms.clear('pomodoroTimer');
        timerAlarm = null;
    }
    console.log('Pomodoro timer reset');
}

// Handle timer completion
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'pomodoroTimer') {
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: '🌟 Pomodoro Complete!',
            message: 'Amazing work! Time for a well-deserved break! 🎉'
        });
        
        // Send message to popup if it's open
        chrome.runtime.sendMessage({ action: 'timerComplete' });
        
        // Update completed sessions
        chrome.storage.local.get(['completedSessions'], function(result) {
            const sessions = (result.completedSessions || 0) + 1;
            chrome.storage.local.set({ completedSessions: sessions });
        });
        
        console.log('Pomodoro session completed! 🎉');
    }
});

// Daily reset function
function checkDailyReset() {
    chrome.storage.local.get(['lastResetDate'], function(result) {
        const today = new Date().toDateString();
        if (result.lastResetDate !== today) {
            // Reset daily stats
            chrome.storage.local.set({
                blockedSites: 0,
                completedSessions: 0,
                lastResetDate: today
            });
            console.log('Daily stats reset for', today);
        }
    });
}

// Check for daily reset every hour
setInterval(checkDailyReset, 60 * 60 * 1000);

// Handle notification clicks
chrome.notifications.onClicked.addListener(function(notificationId) {
    // Open the popup when notification is clicked
    chrome.action.openPopup();
});

// Handle tab updates to check for daily reset
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        checkDailyReset();
    }
});