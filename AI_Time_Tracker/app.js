// ======================================================
// 1. FIREBASE CONFIGURATION & INIT
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyDhJEJQ85sEI7jfmPCxw7mf1Vu7VOkI8rg",
  authDomain: "time-tracker-7e16b.firebaseapp.com",
  projectId: "time-tracker-7e16b",
  storageBucket: "time-tracker-7e16b.firebasestorage.app",
  messagingSenderId: "330467645964",
  appId: "1:330467645964:web:f9a9acc3e70c3879ebec29"
};

// Initialize Firebase (Compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ======================================================
// 2. STATE MANAGEMENT
// ======================================================
let currentUser = null;
let currentDate = new Date().toISOString().split('T')[0]; // Default to today: "YYYY-MM-DD"
let activities = [];
let chartInstance = null;

// DOM Elements
const datePicker = document.getElementById('date-picker');
const activityList = document.getElementById('activity-list');
const progressBar = document.getElementById('progress-bar');
const totalMinutesEl = document.getElementById('total-minutes');
const minsLeftEl = document.getElementById('mins-left');

// Set Date Picker default to today
datePicker.value = currentDate;
datePicker.addEventListener('change', (e) => {
    currentDate = e.target.value;
    loadActivities(); // Reload data when date changes
});

// ======================================================
// 3. AUTHENTICATION LOGIC
// ======================================================

// Toggle UI based on Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('greeting').innerText = `Hello, ${user.email.split('@')[0]}!`;
        loadActivities();
    } else {
        currentUser = null;
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }
});

// Login
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => alert(error.message));
});

// Signup
document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if(!email || !password) return alert("Please enter email and password first.");

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Account created! Logging you in..."))
        .catch((error) => alert(error.message));
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
});

// ======================================================
// 4. CORE APP LOGIC
// ======================================================

// Load Activities for selected date
function loadActivities() {
    if (!currentUser) return;

    // Reset UI while loading
    activityList.innerHTML = '<li class="text-center text-slate-400 py-4">Loading...</li>';
    
    const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(currentDate);

    docRef.onSnapshot((doc) => {
        if (doc.exists) {
            activities = doc.data().activities || [];
        } else {
            activities = [];
        }
        renderUI();
    });
}

// Add Activity
document.getElementById('activity-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('act-name').value;
    const category = document.getElementById('act-category').value;
    const duration = parseInt(document.getElementById('act-duration').value);

    // 1440 Validation Logic
    const currentTotal = activities.reduce((sum, item) => sum + item.duration, 0);
    
    if (currentTotal + duration > 1440) {
        alert(`Time Limit Exceeded! You only have ${1440 - currentTotal} minutes left.`);
        return;
    }

    const newActivity = {
        id: Date.now(),
        name,
        category,
        duration
    };

    // Update Firestore
    const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(currentDate);
    
    docRef.set({
        activities: firebase.firestore.FieldValue.arrayUnion(newActivity)
    }, { merge: true })
    .then(() => {
        document.getElementById('activity-form').reset();
    })
    .catch((err) => console.error("Error adding:", err));
});

// Delete Activity
window.deleteActivity = (id) => {
    const updatedActivities = activities.filter(a => a.id !== id);
    const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(currentDate);
    
    docRef.set({ activities: updatedActivities }); // Overwrite with filtered list
};

// Render List & Progress
function renderUI() {
    // 1. Calculate Stats
    const totalMinutes = activities.reduce((sum, item) => sum + item.duration, 0);
    const percentage = (totalMinutes / 1440) * 100;

    // 2. Update Progress Bar
    totalMinutesEl.innerText = totalMinutes;
    minsLeftEl.innerText = `${1440 - totalMinutes} mins left`;
    progressBar.style.width = `${percentage}%`;

    // Color code progress bar
    if(percentage > 90) progressBar.className = "h-3 rounded-full transition-all duration-500 bg-red-500";
    else if(percentage > 50) progressBar.className = "h-3 rounded-full transition-all duration-500 bg-yellow-400";
    else progressBar.className = "h-3 rounded-full transition-all duration-500 bg-indigo-500";

    // 3. Render List
    activityList.innerHTML = "";
    if (activities.length === 0) {
        activityList.innerHTML = '<li class="text-center text-slate-400 py-4 italic">No logs for today yet.</li>';
        return;
    }

    activities.forEach(act => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100";
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xs font-bold uppercase px-2 py-1 rounded bg-white text-slate-500 border border-slate-200">${act.category}</span>
                <span class="text-slate-700 font-medium">${act.name}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-sm font-bold text-slate-600">${act.duration}m</span>
                <button onclick="deleteActivity(${act.id})" class="text-red-400 hover:text-red-600 transition">
                    &times;
                </button>
            </div>
        `;
        activityList.appendChild(li);
    });

    // If Dashboard is currently open, refresh it
    if (!document.getElementById('analytics-view').classList.contains('hidden')) {
        analyzeDay(); 
    }
}

// ======================================================
// 5. ANALYTICS & AI FEATURES
// ======================================================

// Navigation Functions
window.showLogger = () => {
    document.getElementById('logger-view').classList.remove('hidden');
    document.getElementById('analytics-view').classList.add('hidden');
};

window.analyzeDay = () => {
    document.getElementById('logger-view').classList.add('hidden');
    document.getElementById('analytics-view').classList.remove('hidden');

    const noDataMsg = document.getElementById('no-data-msg');
    const chartContainer = document.querySelector('.grid'); // The charts container
    const aiInsight = document.getElementById('ai-insight');

    // Empty State Check
    if (activities.length === 0) {
        noDataMsg.classList.remove('hidden');
        chartContainer.classList.add('hidden');
        aiInsight.classList.add('hidden');
        return;
    }

    noDataMsg.classList.add('hidden');
    chartContainer.classList.remove('hidden');
    aiInsight.classList.remove('hidden');

    // 1. Prepare Data for Chart
    const categories = {};
    let workMinutes = 0;
    
    activities.forEach(act => {
        if (categories[act.category]) {
            categories[act.category] += act.duration;
        } else {
            categories[act.category] = act.duration;
        }
        if (act.category === 'Work' || act.category === 'Study') workMinutes += act.duration;
    });

    // 2. Render Pie Chart
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (chartInstance) chartInstance.destroy(); // Destroy old chart to prevent overlay

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });

    // 3. AI-Powered Insight Logic (Simulated)
    const aiText = document.getElementById('ai-text');
    const prodScore = document.getElementById('prod-score');
    
    // Calculate simple score
    const score = Math.min(Math.round((workMinutes / 60) * 10), 100);
    prodScore.innerText = score;

    // "AI" Logic for messages
    if (workMinutes > 600) {
        aiText.innerText = "⚠️ High Burnout Risk: You've worked over 10 hours! AI suggests taking a long break immediately.";
        document.getElementById('ai-insight').className = "bg-red-500 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 mb-4";
    } else if (workMinutes < 120 && activities.length > 0) {
        aiText.innerText = "💡 Tip: Your productivity is low today. Try the Pomodoro technique for the remaining hours.";
        document.getElementById('ai-insight').className = "bg-yellow-500 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 mb-4";
    } else {
        aiText.innerText = "✅ Good Balance: You are managing your time effectively. Keep it up!";
        document.getElementById('ai-insight').className = "bg-green-500 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 mb-4";
    }
};