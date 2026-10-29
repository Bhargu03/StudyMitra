// 1. Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    // Update active button in nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[onclick="showPage('${pageId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Load page-specific data
    if (pageId === 'materials') {
        loadMaterials();
    }
}

// Initialize profile modal close on outside click
document.addEventListener('DOMContentLoaded', function() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                closeProfileModal();
            }
        });
    }
});

// 2. Simulated AI Analysis (PDF Extraction)
async function analyzePDF() {
    const fileInput = document.getElementById('pdfUpload');
    const status = document.getElementById('status');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!fileInput.files[0]) return alert("Please select a file!");

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    status.innerText = "Extracting text from PDF...";
    
    try {
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map(item => item.str).join(' ') + ' ';
        }
        
        status.innerText = "Analyzing topics using AI logic...";
        
        // Simple mock analysis based on text
        const topics = extractTopics(text);
        
        localStorage.setItem('studyMitraData', JSON.stringify(topics));
        status.innerText = "Analysis Complete! Go to Smart Planner.";
        generatePlan();
    } catch (error) {
        status.innerText = "Error analyzing PDF: " + error.message;
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze with AI';
    }
}

function extractTopics(text) {
    // Simple keyword-based extraction
    const keywords = {
        "Data Structures": { weight: 9, diff: 3 },
        "Algorithm Design": { weight: 10, diff: 3 },
        "Web Development": { weight: 5, diff: 1 },
        "Database": { weight: 7, diff: 2 },
        "Operating Systems": { weight: 6, diff: 2 },
        "Computer Networks": { weight: 8, diff: 3 }
    };
    
    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    for (const [topic, data] of Object.entries(keywords)) {
        if (lowerText.includes(topic.toLowerCase())) {
            foundTopics.push({ subject: topic, weight: data.weight, diff: data.diff });
        }
    }
    
    // If no topics found, use defaults
    if (foundTopics.length === 0) {
        foundTopics.push(
            { subject: "General Topics", weight: 5, diff: 2 },
            { subject: "Study Material", weight: 6, diff: 1 }
        );
    }
    
    return foundTopics;
}

// 3. The Core Priority Algorithm (from your C++ logic)
function generatePlan() {
    const rawData = localStorage.getItem('studyMitraData');
    if (!rawData) return;

    let topics = JSON.parse(rawData);
    let daysLeft = 5; // You can make this an input

    // Priority = (Weight * 0.7) + (Difficulty * 0.3)
    topics.sort((a, b) => {
        let pA = (a.weight * 0.7) + (a.diff * 0.3);
        let pB = (b.weight * 0.7) + (b.diff * 0.3);
        return pB - pA;
    });

    renderPlanner(topics, daysLeft);
}

function renderPlanner(topics, days) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    
    let topicsPerDay = Math.ceil(topics.length / days);
    
    for (let i = 0; i < days; i++) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `<h3>Day ${i+1}</h3>`;
        
        let dailyTopics = topics.slice(i * topicsPerDay, (i + 1) * topicsPerDay);
        dailyTopics.forEach((t, index) => {
            const progress = Math.floor(Math.random() * 100); // Mock progress
            dayCard.innerHTML += `
                <div class="topic-item">
                    <div class="topic-header">
                        <span>• ${t.subject}</span>
                        <span class="difficulty ${getDifficultyClass(t.diff)}">${getDifficultyLabel(t.diff)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}% Complete</div>
                </div>
            `;
        });
        
        grid.appendChild(dayCard);
    }
    
    document.getElementById('score-val').innerText = "85"; // Mock prediction
}

function getDifficultyClass(diff) {
    if (diff <= 1) return 'easy';
    if (diff <= 2) return 'medium';
    return 'hard';
}

function getDifficultyLabel(diff) {
    if (diff <= 1) return 'Easy';
    if (diff <= 2) return 'Medium';
    return 'Hard';
}
// Streak Logic
function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('lastLoginDate');
    let currentStreak = parseInt(localStorage.getItem('studyStreak')) || 0;

    if (lastLogin === today) {
        // Already logged in today, do nothing
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastLogin === yesterday.toDateString()) {
            // Logged in yesterday? Increment streak!
            currentStreak++;
        } else {
            // Missed a day? Reset streak :(
            currentStreak = 1;
        }
        localStorage.setItem('lastLoginDate', today);
        localStorage.setItem('studyStreak', currentStreak);
    }
    
    document.getElementById('streakCount').innerText = `${currentStreak} Day Streak`;
}

// Timer Variables
let timerInterval;
let startTime;
let elapsedTime = 0;
let isRunning = false;
let sessionCount = parseInt(localStorage.getItem('sessionCount')) || 0;
let totalTime = parseInt(localStorage.getItem('totalTime')) || 0;

// Timer Functions
function startTimer() {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimer, 1000);
        isRunning = true;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    isRunning = false;
    updateTimerDisplay();
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    document.getElementById('timer-display').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Motivational Quotes
const quotes = [
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Study is not just about the hours you put in, but the effort you put in those hours.",
    "Your future self will thank you for every hour you study today.",
    "The expert in anything was once a beginner.",
    "Don't watch the clock; do what it does. Keep going.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Success doesn't come from what you do occasionally, it comes from what you do consistently."
];

