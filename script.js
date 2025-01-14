let startTime = new Date('2025-01-14T13:35:57+05:30');
let timerDisplay = document.getElementById('timer');
let progressBar = document.getElementById('progress');
let timerDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
let timerInterval;
let isPaused = false;

// Load timer duration from storage
chrome.storage.sync.get(['timerDuration'], function(result) {
    if (result.timerDuration) {
        timerDuration = result.timerDuration;
    }
    startTimer();
});

function updateTimer() {
    let currentTime = new Date();
    let elapsed = new Date(currentTime - startTime);

    let hours = String(elapsed.getUTCHours()).padStart(2, '0');
    let minutes = String(elapsed.getUTCMinutes()).padStart(2, '0');
    let seconds = String(elapsed.getUTCSeconds()).padStart(2, '0');

    timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

function startTimer() {
    let endTime = new Date(Date.now() + timerDuration);
    timerInterval = setInterval(() => {
        if (!isPaused) {
            let remainingTime = endTime - Date.now();
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                notifyUser();
                startTimer(); // Restart the timer after notification
            }
            updateTimerDisplay(remainingTime);
            updateProgressBar(remainingTime);
            chrome.storage.sync.set({ timerDuration }); // Save timer duration
        }
    }, 1000);
}

function updateTimerDisplay(remainingTime) {
    let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateProgressBar(remainingTime) {
    let percentage = (remainingTime / timerDuration) * 100;
    progressBar.style.width = percentage + '%';
}

function changeTimerDuration(newDuration) {
    timerDuration = newDuration * 60 * 1000; // Convert to milliseconds
    chrome.storage.sync.set({ timerDuration }); // Save new duration
}

function pauseTimer() {
    isPaused = !isPaused; // Toggle pause state
}

function resetTimer() {
    clearInterval(timerInterval);
    timerDuration = 20 * 60 * 1000; // Reset to 20 minutes
    isPaused = false;
    startTimer();
}

// Exercise suggestions based on time of day
const exerciseSuggestions = {
    morning: [
        { name: 'Eye Rolling', duration: 5, description: 'Roll your eyes clockwise and counterclockwise' },
        { name: 'Focus Change', duration: 10, description: 'Alternate between focusing on near and far objects' },
        { name: 'Palming', duration: 15, description: 'Cover your eyes with your palms and relax' }
    ],
    afternoon: [
        { name: 'Blinking Exercise', duration: 5, description: 'Rapid blinking for eye moisture' },
        { name: 'Eye Movement', duration: 10, description: 'Move eyes in different directions' },
        { name: 'Screen Break', duration: 20, description: 'Look away from screen and focus on distant objects' }
    ],
    evening: [
        { name: 'Eye Massage', duration: 5, description: 'Gentle massage around eyes' },
        { name: 'Eye Stretching', duration: 10, description: 'Look up, down, left, right' },
        { name: 'Relaxation', duration: 15, description: 'Close eyes and practice deep breathing' }
    ]
};

// Sound for notifications
const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${
        type === 'error' ? 'bg-red-500' : 'bg-teal-500'
    } shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Get current time period
function getTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
}

// Update exercise suggestions based on time
function updateExerciseSuggestions() {
    const period = getTimePeriod();
    const suggestions = exerciseSuggestions[period];
    const sections = document.querySelectorAll('.section');
    
    sections.forEach((section, index) => {
        const suggestion = suggestions[index];
        if (suggestion) {
            section.querySelector('h2').textContent = suggestion.name;
            section.querySelector('p').textContent = `${suggestion.description} (${suggestion.duration} min)`;
        }
    });
}

// Enhanced notification function
function notifyUser() {
    if (Notification.permission === 'granted') {
        const period = getTimePeriod();
        const suggestions = exerciseSuggestions[period];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        
        notificationSound.play().catch(err => console.log('Audio playback failed:', err));
        
        new Notification('Exercise Time!', {
            body: `Try this exercise: ${randomSuggestion.name} - ${randomSuggestion.description}`,
            icon: 'icon.png'
        });
    } else {
        showToast('Please enable notifications for better experience', 'error');
    }
}

// Custom timer input validation
document.getElementById('customTimerInput').addEventListener('input', function(e) {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value <= 0) {
        showToast('Please enter a valid positive number', 'error');
        e.target.value = '';
    } else if (value > 60) {
        showToast('Maximum timer duration is 60 minutes', 'error');
        e.target.value = 60;
    }
});

document.getElementById('setCustomTimer').addEventListener('click', function() {
    const input = document.getElementById('customTimerInput');
    const value = parseInt(input.value);
    
    if (value > 0 && value <= 60) {
        changeTimerDuration(value);
        showToast(`Timer set to ${value} minutes`);
    } else {
        showToast('Please enter a valid duration between 1-60 minutes', 'error');
    }
});

// Update exercise suggestions every hour
setInterval(updateExerciseSuggestions, 3600000);
// Initial update
updateExerciseSuggestions();

// Request notification permission
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}

document.getElementById('testNotification').addEventListener('click', notifyUser);

document.getElementById('openFullView').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html'), index: -1 });
});

// Add event listeners for buttons
document.getElementById('increaseTimer').addEventListener('click', () => changeTimerDuration(30)); // 30 minutes
document.getElementById('decreaseTimer').addEventListener('click', () => changeTimerDuration(10)); // 10 minutes
document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
document.getElementById('reset-timer').addEventListener('click', resetTimer);

// Event listeners for setting specific durations
document.getElementById('set-20-min').addEventListener('click', () => changeTimerDuration(20));
document.getElementById('set-30-min').addEventListener('click', () => changeTimerDuration(30));
document.getElementById('set-10-min').addEventListener('click', () => changeTimerDuration(10));
document.getElementById('set-5-min').addEventListener('click', () => changeTimerDuration(5));
document.getElementById('set-15-min').addEventListener('click', () => changeTimerDuration(15));

// Auto-start timer on install
chrome.runtime.setUninstallURL('https://example.com/uninstall');
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log('Starting timer on install...'); 
        startTimer();
    }
});
