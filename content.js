// FocusBubble Content Script
// This script runs on blocked websites and replaces the content with motivational quotes

const motivationalQuotes = [
    {
        text: "You're meant for bigger things than endless scrolling! ✨",
        author: "Your Future Self"
    },
    {
        text: "Every moment you resist temptation, you're becoming stronger! 💪",
        author: "Your Inner Strength"
    },
    {
        text: "Your goals are calling - don't keep them waiting! 🌟",
        author: "Your Dreams"
    },
    {
        text: "Focus is your superpower. Use it wisely, beautiful! 💎",
        author: "Your Potential"
    },
    {
        text: "You've got work to do, queen! Let's get back to it! 👑",
        author: "Your Ambition"
    },
    {
        text: "This distraction is temporary, but your success is permanent! 🚀",
        author: "Your Destiny"
    },
    {
        text: "Your focus today creates your freedom tomorrow! 🌸",
        author: "Your Wisdom"
    },
    {
        text: "You're too powerful to be distracted by this! 🔥",
        author: "Your Inner Boss"
    },
    {
        text: "Remember why you started. You've got this! 💕",
        author: "Your Motivation"
    },
    {
        text: "Success loves focused minds. Be the person you admire! ✨",
        author: "Your Best Self"
    }
];

function getRandomQuote() {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

function getSiteName() {
    const hostname = window.location.hostname;
    if (hostname.includes('youtube')) return 'YouTube';
    if (hostname.includes('facebook')) return 'Facebook';
    if (hostname.includes('instagram')) return 'Instagram';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter/X';
    if (hostname.includes('tiktok')) return 'TikTok';
    if (hostname.includes('reddit')) return 'Reddit';
    if (hostname.includes('netflix')) return 'Netflix';
    if (hostname.includes('twitch')) return 'Twitch';
    if (hostname.includes('pinterest')) return 'Pinterest';
    return 'this website';
}

function createBlockedPage() {
    const quote = getRandomQuote();
    const siteName = getSiteName();
    
    // Remove all existing content
    document.head.innerHTML = `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✨ FocusBubble - Stay Focused!</title>
        <link rel="stylesheet" href="${chrome.runtime.getURL('content.css')}">
    `;
    
    document.body.innerHTML = `
        <div class="focus-bubble-container">
            <div class="focus-bubble-card">
                <div class="focus-bubble-header">
                    <h1>✨ FocusBubble ✨</h1>
                    <p class="blocked-site">You tried to visit ${siteName}</p>
                </div>
                
                <div class="focus-bubble-content">
                    <div class="motivation-section">
                        <div class="quote-bubble">
                            <p class="quote-text">"${quote.text}"</p>
                            <p class="quote-author">- ${quote.author}</p>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <div class="stat-item">
                            <div class="stat-number" id="blockedCount">0</div>
                            <div class="stat-label">Times Blocked Today 🛡️</div>
                        </div>
                    </div>
                    
                    <div class="actions-section">
                        <button id="focusButton" class="btn-primary">
                            🎯 Get Back to Focus
                        </button>
                        <button id="goalButton" class="btn-secondary">
                            💎 View My Goals
                        </button>
                    </div>
                    
                    <div class="timer-section">
                        <p class="timer-text">Need a break? Start a 25-minute focus session!</p>
                        <button id="startPomodoroBtn" class="btn-pomodoro">
                            🍅 Start Pomodoro
                        </button>
                    </div>
                </div>
                
                <div class="focus-bubble-footer">
                    <p>You're doing amazing! Every "no" to distraction is a "yes" to your dreams! 🌟</p>
                </div>
            </div>
        </div>
    `;
    
    // Update blocked sites counter
    updateBlockedCounter();
    
    // Add event listeners
    document.getElementById('focusButton').addEventListener('click', function() {
        window.close();
    });
    
    document.getElementById('goalButton').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.getElementById('startPomodoroBtn').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'startPomodoro' });
        showToast('Pomodoro started! You\'ve got this! 🌟');
    });
}

function updateBlockedCounter() {
    chrome.storage.local.get(['blockedSites'], function(result) {
        const count = (result.blockedSites || 0) + 1;
        chrome.storage.local.set({ blockedSites: count });
        document.getElementById('blockedCount').textContent = count;
    });
}

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

// Check if we should block this site
function shouldBlock() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['focusMode'], function(result) {
            // For now, always block. You can add logic here for focus mode toggles
            resolve(true);
        });
    });
}

// Initialize the content script
async function init() {
    const shouldBlockSite = await shouldBlock();
    
    if (shouldBlockSite) {
        // Wait for the page to load, then replace it
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createBlockedPage);
        } else {
            createBlockedPage();
        }
    }
}

// Run the initialization
init();