function rotateQuote() {
    const quoteElement = document.getElementById('motivational-quote');
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteElement.style.opacity = '0';
    setTimeout(() => {
        quoteElement.textContent = `"${randomQuote}"`;
        quoteElement.style.opacity = '1';
    }, 500);
}

function formatTotalTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

function getLoggedInUser() {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch (e) {
        return { enrollment: stored };
    }
}

function requireLogin() {
    const user = getLoggedInUser();
    if (!user || !user.enrollment) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getActiveUserProfile() {
    const storedProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (storedProfile) return storedProfile;

    const user = getLoggedInUser();
    if (!user) {
        return {
            name: 'User',
            email: 'student@studymitra.com',
            enrollment: '',
            phone: '',
            course: '',
            college: '',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
        };
    }

    const profile = {
        name: user.name || `Student ${user.enrollment.slice(-4)}`,
        email: user.email || `${user.enrollment}@studymitra.com`,
        enrollment: user.enrollment,
        phone: '',
        course: '',
        college: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.enrollment)}`
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    return profile;
}

function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('active');
}

// User Menu Functions
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    const profile = document.querySelector('.user-profile-btn');
    
    menu.classList.toggle('active');
    profile.classList.toggle('active');
}

function openProfile() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('active');
    loadProfileData();
    toggleUserMenu();
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.remove('active');
}

function loadProfileData() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'User',
        email: 'student@studymitra.com',
        enrollment: '',
        phone: '',
        course: '',
        college: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
    };

    document.getElementById('profile-name').value = userProfile.name || '';
    document.getElementById('profile-email').value = userProfile.email || '';
    document.getElementById('profile-enrollment').value = userProfile.enrollment || '';
    document.getElementById('profile-phone').value = userProfile.phone || '';
    document.getElementById('profile-course').value = userProfile.course || '';
    document.getElementById('profile-college').value = userProfile.college || '';
    document.getElementById('avatar-preview').src = userProfile.avatar;
}

function saveProfile(event) {
    event.preventDefault();

    const userProfile = {
        name: document.getElementById('profile-name').value,
        email: document.getElementById('profile-email').value,
        enrollment: document.getElementById('profile-enrollment').value,
        phone: document.getElementById('profile-phone').value,
        course: document.getElementById('profile-course').value,
        college: document.getElementById('profile-college').value,
        avatar: document.getElementById('avatar-preview').src
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // Update the UI with the new profile data
    document.getElementById('user-name').textContent = userProfile.name;
    document.getElementById('menu-user-name').textContent = userProfile.name;
    document.querySelector('.user-avatar').src = userProfile.avatar;

    // Show success message
    showSuccessMessage('Profile updated successfully!');

    // Close modal after 1.5 seconds
    setTimeout(() => {
        closeProfileModal();
    }, 1500);
}

function randomizeAvatar() {
    const randomId = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}`;
    document.getElementById('avatar-preview').src = newAvatarUrl;
}

function showSuccessMessage(message) {
    // Create a temporary success message
    const form = document.getElementById('profile-form');
    const existingMessage = form.querySelector('.profile-success-message');
    
    if (existingMessage) {
        existingMessage.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'profile-success-message show';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    form.insertBefore(successDiv, form.firstChild);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function openSettings() {
    showPage('profile');
    toggleUserMenu();
}

function openProfileEditModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('active');
    loadProfileData();
}



function downloadData() {
    const userData = {
        profile: JSON.parse(localStorage.getItem('userProfile')),
        settings: JSON.parse(localStorage.getItem('userSettings')),
        stats: JSON.parse(localStorage.getItem('userStats')),
        studyData: JSON.parse(localStorage.getItem('studyMitraData')),
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studymitra-data-' + new Date().getTime() + '.json';
    link.click();
    
    showSuccessMessage('Your data has been downloaded!');
}

function clearAllData() {
    if (confirm('⚠️ WARNING: This will permanently delete ALL your data including profile, settings, and study progress. This action cannot be undone. Are you sure?')) {
        if (confirm('Are you REALLY sure? Please confirm this irreversible action.')) {
            localStorage.clear();
            showSuccessMessage('All data cleared! Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
}

function openHelp() {
    alert('Help & Support center coming soon!');
    toggleUserMenu();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionCount');
        localStorage.removeItem('totalTime');
        window.location.href = 'login.html';
    }
}

// Close menus when clicking outside
document.addEventListener('click', function(event) {
    // Handle notifications panel
    const notificationPanel = document.getElementById('notification-panel');
    const notificationBell = document.querySelector('.notification-bell');
    
    if (!notificationPanel.contains(event.target) && !notificationBell.contains(event.target)) {
        notificationPanel.classList.remove('active');
    }
    
    // Handle user menu
    const userMenu = document.getElementById('user-menu');
    const userProfile = document.querySelector('.user-profile-btn');
    
    if (!userMenu.contains(event.target) && !userProfile.contains(event.target)) {
        userMenu.classList.remove('active');
        userProfile.classList.remove('active');
    }
});

// Call this function whenever the dashboard loads
window.onload = function() {
    updateStreak();
    
    // Load saved user profile
    const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'User',
        email: 'student@studymitra.com',
        enrollment: '',
        phone: '',
        course: '',
        college: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
    };
    
    // Update navbar with user profile
    document.getElementById('user-name').textContent = userProfile.name;
    document.getElementById('menu-user-name').textContent = userProfile.name;
    document.querySelector('.user-avatar').src = userProfile.avatar;
    
    // Load settings on page load
    loadSettings();
    
    // Rotate quote periodically
    setInterval(rotateQuote, 10000); // Rotate every 10 seconds
};

// Load Settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('userSettings')) || {
        language: 'english',
        timezone: 'IST',
        sessionDuration: '60',
        emailNotifications: true,
        studyReminders: true,
        milestoneNotifications: true,
        communityNotifications: false,
        profileVisibility: false,
        dataAnalytics: true,
        compactView: false,
        theme: 'light'
    };
    
    // Apply settings to form elements
    const langEl = document.getElementById('language-setting');
    const tzEl = document.getElementById('timezone-setting');
    const durationEl = document.getElementById('session-duration');
    
    if (langEl) langEl.value = settings.language;
    if (tzEl) tzEl.value = settings.timezone;
    if (durationEl) durationEl.value = settings.sessionDuration;
    
    const emailNotifEl = document.getElementById('email-notifications');
    const studyRemindEl = document.getElementById('study-reminders');
    const milestoneNotifEl = document.getElementById('milestone-notifications');
    const communityNotifEl = document.getElementById('community-notifications');
    const profileVisEl = document.getElementById('profile-visibility');
    const dataAnalyticsEl = document.getElementById('data-analytics');
    const compactViewEl = document.getElementById('compact-view');
    
    if (emailNotifEl) emailNotifEl.checked = settings.emailNotifications;
    if (studyRemindEl) studyRemindEl.checked = settings.studyReminders;
    if (milestoneNotifEl) milestoneNotifEl.checked = settings.milestoneNotifications;
    if (communityNotifEl) communityNotifEl.checked = settings.communityNotifications;
    if (profileVisEl) profileVisEl.checked = settings.profileVisibility;
    if (dataAnalyticsEl) dataAnalyticsEl.checked = settings.dataAnalytics;
    if (compactViewEl) compactViewEl.checked = settings.compactView;
    
    // Set theme
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(el => el.classList.remove('active'));
    if (settings.theme === 'dark' && themeOptions[1]) {
        themeOptions[1].classList.add('active');
    } else if (settings.theme === 'auto' && themeOptions[2]) {
        themeOptions[2].classList.add('active');
    } else if (themeOptions[0]) {
        themeOptions[0].classList.add('active');
    }
    
    // Set accent color
    const accentColor = localStorage.getItem('accentColor') || '#00A3B5';
    document.documentElement.style.setProperty('--accent', accentColor);
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(el => el.classList.remove('active'));
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Help & Support function
function openHelp() {
    alert('Help & Support center coming soon!');
    toggleUserMenu();
}

// --- Settings Page Logic ---

function toggleDarkMode() {
    const el = document.getElementById('darkModeToggle');
    const isDark = el && el.checked;
    if (isDark) {
        document.body.classList.add('dark-theme'); // You can define dark-theme colors in CSS
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
    if (typeof showSuccessMessage === 'function') showSuccessMessage(`Theme updated to ${isDark ? 'Dark' : 'Light'} mode`);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Toggle theme from the top-nav button (keeps backward compatibility)
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Set midnight accent when dark, restore or keep when light
    if (isDark) {
        document.documentElement.style.setProperty('--accent', '#00D1E8');
        document.documentElement.style.setProperty('--accent-2', '#00A6FF');
        localStorage.setItem('accentColor', '#00D1E8');
    } else {
        const accentColor = localStorage.getItem('accentColor') || '#00D1E8';
        document.documentElement.style.setProperty('--accent', accentColor);
    }

    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (typeof showSuccessMessage === 'function') showSuccessMessage(`Theme updated to ${isDark ? 'Dark' : 'Light'} mode`);
}

function confirmReset() {
    const confirmation = confirm("Are you sure? This will delete all your study progress and settings. This action cannot be undone.");
    if (confirmation) {
        localStorage.clear();
        showNotification("All data cleared. Restarting...", "error");
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

function handleLogout() {
    // Clear specific session data but maybe keep the profile? 
    // Or clear everything for a full logout.
    localStorage.removeItem('user');
    showNotification("Logged out successfully", "info");
    setTimeout(() => {
        window.location.href = 'Login.html';
    }, 1000);
}

// Update the window.onload to check for saved theme
const originalOnload = window.onload;
window.onload = function() {
    if (!requireLogin()) return;
    if (originalOnload) originalOnload();
    
    const userProfile = getActiveUserProfile();
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${userProfile.name}!`;
    document.getElementById('user-name').textContent = userProfile.name;
    document.getElementById('menu-user-name').textContent = userProfile.name;
    document.querySelector('.user-avatar').src = userProfile.avatar;
    const emailEl = document.querySelector('.user-email');
    if (emailEl) emailEl.textContent = userProfile.email;

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) darkToggle.checked = true;
        document.body.classList.add('dark-theme');
    }
    
    // Load initial data for new features
    loadGoals();
    loadMaterials();
    loadQuizzes();
};

// ==================== GOALS MANAGEMENT ====================

function openAddGoalModal() {
    document.getElementById('goal-modal').classList.add('active');
    document.getElementById('goal-title').focus();
}

function closeGoalModal() {
    document.getElementById('goal-modal').classList.remove('active');
    document.getElementById('goal-title').value = '';
    document.getElementById('goal-subject').value = '';
    document.getElementById('goal-deadline').value = '';
    document.getElementById('goal-priority').value = 'medium';
    document.getElementById('goal-description').value = '';
}

function saveGoal(event) {
    event.preventDefault();
    
    const goal = {
        id: Date.now(),
        title: document.getElementById('goal-title').value,
        subject: document.getElementById('goal-subject').value,
        deadline: document.getElementById('goal-deadline').value,
        priority: document.getElementById('goal-priority').value,
        description: document.getElementById('goal-description').value,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    let goals = JSON.parse(localStorage.getItem('studyGoals')) || [];
    goals.push(goal);
    localStorage.setItem('studyGoals', JSON.stringify(goals));
    
    closeGoalModal();
    loadGoals();
    showSuccessMessage('Goal created successfully!');
}

function loadGoals() {
    const goals = JSON.parse(localStorage.getItem('studyGoals')) || [];
    const container = document.getElementById('goals-container');
    
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No goals yet. Create one to get started!</p>';
        return;
    }
    
    container.innerHTML = goals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <h3 class="goal-title">${goal.title}</h3>
                <span class="goal-priority ${goal.priority}">${goal.priority}</span>
            </div>
            <span class="goal-subject">${goal.subject}</span>
            <div class="goal-progress">
                <div class="goal-progress-label">
                    <span>Progress</span>
                    <span>${goal.progress}%</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>
            <div class="goal-deadline">
                <i class="fas fa-calendar"></i>
                <span>${new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 12px;">${goal.description}</p>
            <div class="goal-actions">
                <button onclick="updateGoalProgress(${goal.id})">Update</button>
                <button onclick="deleteGoal(${goal.id})" class="danger-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateGoalProgress(goalId) {
    const goals = JSON.parse(localStorage.getItem('studyGoals')) || [];
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
        const newProgress = prompt(`Update progress for "${goal.title}" (0-100):`, goal.progress);
        if (newProgress !== null) {
            goal.progress = Math.min(100, Math.max(0, parseInt(newProgress)));
            localStorage.setItem('studyGoals', JSON.stringify(goals));
            loadGoals();
            showSuccessMessage('Goal progress updated!');
        }
    }
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        let goals = JSON.parse(localStorage.getItem('studyGoals')) || [];
        goals = goals.filter(g => g.id !== goalId);
        localStorage.setItem('studyGoals', JSON.stringify(goals));
        loadGoals();
        showSuccessMessage('Goal deleted!');
    }
}

// ==================== STUDY MATERIALS ====================

function openAddMaterialModal() {
    document.getElementById('material-modal').classList.add('active');
    document.getElementById('material-title').focus();
}

function closeMaterialModal() {
    document.getElementById('material-modal').classList.remove('active');
    document.getElementById('material-title').value = '';
    document.getElementById('material-type').value = '';
    document.getElementById('material-subject').value = '';
    document.getElementById('material-content').value = '';
    document.getElementById('material-tags').value = '';
}

function saveMaterial(event) {
    event.preventDefault();
    
    const material = {
        id: Date.now(),
        title: document.getElementById('material-title').value,
        type: document.getElementById('material-type').value,
        subject: document.getElementById('material-subject').value,
        content: document.getElementById('material-content').value,
        tags: document.getElementById('material-tags').value.split(',').map(t => t.trim()),
        createdAt: new Date().toISOString()
    };
    
    let materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
    materials.push(material);
    localStorage.setItem('studyMaterials', JSON.stringify(materials));
    
    closeMaterialModal();
    loadMaterials();
    showSuccessMessage('Material added successfully!');
}

function loadMaterials() {
    const materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
    displayMaterials(materials);
}

function displayMaterials(materials) {
    const container = document.getElementById('materials-container');
    
    if (!container) return;
    
    if (materials.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No materials yet. Add your first study material!</p>';
        return;
    }
    
    container.innerHTML = materials.map(material => {
        let content = material.content;
        
        // Function to detect and make URLs clickable
        function makeLinksClickable(text) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, (url) => {
                // Ensure the URL has a protocol
                let cleanUrl = url;
                if (!cleanUrl.match(/^https?:\/\//)) {
                    cleanUrl = 'https://' + cleanUrl;
                }
                return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="material-link">${url}</a>`;
            });
        }
        
        // If it's a link type material, make the entire content clickable
        if (material.type === 'link') {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = content.match(urlRegex);
            if (urls && urls.length > 0) {
                const firstUrl = urls[0];
                let cleanUrl = firstUrl;
                if (!cleanUrl.match(/^https?:\/\//)) {
                    cleanUrl = 'https://' + cleanUrl;
                }
                content = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="material-link main-link">
                    <i class="fas fa-external-link-alt"></i> ${material.title} - Open Resource
                </a>`;
                if (urls.length > 1) {
                    content += '<br><small>Additional links: ' + makeLinksClickable(content.replace(firstUrl, '')) + '</small>';
                }
            } else {
                content = makeLinksClickable(content);
            }
        } else {
            // For other types, make any URLs in the content clickable
            content = makeLinksClickable(content);
        }
        
        return `
        <div class="material-card">
            <span class="material-badge">${material.type.toUpperCase()}</span>
            <h3 class="material-title">${material.title}</h3>
            <p class="material-subject">${material.subject}</p>
            <div class="material-content">${content}</div>
            ${material.summary ? `
            <div class="material-summary">
                <h4><i class="fas fa-lightbulb"></i> Summary</h4>
                <p>${material.summary}</p>
                ${material.lastSummarized ? `<small>Last summarized: ${new Date(material.lastSummarized).toLocaleDateString()}</small>` : ''}
            </div>
            ` : ''}
            <div class="material-tags">
                ${material.tags.map(tag => `<span class="material-tag">${tag}</span>`).join('')}
            </div>
            <div class="material-actions">
                ${material.type === 'link' || material.content.match(/(https?:\/\/[^\s]+)/) ? `<button onclick="summarizeMaterial(${material.id})" class="summarize-btn">
                    <i class="fas fa-brain"></i> Summarize
                </button>` : ''}
                <button onclick="editMaterial(${material.id})">Edit</button>
                <button onclick="deleteMaterial(${material.id})" class="danger-btn">Delete</button>
            </div>
        </div>
        `;
    }).join('');
}

function searchMaterials() {
    const searchTerm = document.getElementById('material-search').value.toLowerCase();
    const materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
    
    const filtered = materials.filter(m => 
        m.title.toLowerCase().includes(searchTerm) || 
        m.subject.toLowerCase().includes(searchTerm) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    displayMaterials(filtered);
}

function filterMaterials() {
    const filterType = document.getElementById('material-type-filter').value;
    const materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
    
    const filtered = filterType ? materials.filter(m => m.type === filterType) : materials;
    displayMaterials(filtered);
}

function deleteMaterial(materialId) {
    if (confirm('Are you sure you want to delete this material?')) {
        let materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
        materials = materials.filter(m => m.id !== materialId);
        localStorage.setItem('studyMaterials', JSON.stringify(materials));
        loadMaterials();
        showSuccessMessage('Material deleted!');
    }
}

function editMaterial(materialId) {
    alert('Edit feature coming soon!');
}

// Summarize webpage content
async function summarizeMaterial(materialId) {
    const materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
    const material = materials.find(m => m.id === materialId);
    
    if (!material) return;
    
    // Find the URL in the content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = material.content.match(urlRegex);
    if (!urls || urls.length === 0) {
        alert('No valid URL found in this material to summarize.');
        return;
    }
    
    const url = urls[0];
    
    // Show loading state
    const button = event.target.closest('.summarize-btn');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...';
    button.disabled = true;
    
    try {
        const summary = await generateWebpageSummary(url);
        
        // Update material with summary
        material.summary = summary;
        material.lastSummarized = new Date().toISOString();
        localStorage.setItem('studyMaterials', JSON.stringify(materials));
        
        // Refresh display
        loadMaterials();
        
        showSuccessMessage('Summary generated successfully!');
    } catch (error) {
        console.error('Summarization error:', error);
        const errorMessage = error.message.includes('CORS') ?
            'Unable to access webpage due to browser security restrictions. Try a different URL or check the browser console for details.' :
            `Failed to generate summary: ${error.message}`;
        alert(errorMessage);
    } finally {
        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Generate summary from webpage
async function generateWebpageSummary(url) {
    console.log('Attempting to summarize URL:', url);

    try {
        // Try multiple CORS proxies
        const proxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://thingproxy.freeboard.io/fetch/${url}`
        ];

        let html = null;
        let lastError = null;

        for (const proxyUrl of proxies) {
            try {
                console.log('Trying proxy:', proxyUrl);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                html = data.contents || data.content || data;
                console.log('Successfully fetched content from proxy');
                break;
            } catch (error) {
                console.log('Proxy failed:', proxyUrl, error.message);
                lastError = error;
                continue;
            }
        }

        if (!html) {
            throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
        }

        // Extract text content from HTML
        const textContent = extractTextFromHTML(html);
        console.log('Extracted text length:', textContent.length);

        if (textContent.length < 100) {
            throw new Error('Content too short or unable to extract meaningful text');
        }

        // Generate summary
        const summary = createSummary(textContent);
        console.log('Generated summary:', summary);

        return summary;
    } catch (error) {
        console.error('Error in generateWebpageSummary:', error);

        // Try a simpler approach - just extract title and meta description
        try {
            console.log('Trying fallback approach...');
            const fallbackSummary = await createFallbackSummary(url);
            return fallbackSummary;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
    }
}

// Extract readable text from HTML
function extractTextFromHTML(html) {
    try {
        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove unwanted elements
        const unwantedSelectors = [
            'script', 'style', 'nav', 'header', 'footer', 'aside',
            'noscript', 'iframe', 'svg', 'img', 'video', 'audio',
            '.ad', '.advertisement', '.sidebar', '.menu', '.navigation',
            '[class*="ad"]', '[class*="banner"]', '[class*="popup"]'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = tempDiv.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Try to find main content areas
        const contentSelectors = [
            'main', 'article', '.content', '.post', '.entry',
            '.article-content', '.post-content', '#content', '#main'
        ];

        let contentElement = tempDiv;
        for (const selector of contentSelectors) {
            const found = tempDiv.querySelector(selector);
            if (found && found.textContent.trim().length > 200) {
                contentElement = found;
                break;
            }
        }

        // Get text content
        let text = contentElement.textContent || contentElement.innerText || '';

        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();

        // Remove excessive whitespace and normalize
        text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

        // Remove very short fragments and clean up
        text = text.split(/[.!?]+/)
            .filter(sentence => sentence.trim().length > 10)
            .join('. ');

        return text.trim();
    } catch (error) {
        console.error('Error extracting text from HTML:', error);
        // Fallback: basic text extraction
        return html.replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 1000);
    }
}

// Create a simple summary from text
function createSummary(text) {
    if (!text || text.length < 100) {
        return 'Content too short to summarize.';
    }
    
    // Simple summarization: extract first few sentences and key points
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Take first 3-5 sentences
    const summarySentences = sentences.slice(0, Math.min(4, sentences.length));
    
    let summary = summarySentences.join('. ').trim();
    
    // Add ellipsis if truncated
    if (sentences.length > 4) {
        summary += '...';
    }
    
    // If summary is too short, try to extract more meaningful content
    if (summary.length < 200 && sentences.length > 4) {
        const additionalSentences = sentences.slice(4, 8);
        summary += ' ' + additionalSentences.join('. ').trim() + '...';
    }
    
    // Limit summary length
    if (summary.length > 500) {
        summary = summary.substring(0, 500) + '...';
    }
    
    return summary || 'Unable to generate meaningful summary from the content.';
}

// Fallback summary creation
async function createFallbackSummary(url) {
    try {
        // For now, create a basic summary based on URL
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;

        let summary = `This is a link to ${domain}`;

        if (path && path !== '/') {
            summary += ` at path: ${path}`;
        }

        summary += '. Unable to fetch full content due to CORS restrictions, but you can visit the link directly to read the full content.';

        return summary;
    } catch (error) {
        return `Link to: ${url}. Content preview not available due to technical limitations.`;
    }
}

// ==================== QUIZ MANAGEMENT ====================

function openAddQuizModal() {
    document.getElementById('quiz-modal').classList.add('active');
    document.getElementById('quiz-title').focus();
}

function closeQuizModal() {
    document.getElementById('quiz-modal').classList.remove('active');
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-subject').value = '';
    document.getElementById('quiz-question-count').value = '5';
    document.getElementById('quiz-time-limit').value = '30';
    document.getElementById('quiz-difficulty').value = 'medium';
    document.getElementById('quiz-questions-container').innerHTML = '';
}

function addQuizQuestion() {
    const questionCount = parseInt(document.getElementById('quiz-question-count').value);
    const questionsContainer = document.getElementById('quiz-questions-container');
    
    if (questionsContainer.children.length < questionCount) {
        const questionIndex = questionsContainer.children.length + 1;
        const questionHtml = `
            <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <label>Question ${questionIndex}</label>
                <textarea placeholder="Enter question..." class="quiz-question-text" style="min-height: 60px; margin-bottom: 10px;"></textarea>
                <input type="text" placeholder="Option A" class="quiz-option">
                <input type="text" placeholder="Option B" class="quiz-option">
                <input type="text" placeholder="Option C" class="quiz-option">
                <input type="text" placeholder="Option D" class="quiz-option">
                <select class="quiz-correct-answer" style="margin-top: 10px;">
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
            </div>
        `;
        questionsContainer.innerHTML += questionHtml;
    }
}

function saveQuiz(event) {
    event.preventDefault();
    
    const quiz = {
        id: Date.now(),
        title: document.getElementById('quiz-title').value,
        subject: document.getElementById('quiz-subject').value,
        timeLimit: parseInt(document.getElementById('quiz-time-limit').value),
        difficulty: document.getElementById('quiz-difficulty').value,
        questions: [],
        createdAt: new Date().toISOString(),
        attempts: 0
    };
    
    let quizzes = JSON.parse(localStorage.getItem('studyQuizzes')) || [];
    quizzes.push(quiz);
    localStorage.setItem('studyQuizzes', JSON.stringify(quizzes));
    
    closeQuizModal();
    loadQuizzes();
    showSuccessMessage('Quiz created successfully!');
}

function loadQuizzes() {
    const quizzes = JSON.parse(localStorage.getItem('studyQuizzes')) || [];
    const container = document.getElementById('quizzes-container');
    
    if (!container) return;
    
    if (quizzes.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No quizzes yet. Create one to get started!</p>';
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <div class="quiz-header">
                <h3 class="quiz-title">${quiz.title}</h3>
            </div>
            <p class="quiz-subject">${quiz.subject}</p>
            <div class="quiz-stats">
                <div class="quiz-stat">
                    <span class="quiz-stat-value">${quiz.timeLimit}</span>
                    <span class="quiz-stat-label">Minutes</span>
                </div>
                <div class="quiz-stat">
                    <span class="quiz-stat-value">${quiz.attempts}</span>
                    <span class="quiz-stat-label">Attempts</span>
                </div>
                <div class="quiz-stat">
                    <span class="quiz-stat-value" style="font-size: 1rem;">${quiz.difficulty}</span>
                    <span class="quiz-stat-label">Level</span>
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <span class="quiz-difficulty ${quiz.difficulty}">${quiz.difficulty.toUpperCase()}</span>
            </div>
            <div class="quiz-actions">
                <button onclick="startQuiz(${quiz.id})">Start Quiz</button>
                <button onclick="deleteQuiz(${quiz.id})" class="danger-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

function startQuiz(quizId) {
    const quizzes = JSON.parse(localStorage.getItem('studyQuizzes')) || [];
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (quiz) {
        document.getElementById('quiz-taking-title').textContent = quiz.title;
        document.getElementById('quiz-taking-modal').classList.add('active');
        startQuizTimer(quiz.timeLimit);
    }
}

function closeQuizTakingModal() {
    if (confirm('Are you sure you want to quit this quiz?')) {
        document.getElementById('quiz-taking-modal').classList.remove('active');
    }
}

function startQuizTimer(minutes) {
    let timeLeft = minutes * 60;
    const timerEl = document.getElementById('quiz-timer');
    
    const interval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            submitQuizAttempt({preventDefault: () => {}});
        }
        timeLeft--;
    }, 1000);
}

function submitQuizAttempt(event) {
    event.preventDefault();
    alert('Quiz submitted! Score will be calculated soon.');
    document.getElementById('quiz-taking-modal').classList.remove('active');
    loadQuizzes();
}

function deleteQuiz(quizId) {
    if (confirm('Are you sure you want to delete this quiz?')) {
        let quizzes = JSON.parse(localStorage.getItem('studyQuizzes')) || [];
        quizzes = quizzes.filter(q => q.id !== quizId);
        localStorage.setItem('studyQuizzes', JSON.stringify(quizzes));
        loadQuizzes();
        showSuccessMessage('Quiz deleted!');
    }
}

function switchQuizTab(tab) {
    document.querySelectorAll('.quiz-tab-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.quiz-tab-btn').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById('quiz-' + tab).classList.add('active');
    event.target.classList.add('active');
}

// Modal close on outside click
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Test function for debugging summarization (can be called from browser console)
window.testSummarization = async function(url) {
    console.log('Testing summarization for:', url);
    try {
        const summary = await generateWebpageSummary(url);
        console.log('Summary result:', summary);
        return summary;
    } catch (error) {
        console.error('Test failed:', error);
        return null;
    }
};

// ==================== NEW FEATURES: QUICK PASTE & AUTO-QUIZ ====================

// Feature 1: Quick Paste Notes with Auto-Summarization
async function quickPasteNotes() {
    const notesTextarea = document.getElementById('quick-paste-notes');
    const content = notesTextarea.value.trim();
    
    if (!content) {
        alert('Please paste some notes first!');
        return;
    }
    
    if (content.length < 50) {
        alert('Please paste more content (at least 50 characters) to generate a meaningful summary!');
        return;
    }
    
    try {
        // Use simple approach with defaults for browser compatibility
        const title = 'Study Notes - ' + new Date().toLocaleDateString();
        const subject = 'General Study Material';
        
        // Generate summary from the pasted notes
        const summary = generateSummaryFromText(content);
        
        // Create material object
        const material = {
            id: Date.now(),
            title: title,
            type: 'notes',
            subject: subject,
            content: content,
            summary: summary, // Auto-generated summary
            tags: ['pasted', 'auto-summarized'],
            createdAt: new Date().toISOString(),
            lastSummarized: new Date().toISOString()
        };
        
        // Save to localStorage
        let materials = JSON.parse(localStorage.getItem('studyMaterials')) || [];
        materials.push(material);
        localStorage.setItem('studyMaterials', JSON.stringify(materials));
        
        // Clear the textarea
        notesTextarea.value = '';
        
        // Reload materials display
        loadMaterials();
        
        showSuccessMessage(`✨ Notes added with auto-generated summary! "${title}"`);
    } catch (error) {
        console.error('Error in quickPasteNotes:', error);
        alert('Error processing notes: ' + error.message);
    }
}

// Feature 2: Auto-Generate Quiz from File Upload
async function autoGenerateQuizFromFile() {
    const fileInput = document.getElementById('quiz-file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first!');
        return;
    }
    
    try {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
        
        // Extract text from file
        const fileContent = await extractTextFromFile(file);
        
        if (fileContent.length < 100) {
            throw new Error('File content too short. Please upload a file with more content.');
        }
        
        console.log('Extracted file content length:', fileContent.length);
        
        // Generate quiz questions from content
        const questions = generateQuizQuestionsFromText(fileContent);
        
        if (questions.length === 0) {
            throw new Error('Could not generate questions from the file content.');
        }
        
        // Add questions to the quiz form
        questions.forEach(question => {
            addAutoGeneratedQuestion(question);
        });
        
        // Clear file input
        fileInput.value = '';
        
        // Show success
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        showSuccessMessage(`✨ Generated ${questions.length} questions from the file! You can add more or modify them.`);
    } catch (error) {
        console.error('Error in autoGenerateQuizFromFile:', error);
        alert('Error processing file: ' + error.message);
        event.target.disabled = false;
        event.target.innerHTML = event.target.innerHTML.replace(/<i.*<\/i>/, '<i class="fas fa-magic"></i>');
    }
}

// Extract text content from uploaded file
async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const content = e.target.result;
                
                if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                    // For text files
                    resolve(content);
                } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    // For PDF files, we need pdf.js library
                    if (typeof pdfjsLib === 'undefined') {
                        reject(new Error('PDF library not loaded'));
                        return;
                    }
                    
                    const pdf = await pdfjsLib.getDocument({data: content}).promise;
                    let text = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        text += textContent.items.map(item => item.str).join(' ') + ' ';
                    }
                    
                    resolve(text);
                } else {
                    reject(new Error('Unsupported file type. Please upload a .txt or .pdf file.'));
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
}

// Generate quiz questions from text content
function generateQuizQuestionsFromText(text) {
    const questions = [];
    
    try {
        // Split text into paragraphs
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
        
        // Extract sentences
        const sentences = text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 30 && s.length < 200)
            .slice(0, 15); // Limit to first 15 sentences
        
        // Generate questions from sentences
        sentences.forEach((sentence, index) => {
            if (index % 3 === 0) { // Generate a question every 3 sentences
                // Extract key terms (capitalize words)
                const words = sentence.split(/\s+/)
                    .filter(w => w.length > 4)
                    .slice(0, 5);
                
                if (words.length > 2) {
                    // Question 1: Definition question
                    questions.push({
                        text: `Based on the material, which statement best describes "${words.join(' ')}"?`,
                        options: [
                            sentence.substring(0, 80) + '...',
                            generateRandomOption(),
                            generateRandomOption(),
                            generateRandomOption()
                        ],
                        correct: 'A'
                    });
                    
                    // Question 2: True/False related
                    if (questions.length < 10) {
                        questions.push({
                            text: `According to the content, is the following true? "${sentence.substring(0, 100)}"?`,
                            options: [
                                'True',
                                'False',
                                'Cannot be determined',
                                'Partially true'
                            ],
                            correct: 'A'
                        });
                    }
                }
            }
        });
        
        // If we don't have enough questions, add more
        if (questions.length < 5) {
            const additionalQuestions = [
                {
                    text: 'What is the main focus of this material?',
                    options: [
                        'Understanding key concepts',
                        'Mathematical calculations',
                        'Practical applications',
                        generateRandomOption()
                    ],
                    correct: 'A'
                },
                {
                    text: 'Based on the content, which approach is most important?',
                    options: [
                        'Theoretical understanding',
                        'Practical implementation',
                        'Both equally',
                        generateRandomOption()
                    ],
                    correct: 'C'
                }
            ];
            
            questions.push(...additionalQuestions.slice(0, 5 - questions.length));
        }
        
        return questions.slice(0, 10); // Limit to 10 questions
    } catch (error) {
        console.error('Error generating questions:', error);
        return [];
    }
}

// Helper function to generate random distractors
function generateRandomOption() {
    const options = [
        'An alternative approach',
        'A different methodology',
        'Another perspective',
        'An additional consideration',
        'A secondary factor',
        'A complementary element',
        'A supportive mechanism',
        'An ancillary aspect'
    ];
    return options[Math.floor(Math.random() * options.length)];
}

// Add auto-generated question to quiz form
function addAutoGeneratedQuestion(question) {
    const questionCount = parseInt(document.getElementById('quiz-question-count').value);
    const questionsContainer = document.getElementById('quiz-questions-container');
    
    // Auto-increase question count if needed
    if (questionsContainer.children.length >= questionCount) {
        document.getElementById('quiz-question-count').value = questionsContainer.children.length + 1;
    }
    
    const questionIndex = questionsContainer.children.length + 1;
    const questionHtml = `
        <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
            <label><i class="fas fa-auto"></i> Auto-Generated Question ${questionIndex}</label>
            <textarea placeholder="Enter question..." class="quiz-question-text" style="min-height: 60px; margin-bottom: 10px;">${question.text}</textarea>
            <input type="text" placeholder="Option A" class="quiz-option" value="${question.options[0] || ''}">
            <input type="text" placeholder="Option B" class="quiz-option" value="${question.options[1] || ''}">
            <input type="text" placeholder="Option C" class="quiz-option" value="${question.options[2] || ''}">
            <input type="text" placeholder="Option D" class="quiz-option" value="${question.options[3] || ''}">
            <select class="quiz-correct-answer" style="margin-top: 10px;">
                <option value="">Select correct answer</option>
                <option value="A" ${question.correct === 'A' ? 'selected' : ''}>A</option>
                <option value="B" ${question.correct === 'B' ? 'selected' : ''}>B</option>
                <option value="C" ${question.correct === 'C' ? 'selected' : ''}>C</option>
                <option value="D" ${question.correct === 'D' ? 'selected' : ''}>D</option>
            </select>
            <small style="color: var(--text-secondary); display: block; margin-top: 8px;">You can edit this question before saving the quiz</small>
        </div>
    `;
    questionsContainer.innerHTML += questionHtml;
}

// Generate summary from plain text
function generateSummaryFromText(text) {
    if (!text || text.length < 50) {
        return 'Summary not available - content too short.';
    }
    
    // Split into sentences
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);
    
    if (sentences.length === 0) {
        return text.substring(0, 300) + '...';
    }
    
    // Get first few sentences as summary
    const summaryLength = Math.min(4, Math.ceil(sentences.length / 3));
    const summarySentences = sentences.slice(0, summaryLength);
    
    let summary = summarySentences.join('. ').trim();
    
    if (sentences.length > summaryLength) {
        summary += '. ';
        
        // Add 2 more sentences from middle of text
        const middleStart = Math.floor(sentences.length / 2);
        const middleSentences = sentences.slice(middleStart, middleStart + 2);
        summary += middleSentences.join('. ').trim() + '...';
    }
    
    // Limit to 500 characters
    if (summary.length > 500) {
        summary = summary.substring(0, 500) + '...';
    }
    
    return summary || 'Unable to generate summary.';
}