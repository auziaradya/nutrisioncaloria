/**
 * Caloria - State Management, Authentication & Persistence Layer (MyFitnessPal-style Tracker)
 */

(function (window) {
    'use strict';

    // ==========================================
    // 1. STORAGE KEYS & DATA MODEL CONSTANTS
    // ==========================================
    const USERS_DB_KEY = 'caloria_users_db';
    const ACTIVE_USER_EMAIL_KEY = 'caloria_active_user';
    const DEFAULT_TEST_EMAIL = 'aprilya@gmail.com';
    const DEFAULT_TEST_PASS = '123456';

    const MEAL_CATEGORIES = [
        { id: 'Breakfast', icon: '☕', label: 'Sarapan', color: '#efebe9', targetRatio: 0.30 },
        { id: 'Lunch', icon: '🥪', label: 'Makan Siang', color: '#ffe0b2', targetRatio: 0.40 },
        { id: 'Dinner', icon: '🥗', label: 'Makan Malam', color: '#c8e6c9', targetRatio: 0.25 },
        { id: 'Snacks', icon: '🍎', label: 'Camilan', color: '#ffcdd2', targetRatio: 0.05 }
    ];

    // ==========================================
    // 2. CORE USER DATABASE & PERSISTENCE
    // ==========================================
    const CaloriaDB = {
        getAllUsers() {
            try {
                return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
            } catch (e) {
                console.error('Failed to parse users db:', e);
                return {};
            }
        },

        saveAllUsers(users) {
            try {
                localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
            } catch (e) {
                console.error('Failed to save users db:', e);
            }
        },

        getUser(email) {
            if (!email) return null;
            const users = this.getAllUsers();
            return users[email.toLowerCase().trim()] || null;
        },

        saveUser(user) {
            if (!user || !user.email) return;
            const normalizedEmail = user.email.toLowerCase().trim();
            const users = this.getAllUsers();
            users[normalizedEmail] = {
                ...users[normalizedEmail],
                ...user,
                updatedAt: new Date().toISOString()
            };
            this.saveAllUsers(users);
        },

        getActiveEmail() {
            return localStorage.getItem(ACTIVE_USER_EMAIL_KEY) || localStorage.getItem('userEmail') || '';
        },

        setActiveEmail(email) {
            if (email) {
                const normalized = email.toLowerCase().trim();
                localStorage.setItem(ACTIVE_USER_EMAIL_KEY, normalized);
                localStorage.setItem('userEmail', normalized);
                localStorage.setItem('sessionActive', '1');
            } else {
                localStorage.removeItem(ACTIVE_USER_EMAIL_KEY);
                localStorage.removeItem('sessionActive');
            }
        },

        initDefaultUserIfMissing() {
            const users = this.getAllUsers();
            const normalized = DEFAULT_TEST_EMAIL.toLowerCase();
            if (!users[normalized]) {
                const height = 170;
                const weight = 56;
                const bmiVal = weight / ((height / 100) ** 2);
                const bmi = parseFloat(bmiVal.toFixed(1));
                const risk = calculateBmiRiskStatus(bmi);
                const rec = getCalorieRecommendation(bmi);

                // Pre-seed some historical entries for rich MyFitnessPal experience
                const pastDate1 = new Date();
                pastDate1.setDate(pastDate1.getDate() - 1);
                const dateStr1 = pastDate1.toISOString().slice(0, 10);

                const pastDate2 = new Date();
                pastDate2.setDate(pastDate2.getDate() - 2);
                const dateStr2 = pastDate2.toISOString().slice(0, 10);

                users[normalized] = {
                    email: DEFAULT_TEST_EMAIL,
                    name: 'Aprilya Kusumawardani',
                    password: DEFAULT_TEST_PASS,
                    height: height,
                    weight: weight,
                    bmi: bmi,
                    bmiStatus: risk.status,
                    obesityScore: risk.score,
                    obesityRiskLabel: risk.label,
                    obesityRiskExplanation: risk.explanation,
                    calorieTarget: rec.target,
                    calorieAdvice: rec.advice,
                    dietPlan: rec.label,
                    macroTargets: {
                        carbs: Math.round((rec.target * 0.50) / 4),
                        protein: Math.round((rec.target * 0.20) / 4),
                        fat: Math.round((rec.target * 0.30) / 9)
                    },
                    meals: [
                        {
                            id: 'meal_demo_1',
                            category: 'Breakfast',
                            name: 'Oatmeal Buah & Madu',
                            calories: 340,
                            carbs: 58,
                            protein: 10,
                            fat: 5,
                            date: `${dateStr1}T07:45:00.000Z`,
                            dateStr: dateStr1,
                            archived: true
                        },
                        {
                            id: 'meal_demo_2',
                            category: 'Lunch',
                            name: 'Nasi Merah & Ayam Bakar Dada',
                            calories: 520,
                            carbs: 64,
                            protein: 42,
                            fat: 11,
                            date: `${dateStr1}T12:30:00.000Z`,
                            dateStr: dateStr1,
                            archived: true
                        },
                        {
                            id: 'meal_demo_3',
                            category: 'Dinner',
                            name: 'Salad Sayur & Telur Rebus',
                            calories: 310,
                            carbs: 22,
                            protein: 18,
                            fat: 14,
                            date: `${dateStr1}T19:15:00.000Z`,
                            dateStr: dateStr1,
                            archived: true
                        },
                        {
                            id: 'meal_demo_4',
                            category: 'Breakfast',
                            name: 'Roti Gandum & Selai Kacang',
                            calories: 380,
                            carbs: 48,
                            protein: 14,
                            fat: 16,
                            date: `${dateStr2}T08:00:00.000Z`,
                            dateStr: dateStr2,
                            archived: true
                        },
                        {
                            id: 'meal_demo_5',
                            category: 'Lunch',
                            name: 'Soto Ayam & Nasi Putih',
                            calories: 490,
                            carbs: 62,
                            protein: 30,
                            fat: 12,
                            date: `${dateStr2}T13:00:00.000Z`,
                            dateStr: dateStr2,
                            archived: true
                        }
                    ],
                    activities: [
                        {
                            id: 'act_demo_1',
                            name: 'Jalan santai sore',
                            minutes: 25,
                            calories: 150,
                            date: `${dateStr1}T17:30:00.000Z`,
                            dateStr: dateStr1,
                            archived: true
                        },
                        {
                            id: 'act_demo_2',
                            name: 'Yoga ringan',
                            minutes: 20,
                            calories: 90,
                            date: `${dateStr2}T06:30:00.000Z`,
                            dateStr: dateStr2,
                            archived: true
                        }
                    ],
                    weightHistory: [
                        {
                            date: dateStr2,
                            weight: 56.5,
                            height: 170,
                            bmi: 19.6,
                            timestamp: `${dateStr2}T07:00:00.000Z`
                        },
                        {
                            date: dateStr1,
                            weight: 56.2,
                            height: 170,
                            bmi: 19.4,
                            timestamp: `${dateStr1}T07:00:00.000Z`
                        },
                        {
                            date: getTodayDate(),
                            weight: 56.0,
                            height: 170,
                            bmi: 19.4,
                            timestamp: new Date().toISOString()
                        }
                    ],
                    createdAt: new Date().toISOString(),
                    coachActionsDone: 2
                };
                this.saveAllUsers(users);
            }
        }
    };

    // Initialize default demo user immediately
    CaloriaDB.initDefaultUserIfMissing();

    // ==========================================
    // 3. NUTRITION & BMI CALCULATIONS (MyFitnessPal Style)
    // ==========================================
    function calculateBmiRiskStatus(bmi) {
        const numBmi = parseFloat(bmi) || 0;
        if (numBmi < 18.5) {
            return {
                bmi: numBmi,
                status: 'Kurus',
                category: 'Underweight',
                score: 10,
                label: 'Risiko rendah',
                explanation: 'Risiko obesitas rendah karena BMI Anda di bawah kisaran normal (18,5 - 24,9).'
            };
        }
        if (numBmi < 25.0) {
            return {
                bmi: numBmi,
                status: 'Normal',
                category: 'Normal',
                score: 20,
                label: 'Risiko normal',
                explanation: 'BMI normal berarti risiko obesitas tetap normal, pertahankan pola makan seimbang.'
            };
        }
        if (numBmi < 30.0) {
            return {
                bmi: numBmi,
                status: 'Kelebihan berat badan',
                category: 'Overweight',
                score: 55,
                label: 'Risiko sedang',
                explanation: 'Anda berada di kategori overweight dengan seharusnya BMI kisaran normal (18,5 - 24,9), perlu sedikit pengaturan diet dan olahraga.'
            };
        }
        return {
            bmi: numBmi,
            status: 'Obesitas',
            category: 'Obesity',
            score: 80,
            label: 'Risiko tinggi',
            explanation: 'BMI di kategori obesitas dengan seharusnya BMI kisaran normal (18,5 - 24,9). Segera perbaiki pola makan dan tambahkan aktivitas fisik.'
        };
    }

    function getBMIStatus(bmi) {
        return calculateBmiRiskStatus(bmi).status;
    }

    function getCalorieRecommendation(bmi) {
        const numBmi = parseFloat(bmi) || 0;
        if (numBmi < 18.5) {
            return {
                target: 2500,
                label: 'Rencana penambahan berat',
                advice: 'BMI Anda rendah. Tingkatkan asupan kalori dengan makanan kaya protein dan karbohidrat sehat.'
            };
        }
        if (numBmi < 25) {
            return {
                target: 2117,
                label: 'Rencana pemeliharaan',
                advice: 'BMI Anda berada dalam kisaran sehat. Pertahankan pola makan seimbang dan gaya hidup aktif.'
            };
        }
        if (numBmi < 30) {
            return {
                target: 1900,
                label: 'Pengurangan kalori ringan',
                advice: 'BMI Anda di atas normal. Kurangi porsi sedikit dan pilih protein tanpa lemak serta sayuran.'
            };
        }
        return {
            target: 1700,
            label: 'Rencana penurunan berat',
            advice: 'BMI Anda pada kategori obesitas. Kurangi kalori, batasi karbohidrat olahan, dan tingkatkan sayuran serta protein.'
        };
    }

    function getObesityRiskScore(bmi) {
        return calculateBmiRiskStatus(bmi);
    }

    function getEarlyWarningMessage(bmi) {
        const numBmi = parseFloat(bmi) || 0;
        if (numBmi < 18.5) return 'Risiko rendah. Tambahkan asupan bergizi dan pertahankan aktivitas fisik secara teratur.';
        if (numBmi < 25.0) return 'Risiko normal. Pertahankan pola makan seimbang dan aktivitas fisik harian.';
        if (numBmi < 30.0) return 'Risiko sedang. Tambahkan aktivitas ringan dan jaga kalori agar tidak melewati target harian.';
        return 'Risiko tinggi. Prioritaskan aktivitas fisik, kurangi kalori secara bertahap, dan pertimbangkan konsultasi gizi.';
    }

    function getTodayDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatHistoryDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return String(dateString).replace('T', ' ').slice(0, 16);
        }
        try {
            return new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return date.toLocaleString();
        }
    }

    function formatShortDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        try {
            return new Intl.DateTimeFormat('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    }

    function formatNameFromEmail(email) {
        if (!email) return 'Pengguna';
        const parts = email.split('@')[0].split(/[._-]/).filter(Boolean);
        if (!parts.length) return 'Pengguna';
        return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }

    // Dynamic Macro Target Calculation based on daily Calorie Goal
    function computeMacroTargets(calorieTarget) {
        const cal = parseInt(calorieTarget, 10) || 2117;
        return {
            carbs: Math.round((cal * 0.50) / 4),    // 50% carbs (4 kcal/g)
            protein: Math.round((cal * 0.20) / 4),  // 20% protein (4 kcal/g)
            fat: Math.round((cal * 0.30) / 9)       // 30% fat (9 kcal/g)
        };
    }

    // ==========================================
    // 4. USER AUTHENTICATION & PROFILE SYNC
    // ==========================================

    // Sync a user profile into active session and flat localStorage keys
    function syncUserToActiveSession(user) {
        if (!user) return;
        const normalizedEmail = user.email.toLowerCase().trim();
        CaloriaDB.setActiveEmail(normalizedEmail);

        // Core fields
        localStorage.setItem('userEmail', normalizedEmail);
        localStorage.setItem('userName', user.name || formatNameFromEmail(normalizedEmail));
        if (user.password) localStorage.setItem('userPassword', user.password);

        // Physical & Nutrition parameters
        const height = parseFloat(user.height) || 170;
        const weight = parseFloat(user.weight) || 56;
        const bmi = parseFloat(user.bmi) || parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
        const risk = calculateBmiRiskStatus(bmi);
        const rec = getCalorieRecommendation(bmi);
        const calorieTarget = parseInt(user.calorieTarget, 10) || rec.target;

        localStorage.setItem('userHeight', height);
        localStorage.setItem('userWeight', weight);
        localStorage.setItem('userBMI', bmi.toFixed(1));
        localStorage.setItem('userBMIStatus', risk.status);
        localStorage.setItem('userObesityScore', risk.score);
        localStorage.setItem('userObesityRiskLabel', risk.label);
        localStorage.setItem('userObesityRiskExplanation', risk.explanation);
        localStorage.setItem('userCaloriesTarget', calorieTarget);
        localStorage.setItem('userCalorieAdvice', user.calorieAdvice || rec.advice);
        localStorage.setItem('userDietPlan', user.dietPlan || rec.label);

        // Synchronize meals and activities
        if (Array.isArray(user.meals)) {
            localStorage.setItem('userMealLogs', JSON.stringify(user.meals));
        }
        if (Array.isArray(user.activities)) {
            localStorage.setItem('userActivities', JSON.stringify(user.activities));
        }
        if (user.coachActionsDone !== undefined) {
            localStorage.setItem('coachActionsDone', user.coachActionsDone);
        }

        // Keep master user record updated
        CaloriaDB.saveUser({
            ...user,
            email: normalizedEmail,
            height,
            weight,
            bmi,
            calorieTarget,
            lastLoginAt: new Date().toISOString()
        });
    }

    // Save active flat localStorage state back into the master user object
    function serializeAndSaveActiveSessionToUser() {
        const activeEmail = CaloriaDB.getActiveEmail();
        if (!activeEmail) return;

        const existingUser = CaloriaDB.getUser(activeEmail) || {};
        const height = parseFloat(localStorage.getItem('userHeight')) || existingUser.height || 170;
        const weight = parseFloat(localStorage.getItem('userWeight')) || existingUser.weight || 56;
        const bmi = parseFloat(localStorage.getItem('userBMI')) || parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
        const calorieTarget = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || existingUser.calorieTarget || 2117;
        const meals = loadAllMealLogs();
        const activities = loadUserActivities();
        const coachActionsDone = parseInt(localStorage.getItem('coachActionsDone') || '0', 10);

        // Update weight history if current weight not recorded for today
        const weightHistory = Array.isArray(existingUser.weightHistory) ? [...existingUser.weightHistory] : [];
        const todayStr = getTodayDate();
        const existingTodayWeightIdx = weightHistory.findIndex(item => item.date === todayStr);
        if (existingTodayWeightIdx >= 0) {
            weightHistory[existingTodayWeightIdx] = {
                date: todayStr,
                weight,
                height,
                bmi,
                status: getBMIStatus(bmi),
                timestamp: new Date().toISOString()
            };
        } else {
            weightHistory.push({
                date: todayStr,
                weight,
                height,
                bmi,
                status: getBMIStatus(bmi),
                timestamp: new Date().toISOString()
            });
        }

        const updatedUser = {
            ...existingUser,
            email: activeEmail,
            name: localStorage.getItem('userName') || existingUser.name || formatNameFromEmail(activeEmail),
            password: localStorage.getItem('userPassword') || existingUser.password || '',
            height,
            weight,
            bmi,
            bmiStatus: localStorage.getItem('userBMIStatus') || getBMIStatus(bmi),
            obesityScore: localStorage.getItem('userObesityScore') || calculateBmiRiskStatus(bmi).score,
            obesityRiskLabel: localStorage.getItem('userObesityRiskLabel') || calculateBmiRiskStatus(bmi).label,
            obesityRiskExplanation: localStorage.getItem('userObesityRiskExplanation') || calculateBmiRiskStatus(bmi).explanation,
            calorieTarget,
            calorieAdvice: localStorage.getItem('userCalorieAdvice') || existingUser.calorieAdvice || '',
            dietPlan: localStorage.getItem('userDietPlan') || existingUser.dietPlan || '',
            macroTargets: computeMacroTargets(calorieTarget),
            meals,
            activities,
            weightHistory,
            coachActionsDone,
            lastSavedAt: new Date().toISOString()
        };

        CaloriaDB.saveUser(updatedUser);
    }

    // SIGNUP HANDLER
    function handleSignup() {
        const nameEl = document.getElementById('signup-name');
        const emailEl = document.getElementById('signup-email');
        const passEl = document.getElementById('signup-password');

        if (!nameEl || !emailEl || !passEl) return;

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const password = passEl.value.trim();

        if (name === '' || email === '' || password === '') {
            alert('Silakan lengkapi semua kolom untuk mendaftar.');
            return;
        }

        // Email validation format check
        if (!email.includes('@') || !email.includes('.')) {
            alert('Silakan masukkan format email yang valid.');
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = CaloriaDB.getUser(normalizedEmail);
        if (existingUser && existingUser.password) {
            const overwrite = confirm('Akun dengan email ini sudah terdaftar. Ingin masuk ke akun tersebut?');
            if (overwrite) {
                window.location.href = 'login.html';
                return;
            }
        }

        // Carry over any baseline BMI parameters if previously calculated on index.html
        const baselineHeight = parseFloat(localStorage.getItem('userHeight')) || 170;
        const baselineWeight = parseFloat(localStorage.getItem('userWeight')) || 56;
        const baselineBMI = parseFloat(localStorage.getItem('userBMI')) || parseFloat((baselineWeight / ((baselineHeight / 100) ** 2)).toFixed(1));
        const risk = calculateBmiRiskStatus(baselineBMI);
        const rec = getCalorieRecommendation(baselineBMI);
        const calorieTarget = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || rec.target;

        const newUser = {
            email: normalizedEmail,
            name: name,
            password: password,
            height: baselineHeight,
            weight: baselineWeight,
            bmi: baselineBMI,
            bmiStatus: risk.status,
            obesityScore: risk.score,
            obesityRiskLabel: risk.label,
            obesityRiskExplanation: risk.explanation,
            calorieTarget: calorieTarget,
            calorieAdvice: rec.advice,
            dietPlan: rec.label,
            macroTargets: computeMacroTargets(calorieTarget),
            meals: [],
            activities: [],
            weightHistory: [{
                date: getTodayDate(),
                weight: baselineWeight,
                height: baselineHeight,
                bmi: baselineBMI,
                status: risk.status,
                timestamp: new Date().toISOString()
            }],
            coachActionsDone: 0,
            createdAt: new Date().toISOString()
        };

        CaloriaDB.saveUser(newUser);
        syncUserToActiveSession(newUser);

        // If BMI hasn't been explicitly calculated, lead them to BMI calculation, else directly to app.html
        if (!localStorage.getItem('userBMI')) {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'app.html';
        }
    }

    // LOGIN HANDLER
    function handleLogin() {
        const emailEl = document.getElementById('email');
        const passEl = document.getElementById('password');

        if (!emailEl || !passEl) return;

        const email = emailEl.value.trim();
        const pass = passEl.value.trim();

        if (!email || !pass) {
            alert('Silakan masukkan email dan password.');
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check default test credentials
        if (normalizedEmail === DEFAULT_TEST_EMAIL.toLowerCase() && pass === DEFAULT_TEST_PASS) {
            CaloriaDB.initDefaultUserIfMissing();
            const user = CaloriaDB.getUser(normalizedEmail);
            syncUserToActiveSession(user);
            window.location.href = localStorage.getItem('userBMI') ? 'app.html' : 'index.html';
            return;
        }

        // 2. Check registered user in database
        const user = CaloriaDB.getUser(normalizedEmail);

        if (!user) {
            // Check legacy flat keys in localStorage as fallback
            const storedEmail = localStorage.getItem('userEmail');
            const storedPassword = localStorage.getItem('userPassword');

            if (storedEmail && storedEmail.toLowerCase() === normalizedEmail && storedPassword === pass) {
                // Restore into database
                const recoveredUser = {
                    email: normalizedEmail,
                    name: localStorage.getItem('userName') || formatNameFromEmail(normalizedEmail),
                    password: pass,
                    height: parseFloat(localStorage.getItem('userHeight')) || 170,
                    weight: parseFloat(localStorage.getItem('userWeight')) || 56,
                    bmi: parseFloat(localStorage.getItem('userBMI')) || 19.4,
                    calorieTarget: parseInt(localStorage.getItem('userCaloriesTarget'), 10) || 2117,
                    meals: loadAllMealLogs(),
                    activities: loadUserActivities()
                };
                CaloriaDB.saveUser(recoveredUser);
                syncUserToActiveSession(recoveredUser);
                window.location.href = localStorage.getItem('userBMI') ? 'app.html' : 'index.html';
                return;
            }

            alert('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
            return;
        }

        if (user.password !== pass) {
            alert('Email atau password salah.');
            return;
        }

        // Successful authentication: restore complete user session and data
        syncUserToActiveSession(user);
        window.location.href = localStorage.getItem('userBMI') ? 'app.html' : 'index.html';
    }

    // LOGOUT HANDLER
    function handleLogout() {
        if (hasTodayProgress()) {
            const saveProgress = confirm('Anda memiliki progres Hari Ini. Simpan progres sebagai riwayat sebelum keluar?\n\nPilih OK untuk menyimpan, Batal untuk membuang progres hari ini.');
            if (saveProgress) {
                shouldAutoArchiveOnExit = false;
                archiveTodayProgress();
            } else {
                const discardProgress = confirm('Buang progres Hari Ini? Pilih OK untuk membuang, atau Batal untuk kembali ke aplikasi.');
                if (discardProgress) {
                    shouldAutoArchiveOnExit = false;
                    discardTodayProgress();
                } else {
                    return;
                }
            }
        }

        // Serialize all logs, macros, calories, BMI history to user key in database
        serializeAndSaveActiveSessionToUser();

        // Clear active session flags
        CaloriaDB.setActiveEmail('');
        localStorage.removeItem(`coachDone-${getTodayDate()}`);

        window.location.href = 'index.html';
    }

    // ==========================================
    // 5. APPLICATION STATE & DASHBOARD TRACKER
    // ==========================================
    let mealState = [];
    let currentMealCategory = null;
    let currentMealImageEstimate = null;
    let shouldAutoArchiveOnExit = true;

    function loadAllMealLogs() {
        try {
            return JSON.parse(localStorage.getItem('userMealLogs') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveAllMealLogs(logs) {
        localStorage.setItem('userMealLogs', JSON.stringify(logs));
        serializeAndSaveActiveSessionToUser();
    }

    function loadMealState() {
        const today = getTodayDate();
        return loadAllMealLogs().filter(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            return itemDate === today && !item.archived;
        });
    }

    function addMealLog(meal) {
        const logs = loadAllMealLogs();
        logs.push(meal);
        saveAllMealLogs(logs);
    }

    function loadUserActivities() {
        try {
            return JSON.parse(localStorage.getItem('userActivities') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveUserActivities(activities) {
        localStorage.setItem('userActivities', JSON.stringify(activities));
        serializeAndSaveActiveSessionToUser();
    }

    function loadTodayActivities() {
        const today = getTodayDate();
        return loadUserActivities().filter(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            return itemDate === today && !item.archived;
        });
    }

    function hasTodayProgress() {
        return loadMealState().length > 0 || loadTodayActivities().length > 0;
    }

    function archiveTodayProgress() {
        const today = getTodayDate();
        const allMeals = loadAllMealLogs().map(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            if (itemDate === today && !item.archived) {
                return { ...item, archived: true, savedAt: new Date().toISOString() };
            }
            return item;
        });
        saveAllMealLogs(allMeals);

        const allActivities = loadUserActivities().map(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            if (itemDate === today && !item.archived) {
                return { ...item, archived: true, savedAt: new Date().toISOString() };
            }
            return item;
        });
        saveUserActivities(allActivities);
    }

    function discardTodayProgress() {
        const today = getTodayDate();
        const filteredMeals = loadAllMealLogs().filter(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            return !(itemDate === today && !item.archived);
        });
        saveAllMealLogs(filteredMeals);

        const filteredActivities = loadUserActivities().filter(item => {
            const itemDate = (item.dateStr || item.date || '').slice(0, 10);
            return !(itemDate === today && !item.archived);
        });
        saveUserActivities(filteredActivities);
    }

    function calculateBurnedCalories() {
        return loadTodayActivities().reduce((sum, activity) => sum + (Number(activity.calories) || 0), 0);
    }

    function getTodayNutritionSnapshot() {
        const target = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || 2117;
        const eaten = mealState.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
        const activityMinutes = loadTodayActivities().reduce((sum, activity) => sum + (Number(activity.minutes) || 0), 0);
        const height = parseFloat(localStorage.getItem('userHeight')) || 170;
        const weight = parseFloat(localStorage.getItem('userWeight')) || 56;
        const bmi = (weight > 0 && height > 0) ? (weight / ((height / 100) ** 2)) : (parseFloat(localStorage.getItem('userBMI')) || 22);
        return { target, eaten, activityMinutes, bmi };
    }

    // Dynamic MyFitnessPal Progress & Macro calculations
    function updateDashboard() {
        const eaten = mealState.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
        const carbs = mealState.reduce((sum, meal) => sum + (Number(meal.carbs) || 0), 0);
        const protein = mealState.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
        const fat = mealState.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0);
        const target = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || 2117;
        const burned = calculateBurnedCalories();
        const remaining = Math.max(target - eaten + burned, 0);

        // Macro targets calculated dynamically from daily calorie goal
        const macroTargets = computeMacroTargets(target);

        const eatenEl = document.getElementById('eaten-value');
        if (eatenEl) eatenEl.textContent = eaten;

        const remEl = document.getElementById('remaining-value');
        if (remEl) remEl.textContent = remaining.toLocaleString('id-ID');

        const burnedEl = document.getElementById('burned-value');
        if (burnedEl) burnedEl.textContent = burned;

        const carbsValEl = document.getElementById('carbs-value');
        if (carbsValEl) carbsValEl.textContent = `${carbs} / ${macroTargets.carbs} g`;

        const protValEl = document.getElementById('protein-value');
        if (protValEl) protValEl.textContent = `${protein} / ${macroTargets.protein} g`;

        const fatValEl = document.getElementById('fat-value');
        if (fatValEl) fatValEl.textContent = `${fat} / ${macroTargets.fat} g`;

        const carbsBar = document.getElementById('carbs-bar');
        if (carbsBar) carbsBar.style.width = `${Math.min((carbs / Math.max(macroTargets.carbs, 1)) * 100, 100)}%`;

        const proteinBar = document.getElementById('protein-bar');
        if (proteinBar) proteinBar.style.width = `${Math.min((protein / Math.max(macroTargets.protein, 1)) * 100, 100)}%`;

        const fatBar = document.getElementById('fat-bar');
        if (fatBar) fatBar.style.width = `${Math.min((fat / Math.max(macroTargets.fat, 1)) * 100, 100)}%`;

        const analysisButton = document.getElementById('analysis-button');
        if (analysisButton) {
            analysisButton.style.display = mealState.length > 0 ? 'block' : 'none';
        }

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const progressRatio = Math.min(eaten / Math.max(target, 1), 1);
            const progressLength = progressRatio * 282;
            progressBar.style.strokeDashoffset = (282 - progressLength).toString();
        }

        renderMealCards();
        renderActivityRecommendations();
        renderActivityLog();
        renderHistory();
        updateDashboardSummaryPanel();
        updateEarlyWarningPanel();
        generateBehaviorCoach(false);
        updateAnalysis();
        serializeAndSaveActiveSessionToUser();
    }

    function renderMealCards() {
        const mealList = document.getElementById('meal-list');
        if (!mealList) return;
        mealList.innerHTML = '';
        const target = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || 2117;

        MEAL_CATEGORIES.forEach(category => {
            const categoryMeals = mealState.filter(meal => meal.category === category.id);
            const totalCalories = categoryMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
            const categoryTarget = Math.round(target * category.targetRatio);

            const card = document.createElement('div');
            card.className = 'meal-card';
            card.innerHTML = `
                <div class="meal-info">
                    <div class="meal-icon" style="background-color: ${category.color};">${category.icon}</div>
                    <div class="meal-det">
                        <h4>${category.id}</h4>
                        <p>${totalCalories} / ${categoryTarget} Cal${categoryMeals.length ? ` • ${categoryMeals.length} item` : ''}</p>
                    </div>
                </div>
                <button class="btn-add" onclick="openMealDetail('${category.id}')" title="Tambah makanan ke ${category.id}">+</button>
            `;
            mealList.appendChild(card);
        });
    }

    function openMealDetail(mealName) {
        currentMealCategory = mealName;
        currentMealImageEstimate = null;
        document.getElementById('dashboard-screen')?.classList.remove('active');
        document.getElementById('meal-detail-screen')?.classList.add('active');
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = mealName;
        const foodEl = document.getElementById('detail-food');
        if (foodEl) foodEl.value = '';
        const servingsEl = document.getElementById('detail-servings');
        if (servingsEl) servingsEl.value = '1';
        const photoInput = document.getElementById('meal-photo-input');
        if (photoInput) photoInput.value = '';
        const preview = document.getElementById('meal-photo-preview');
        if (preview) {
            preview.style.backgroundImage = 'none';
            preview.classList.remove('has-photo');
        }
        const photoEstimate = document.getElementById('photo-estimate');
        if (photoEstimate) photoEstimate.textContent = 'Scan foto makanan untuk memperkirakan kalori.';
        const ingredientList = document.getElementById('ingredient-list');
        if (ingredientList) {
            ingredientList.innerHTML = '';
            addIngredientRow();
        }
    }

    function closeMealDetail() {
        document.getElementById('meal-detail-screen')?.classList.remove('active');
        document.getElementById('dashboard-screen')?.classList.add('active');
    }

    function addIngredientRow(name = '', grams = '') {
        const ingredientList = document.getElementById('ingredient-list');
        if (!ingredientList) return;
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input class="ingredient-name" type="text" placeholder="Nama bahan" value="${name}" />
            <input class="ingredient-grams" type="number" min="0" placeholder="gram" value="${grams}" />
            <button class="ingredient-remove" onclick="removeIngredientRow(this)">×</button>
        `;
        ingredientList.appendChild(row);
    }

    function removeIngredientRow(button) {
        button.closest('.ingredient-row')?.remove();
    }

    function handleMealPhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('meal-photo-preview');
            if (preview) {
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.classList.add('has-photo');
            }
        };
        reader.readAsDataURL(file);

        analyzeFoodImageWithVision(file);
    }

    function renderPhotoEstimate() {
        const estimate = currentMealImageEstimate;
        if (!estimate) return;
        const servings = Math.max(parseFloat(document.getElementById('detail-servings')?.value) || 1, 0.5);
        const calculated_calories = Math.round(estimate.calories * servings);
        const calculated_carbs = Math.round(estimate.carbs * servings);
        const calculated_protein = Math.round(estimate.protein * servings);
        const calculated_fat = Math.round(estimate.fat * servings);
        const food_name = estimate.food_name || estimate.foodName || 'Makanan terdeteksi';
        const photoEstimate = document.getElementById('photo-estimate');
        if (photoEstimate) {
            photoEstimate.textContent =
                `Perkiraan AI: ${food_name} • ${calculated_calories} kkal • ${calculated_carbs}g karbo • ${calculated_protein}g protein • ${calculated_fat}g lemak`;
        }
    }

    async function analyzeFoodImageWithVision(file) {
        const photoEstimate = document.getElementById('photo-estimate');
        if (photoEstimate) {
            photoEstimate.textContent = '🔍 Menganalisis foto dengan AI Vision...';
        }
        try {
            const imageData = await readFileAsDataUrl(file);
            const response = await fetch('/api/analyze-food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });

            if (!response.ok) {
                console.warn(`Vision API status ${response.status}, using smart fallback`);
                currentMealImageEstimate = detectFoodFromFile(file);
            } else {
                const result = await response.json();
                if (result && typeof result.food_name !== 'undefined') {
                    currentMealImageEstimate = {
                        food_name: result.food_name,
                        calories: Number(result.calories) || 0,
                        carbs: Number(result.carbs) || 0,
                        protein: Number(result.protein) || 0,
                        fat: Number(result.fat) || 0
                    };
                } else {
                    currentMealImageEstimate = detectFoodFromFile(file);
                }
            }

            const foodInput = document.getElementById('detail-food');
            if (foodInput && (!foodInput.value.trim() || foodInput.value === 'Makanan terdeteksi')) {
                foodInput.value = currentMealImageEstimate.food_name;
            }
            renderPhotoEstimate();
        } catch (error) {
            console.warn('Vision scan handled with fallback:', error);
            currentMealImageEstimate = detectFoodFromFile(file);
            const foodInput = document.getElementById('detail-food');
            if (foodInput && !foodInput.value.trim()) {
                foodInput.value = currentMealImageEstimate.food_name;
            }
            renderPhotoEstimate();
        }
    }

    function detectFoodFromFile(file) {
        const fileName = file.name.toLowerCase().replace(/[._-]+/g, ' ');
        const foodSamples = [
            { keywords: ['es teh', 'iced tea', 'teh manis', 'sweet tea'], food_name: 'Es Teh Manis', calories: 90, carbs: 23, protein: 0, fat: 0 },
            { keywords: ['coca cola', 'coke', 'cola', 'soda'], food_name: 'Minuman Bersoda', calories: 140, carbs: 35, protein: 0, fat: 0 },
            { keywords: ['french fries', 'fries', 'kentang goreng'], food_name: 'Kentang goreng', calories: 365, carbs: 48, protein: 4, fat: 17 },
            { keywords: ['nasi goreng', 'fried rice'], food_name: 'Nasi goreng', calories: 520, carbs: 72, protein: 14, fat: 19 },
            { keywords: ['burger', 'hamburger'], food_name: 'Burger', calories: 540, carbs: 45, protein: 25, fat: 27 },
            { keywords: ['pizza'], food_name: 'Pizza', calories: 285, carbs: 36, protein: 12, fat: 10 },
            { keywords: ['salad', 'gado gado', 'gado'], food_name: 'Salad sayur', calories: 230, carbs: 20, protein: 8, fat: 13 },
            { keywords: ['soto', 'soup', 'sup'], food_name: 'Soto ayam', calories: 390, carbs: 42, protein: 24, fat: 12 }
        ];
        const match = foodSamples.find(sample => sample.keywords.some(keyword => fileName.includes(keyword)));
        if (match) return { ...match };
        const hash = createPhotoHash(`${file.name}:${file.size}`);
        const calories = 250 + (hash % 451);
        const carbs = 20 + ((hash >>> 3) % 61);
        const protein = 8 + ((hash >>> 7) % 33);
        const fat = 6 + ((hash >>> 11) % 26);
        return { food_name: 'Makanan terdeteksi', calories, carbs, protein, fat };
    }

    function createPhotoHash(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index++) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function confirmMeal() {
        const food = document.getElementById('detail-food')?.value.trim() || 'Makanan sehat';
        let calories, carbs, protein, fat;
        const servings = Math.max(parseFloat(document.getElementById('detail-servings')?.value) || 1, 0.5);

        if (currentMealImageEstimate) {
            calories = Math.round(currentMealImageEstimate.calories * servings);
            carbs = Math.round(currentMealImageEstimate.carbs * servings);
            protein = Math.round(currentMealImageEstimate.protein * servings);
            fat = Math.round(currentMealImageEstimate.fat * servings);
        } else {
            const ingredientRows = Array.from(document.querySelectorAll('.ingredient-row'));
            let totalGrams = 0;
            ingredientRows.forEach(row => {
                const grams = parseFloat(row.querySelector('.ingredient-grams')?.value) || 0;
                totalGrams += grams;
            });

            if (totalGrams <= 0) totalGrams = 150; // default standard portion in grams

            const gramsPerServing = totalGrams * servings;
            carbs = Math.round(gramsPerServing * 0.45);
            protein = Math.round(gramsPerServing * 0.18);
            fat = Math.round(gramsPerServing * 0.08);
            calories = Math.round(carbs * 4 + protein * 4 + fat * 9);
        }

        const now = new Date();
        const mealEntry = {
            id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            category: currentMealCategory || 'Snacks',
            name: food,
            calories,
            carbs,
            protein,
            fat,
            servings,
            date: now.toISOString(),
            dateStr: getTodayDate(),
            archived: false
        };

        mealState.push(mealEntry);
        addMealLog(mealEntry);

        currentMealImageEstimate = null;
        updateDashboard();
        closeMealDetail();
    }

    function openActivityDetail() {
        const activity = prompt('Masukkan nama aktivitas olahraga/harian (contoh: Lari, Jalan Cepat, Berenang):');
        if (!activity || !activity.trim()) return;
        const duration = prompt('Durasi dalam menit:');
        const minutes = parseInt(duration, 10);
        if (!minutes || minutes <= 0) {
            alert('Masukkan durasi yang valid (angka menit).');
            return;
        }
        const calories = Math.round(minutes * 6.5);
        const userActivities = loadUserActivities();
        const now = new Date();
        userActivities.push({
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: activity.trim(),
            minutes,
            calories,
            date: now.toISOString(),
            dateStr: getTodayDate(),
            archived: false
        });
        saveUserActivities(userActivities);
        updateDashboard();
    }

    // Profile & Parameters change handler
    function handleProfileFieldChange() {
        const heightInput = document.getElementById('dashboard-height');
        const weightInput = document.getElementById('dashboard-weight');
        if (!heightInput || !weightInput) return;

        const height = parseFloat(heightInput.value) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        if (!height || !weight) return;

        localStorage.setItem('userHeight', height);
        localStorage.setItem('userWeight', weight);

        const bmi = weight / ((height / 100) ** 2);
        const status = getBMIStatus(bmi);
        const recommendation = getCalorieRecommendation(bmi);
        const risk = getObesityRiskScore(bmi);

        localStorage.setItem('userBMI', bmi.toFixed(1));
        localStorage.setItem('userBMIStatus', status);
        localStorage.setItem('userObesityScore', risk.score);
        localStorage.setItem('userObesityRiskLabel', risk.label);
        localStorage.setItem('userObesityRiskExplanation', risk.explanation);
        localStorage.setItem('userCaloriesTarget', recommendation.target);
        localStorage.setItem('userCalorieAdvice', recommendation.advice);
        localStorage.setItem('userDietPlan', recommendation.label);

        // Update UI displays
        const profileBmi = document.getElementById('profile-bmi');
        if (profileBmi) profileBmi.textContent = bmi.toFixed(1);
        const profileH = document.getElementById('profile-height');
        if (profileH) profileH.textContent = `${height} cm`;
        const profileW = document.getElementById('profile-weight');
        if (profileW) profileW.textContent = `${weight} kg`;
        const profileTarget = document.getElementById('profile-target');
        if (profileTarget) profileTarget.textContent = `${recommendation.target} kkal`;
        const profileRec = document.getElementById('profile-recommendation');
        if (profileRec) profileRec.textContent = recommendation.label;

        const dashBmi = document.getElementById('dashboard-bmi');
        if (dashBmi) dashBmi.textContent = bmi.toFixed(1);
        const dashRisk = document.getElementById('dashboard-risk-label');
        if (dashRisk) dashRisk.textContent = risk.label;
        const riskDetails = document.getElementById('risk-details');
        if (riskDetails) riskDetails.textContent = risk.explanation;
        const dashTarget = document.getElementById('dashboard-target');
        if (dashTarget) dashTarget.textContent = `${recommendation.target} kkal`;
        const dashRec = document.getElementById('dashboard-recommendation');
        if (dashRec) dashRec.textContent = recommendation.label;

        updateDashboard();
    }

    function toggleRiskExplanation() {
        const details = document.getElementById('risk-details');
        if (details) details.classList.toggle('active');
    }

    function updateDashboardSummaryPanel() {
        const target = localStorage.getItem('userCaloriesTarget') || '2117';
        const recommendation = localStorage.getItem('userDietPlan') || 'Rencana pemeliharaan';
        const height = localStorage.getItem('userHeight') || '170';
        const weight = localStorage.getItem('userWeight') || '56';
        const h = parseFloat(height) || 170;
        const w = parseFloat(weight) || 56;
        const bmi = (w > 0 && h > 0) ? (w / ((h / 100) ** 2)) : (parseFloat(localStorage.getItem('userBMI')) || 22.0);
        const bmiRisk = calculateBmiRiskStatus(bmi);

        const targetEl = document.getElementById('dashboard-target');
        if (targetEl) targetEl.textContent = `${target} kkal`;
        const recEl = document.getElementById('dashboard-recommendation');
        if (recEl) recEl.textContent = recommendation;
        const dashBmi = document.getElementById('dashboard-bmi');
        if (dashBmi) dashBmi.textContent = bmi.toFixed(1);
        const riskLabel = document.getElementById('dashboard-risk-label');
        if (riskLabel) riskLabel.textContent = bmiRisk.label;
        const heightEl = document.getElementById('dashboard-height');
        if (heightEl) heightEl.value = height;
        const weightEl = document.getElementById('dashboard-weight');
        if (weightEl) weightEl.value = weight;
        const riskDetails = document.getElementById('risk-details');
        if (riskDetails) riskDetails.textContent = bmiRisk.explanation;
    }

    function loadRiskHistory() {
        try {
            return JSON.parse(localStorage.getItem('userRiskHistory') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveRiskHistory(history) {
        localStorage.setItem('userRiskHistory', JSON.stringify(history));
    }

    function updateEarlyWarningPanel() {
        const bmi = getTodayNutritionSnapshot().bmi;
        const bmiRisk = calculateBmiRiskStatus(bmi);
        const history = loadRiskHistory();
        history[getTodayDate()] = { score: bmiRisk.score, label: bmiRisk.label };
        saveRiskHistory(history);

        const warningMessage = getEarlyWarningMessage(bmi);

        localStorage.setItem('userObesityScore', bmiRisk.score);
        localStorage.setItem('userObesityRiskLabel', bmiRisk.label);
        localStorage.setItem('userObesityRiskExplanation', bmiRisk.explanation);

        const dashboardRiskLabel = document.getElementById('dashboard-risk-label');
        if (dashboardRiskLabel) dashboardRiskLabel.textContent = bmiRisk.label;

        const riskDetails = document.getElementById('risk-details');
        if (riskDetails) riskDetails.textContent = bmiRisk.explanation;

        const profileObesityScore = document.getElementById('profile-obesity-score');
        if (profileObesityScore) profileObesityScore.textContent = bmiRisk.score;

        const profileObesityRisk = document.getElementById('profile-obesity-risk');
        if (profileObesityRisk) profileObesityRisk.textContent = bmiRisk.label;

        const earlyWarningBmi = document.getElementById('early-warning-bmi');
        const earlyWarningStatus = document.getElementById('early-warning-status');
        const earlyWarningProgress = document.getElementById('early-warning-progress');
        const earlyWarningMessage = document.getElementById('early-warning-message');

        if (earlyWarningBmi) earlyWarningBmi.textContent = bmi.toFixed(1);
        if (earlyWarningStatus) earlyWarningStatus.textContent = bmiRisk.label;
        if (earlyWarningProgress) earlyWarningProgress.style.width = `${Math.min(Math.max((bmi / 40) * 100, 0), 100)}%`;
        if (earlyWarningMessage) earlyWarningMessage.textContent = warningMessage;

        updateProfileInnovationStats();
    }

    function generateBehaviorCoach(forceNew = true) {
        const coachCard = document.getElementById('coach-card');
        const coachMessage = document.getElementById('coach-message');
        if (!coachMessage) return;
        if (localStorage.getItem(`coachDone-${getTodayDate()}`) === '1') {
            if (coachCard) coachCard.style.display = 'none';
            return;
        }
        if (coachCard) coachCard.style.display = 'block';

        const { eaten, target, activityMinutes, bmi } = getTodayNutritionSnapshot();
        const messages = [
            `Fokus hari ini: cukup tambah 15 menit jalan kaki setelah makan. Langkah kecil lebih mudah dipertahankan daripada perubahan ekstrem.`,
            `Kalori kamu ${eaten}/${target} kkal. Sisakan ruang untuk pilihan tinggi protein dan sayur agar kenyang lebih lama.`,
            `BMI kamu ${bmi.toFixed(1)}. Target hari ini bukan sempurna, tapi membuat satu keputusan yang lebih sehat dari kemarin.`,
            `Aktivitas tercatat ${activityMinutes} menit. Kalau masih rendah, mulai dari naik tangga atau jalan santai 10 menit.`,
            `Coba ganti minuman manis dengan air putih di satu waktu makan. Ini mendukung target penurunan konsumsi gula 20% dalam 6 bulan.`,
            `Pilih satu porsi sayur di makan berikutnya. Tubuh kamu tidak butuh perubahan besar sekaligus, cukup arah yang benar.`,
            `Kalau ingin ngemil, ambil buah atau yogurt lebih dulu. Kamu tetap bisa menikmati hari tanpa keluar jauh dari target.`,
            `Minum air putih sebelum makan berikutnya bisa membantu mengontrol porsi. Sederhana, tapi efeknya terasa.`,
            `Berjalan 10 menit setelah makan adalah investasi kecil untuk energi, pencernaan, dan target BMI kamu.`,
            `Hari ini cukup menang satu kebiasaan sehat. Satu keputusan baik tetap dihitung sebagai progres.`
        ];
        const todayKey = `coachMessage-${getTodayDate()}`;
        let index = parseInt(localStorage.getItem(todayKey), 10);
        if (forceNew || isNaN(index)) {
            index = isNaN(index)
                ? (new Date().getDate() + mealState.length + activityMinutes) % messages.length
                : (index + 1) % messages.length;
            localStorage.setItem(todayKey, index);
        }
        coachMessage.textContent = messages[index];
    }

    function markCoachActionDone() {
        const coachCard = document.getElementById('coach-card');
        const coachMessage = document.getElementById('coach-message');
        const closingMessages = [
            'Terima kasih sudah semangat untuk hari ini.',
            'Mantap, aksi sehat hari ini sudah tercatat. Terima kasih sudah berusaha.',
            'Keren, kamu sudah melakukan satu langkah baik hari ini.',
            'Terima kasih sudah konsisten. Istirahat sebentar, besok lanjut lagi.'
        ];
        const current = parseInt(localStorage.getItem('coachActionsDone') || '0', 10);
        localStorage.setItem('coachActionsDone', current + 1);
        localStorage.setItem(`coachDone-${getTodayDate()}`, '1');
        updateProfileInnovationStats();
        if (coachMessage) {
            coachMessage.textContent = closingMessages[current % closingMessages.length];
        }
        setTimeout(function () {
            if (coachCard) coachCard.style.display = 'none';
        }, 1800);
        serializeAndSaveActiveSessionToUser();
    }

    function updateProfileInnovationStats() {
        const history = loadRiskHistory();
        const highRiskDays = Object.values(history).filter(item => item && item.score > 70).length;
        const coachActions = localStorage.getItem('coachActionsDone') || '0';
        const highRiskElement = document.getElementById('profile-high-risk-days');
        const coachElement = document.getElementById('profile-coach-actions');
        if (highRiskElement) highRiskElement.textContent = `${highRiskDays} hari`;
        if (coachElement) coachElement.textContent = `${coachActions} kali`;
    }

    function loadRecommendedActivityStatus() {
        try {
            return JSON.parse(localStorage.getItem('userRecommendedActivities') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveRecommendedActivityStatus(status) {
        localStorage.setItem('userRecommendedActivities', JSON.stringify(status));
    }

    function getTodayRecommendedActivityStatus() {
        const allStatus = loadRecommendedActivityStatus();
        return allStatus[getTodayDate()] || {};
    }

    function setTodayRecommendedActivityStatus(activityId, done) {
        const allStatus = loadRecommendedActivityStatus();
        const today = getTodayDate();
        allStatus[today] = allStatus[today] || {};
        allStatus[today][activityId] = done;
        saveRecommendedActivityStatus(allStatus);
    }

    function updateRecommendedActivityLog(activityId, activityData, done) {
        const activities = loadUserActivities();
        if (done) {
            const alreadySaved = activities.some(item => item.activityId === activityId && item.recommended && (item.dateStr === getTodayDate() || item.date.slice(0, 10) === getTodayDate()));
            if (!alreadySaved) {
                const now = new Date();
                activities.push({
                    id: `act_rec_${Date.now()}`,
                    activityId,
                    name: activityData.label,
                    minutes: activityData.minutes,
                    calories: activityData.cals,
                    date: now.toISOString(),
                    dateStr: getTodayDate(),
                    recommended: true,
                    archived: false
                });
            }
        } else {
            const updated = activities.filter(item => !(item.activityId === activityId && item.recommended && (item.dateStr === getTodayDate() || item.date.slice(0, 10) === getTodayDate())));
            saveUserActivities(updated);
            return;
        }
        saveUserActivities(activities);
    }

    function renderActivityRecommendations() {
        const recList = document.getElementById('activity-recommendation-list');
        if (!recList) return;
        const bmi = parseFloat(localStorage.getItem('userBMI')) || 22;
        const todayStatus = getTodayRecommendedActivityStatus();
        const activityOptions = [
            { id: 'casual_walk', label: 'Jalan santai 15 menit', cals: 60, minutes: 15, condition: bmi >= 18.5 },
            { id: 'brisk_walk', label: 'Jalan cepat 30 menit', cals: 150, minutes: 30, condition: bmi >= 25 },
            { id: 'power_walk', label: 'Jalan cepat 45 menit', cals: 220, minutes: 45, condition: bmi >= 25 },
            { id: 'light_yoga', label: 'Yoga ringan 30 menit', cals: 110, minutes: 30, condition: bmi < 30 },
            { id: 'cycling', label: 'Bersepeda 20 menit', cals: 120, minutes: 20, condition: true }
        ];
        recList.innerHTML = activityOptions
            .filter(item => item.condition)
            .map(item => {
                const checked = todayStatus[item.id] ? 'checked' : '';
                return `
                    <label class="activity-pill">
                        <span>${item.label} • ~${item.cals} kkal</span>
                        <input type="checkbox" onchange="toggleRecommendedActivity('${item.id}')" ${checked} />
                    </label>
                `;
            })
            .join('');
    }

    function toggleRecommendedActivity(activityId) {
        const bmi = parseFloat(localStorage.getItem('userBMI')) || 22;
        const activityOptions = [
            { id: 'casual_walk', label: 'Jalan santai 15 menit', cals: 60, minutes: 15, condition: bmi >= 18.5 },
            { id: 'brisk_walk', label: 'Jalan cepat 30 menit', cals: 150, minutes: 30, condition: bmi >= 25 },
            { id: 'power_walk', label: 'Jalan cepat 45 menit', cals: 220, minutes: 45, condition: bmi >= 25 },
            { id: 'light_yoga', label: 'Yoga ringan 30 menit', cals: 110, minutes: 30, condition: bmi < 30 },
            { id: 'cycling', label: 'Bersepeda 20 menit', cals: 120, minutes: 20, condition: true }
        ];
        const selectedActivity = activityOptions.find(item => item.id === activityId);
        if (!selectedActivity) return;

        const status = getTodayRecommendedActivityStatus();
        const done = !status[activityId];
        setTodayRecommendedActivityStatus(activityId, done);
        updateRecommendedActivityLog(activityId, selectedActivity, done);
        updateDashboard();
    }

    function renderActivityLog() {
        const logContainer = document.getElementById('activity-log');
        if (!logContainer) return;
        const todayActivities = loadTodayActivities();
        if (!todayActivities.length) {
            logContainer.innerHTML = '<div class="empty-text">Belum ada aktivitas yang dicatat hari ini.</div>';
            return;
        }
        logContainer.innerHTML = todayActivities.map(item => `
            <div class="activity-row">
                <div><strong>${item.name}</strong></div>
                <div>${item.minutes} menit • ${item.calories} kkal</div>
            </div>
        `).join('');
    }

    // ==========================================
    // 6. RIWAYAT (HISTORY) RENDERING
    // ==========================================
    function renderHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const today = getTodayDate();
        const allMeals = loadAllMealLogs();
        const allActivities = loadUserActivities();

        // Get weight & BMI history from user profile
        const activeEmail = CaloriaDB.getActiveEmail();
        const user = CaloriaDB.getUser(activeEmail) || {};
        const weightHistory = Array.isArray(user.weightHistory) ? user.weightHistory : [];

        // Collect all distinct dates
        const dateSet = new Set();
        allMeals.forEach(m => dateSet.add((m.dateStr || m.date || '').slice(0, 10)));
        allActivities.forEach(a => dateSet.add((a.dateStr || a.date || '').slice(0, 10)));
        weightHistory.forEach(w => dateSet.add((w.date || '').slice(0, 10)));

        const sortedDates = Array.from(dateSet).filter(Boolean).sort((a, b) => b.localeCompare(a));

        if (!sortedDates.length) {
            historyList.innerHTML = '<div class="empty-text">Belum ada riwayat aktivitas atau makanan tersimpan.</div>';
            return;
        }

        let html = '';

        sortedDates.forEach(dateKey => {
            const isToday = dateKey === today;
            const dateLabel = isToday ? 'Hari Ini' : formatShortDate(dateKey);

            // Filter items for this date
            const dayMeals = allMeals.filter(m => (m.dateStr || m.date || '').slice(0, 10) === dateKey);
            const dayActivities = allActivities.filter(a => (a.dateStr || a.date || '').slice(0, 10) === dateKey);
            const dayWeight = weightHistory.find(w => (w.date || '').slice(0, 10) === dateKey);

            const dayCaloriesEaten = dayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
            const dayCarbs = dayMeals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
            const dayProtein = dayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
            const dayFat = dayMeals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);
            const dayBurned = dayActivities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0);

            html += `
                <div class="history-card">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid #EEF2F6; padding-bottom: 6px;">
                        <div>
                            <strong style="font-size: 15px; color: var(--primary-dark);">${dateLabel}</strong>
                            <span style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">${dateKey}</span>
                        </div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">
                            ${dayCaloriesEaten} kkal
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; background: #F8FAFC; padding: 6px 10px; border-radius: 10px;">
                        <span>🌾 Karbo: <strong>${dayCarbs}g</strong></span>
                        <span>🥩 Protein: <strong>${dayProtein}g</strong></span>
                        <span>🥑 Lemak: <strong>${dayFat}g</strong></span>
                        ${dayBurned > 0 ? `<span>🔥 Terbakar: <strong>${dayBurned} kkal</strong></span>` : ''}
                    </div>

                    ${dayWeight ? `
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                            ⚖️ Berat: <strong>${dayWeight.weight} kg</strong> • BMI: <strong>${dayWeight.bmi}</strong> (${dayWeight.status || getBMIStatus(dayWeight.bmi)})
                        </div>
                    ` : ''}

                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${dayMeals.map(m => `
                            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed #F1F4F8;">
                                <div>
                                    <span style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600;">[${m.category || 'Makanan'}]</span>
                                    <span style="color: var(--text-main); font-weight: 500; margin-left: 4px;">${m.name}</span>
                                </div>
                                <div style="font-weight: 600; color: var(--text-main);">
                                    ${m.calories} kkal <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(${m.carbs}C • ${m.protein}P • ${m.fat}F)</span>
                                </div>
                            </div>
                        `).join('')}

                        ${dayActivities.map(a => `
                            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: var(--violet-dark);">
                                <div>
                                    <span style="font-size: 11px; font-weight: 600;">[Aktivitas]</span>
                                    <span style="margin-left: 4px;">${a.name}</span>
                                </div>
                                <div style="font-weight: 600;">
                                    -${a.calories} kkal <span style="font-size: 11px; font-weight: normal;">(${a.minutes} min)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        historyList.innerHTML = html;
    }

    function updateAnalysis() {
        const analysisContent = document.getElementById('analysis-content');
        if (!analysisContent) return;
        if (mealState.length === 0) {
            analysisContent.innerHTML = '<p style="color:#666;">Masukkan makanan terlebih dahulu untuk melihat analisis nutrisi yang disesuaikan.</p>';
            return;
        }

        const eaten = mealState.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
        const carbs = mealState.reduce((sum, meal) => sum + (Number(meal.carbs) || 0), 0);
        const protein = mealState.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
        const fat = mealState.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0);
        const targetCalories = parseInt(localStorage.getItem('userCaloriesTarget'), 10) || 2117;
        const macroTargets = computeMacroTargets(targetCalories);

        const messages = [];

        if (protein < macroTargets.protein) {
            messages.push(`<li><strong>Protein rendah:</strong> Anda baru mencapai ${protein}g dari target ${macroTargets.protein}g. Tambahkan makan sumber protein seperti daging, telur, atau kacang-kacangan.</li>`);
        } else {
            messages.push(`<li><strong>Protein cukup:</strong> Asupan protein Anda sudah baik pada ${protein}g.</li>`);
        }

        if (carbs > macroTargets.carbs) {
            messages.push(`<li><strong>Karbohidrat berlebih:</strong> Anda sudah mengonsumsi ${carbs}g karbohidrat, di atas target ${macroTargets.carbs}g. Pilih karbohidrat kompleks dan batasi porsi nasi atau roti putih.</li>`);
        } else {
            messages.push(`<li><strong>Karbohidrat terkontrol:</strong> Saat ini asupan karbohidrat Anda ${carbs}g, masih di bawah target ${macroTargets.carbs}g.</li>`);
        }

        if (fat > macroTargets.fat) {
            messages.push(`<li><strong>Lemak tinggi:</strong> Anda mengonsumsi ${fat}g lemak, melebihi target ${macroTargets.fat}g. Kurangi makanan berlemak tinggi dan pilih sumber lemak sehat.</li>`);
        } else {
            messages.push(`<li><strong>Lemak aman:</strong> Asupan lemak Anda ${fat}g, berada dalam batas yang wajar.</li>`);
        }

        if (eaten > targetCalories) {
            messages.push(`<li><strong>Kalori melebihi target:</strong> Total kalori Anda ${eaten} kkal, melampaui target ${targetCalories} kkal. Perhatikan porsi untuk menyeimbangkan energi.</li>`);
        } else {
            messages.push(`<li><strong>Kalori dalam batas:</strong> Total kalori Anda ${eaten} kkal, masih di bawah target ${targetCalories} kkal.</li>`);
        }

        const latestMeal = mealState[mealState.length - 1];
        if (latestMeal) {
            messages.push(`<li><strong>Input terakhir:</strong> ${latestMeal.name} di ${latestMeal.category} dengan ${latestMeal.calories} kkal, ${latestMeal.carbs}g karbohidrat, ${latestMeal.protein}g protein, dan ${latestMeal.fat}g lemak.</li>`);
        }

        analysisContent.innerHTML = `<ul>${messages.join('')}</ul>`;
    }

    function switchScreen(screenName) {
        document.getElementById('dashboard-screen')?.classList.remove('active');
        document.getElementById('profile-screen')?.classList.remove('active');
        document.getElementById('history-screen')?.classList.remove('active');
        document.getElementById('meal-detail-screen')?.classList.remove('active');
        document.getElementById('nav-today')?.classList.remove('active');
        document.getElementById('nav-history')?.classList.remove('active');
        document.getElementById('nav-profile')?.classList.remove('active');

        if (screenName === 'dashboard') {
            document.getElementById('dashboard-screen')?.classList.add('active');
            document.getElementById('nav-today')?.classList.add('active');
        } else if (screenName === 'history') {
            document.getElementById('history-screen')?.classList.add('active');
            document.getElementById('nav-history')?.classList.add('active');
            renderHistory();
        } else if (screenName === 'profile') {
            document.getElementById('profile-screen')?.classList.add('active');
            document.getElementById('nav-profile')?.classList.add('active');
            loadUserProfile();
        }
    }

    function toggleModal(show) {
        const modal = document.getElementById('nutritionist-modal');
        if (!modal) return;
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    function loadUserProfile() {
        const activeEmail = CaloriaDB.getActiveEmail();
        const user = CaloriaDB.getUser(activeEmail);

        if (!activeEmail || !user) {
            const sessionActive = localStorage.getItem('sessionActive');
            if (sessionActive !== '1') {
                window.location.href = 'login.html';
                return;
            }
        }

        const email = activeEmail || localStorage.getItem('userEmail') || '';
        const name = (user && user.name) || localStorage.getItem('userName') || formatNameFromEmail(email);
        const height = (user && user.height) || localStorage.getItem('userHeight') || '170';
        const weight = (user && user.weight) || localStorage.getItem('userWeight') || '56';
        const bmi = (user && user.bmi) || localStorage.getItem('userBMI') || '19.4';
        const target = (user && user.calorieTarget) || localStorage.getItem('userCaloriesTarget') || '2117';
        const recommendation = (user && user.dietPlan) || localStorage.getItem('userDietPlan') || 'Rencana pemeliharaan';
        const obesityRisk = (user && user.obesityRiskLabel) || localStorage.getItem('userObesityRiskLabel') || 'Risiko normal';
        const obesityScore = (user && user.obesityScore) || localStorage.getItem('userObesityScore') || '20';

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = name;
        const emailEl = document.getElementById('profile-email');
        if (emailEl) emailEl.textContent = email;
        const bmiEl = document.getElementById('profile-bmi');
        if (bmiEl) bmiEl.textContent = Number(bmi).toFixed(1);
        const hEl = document.getElementById('profile-height');
        if (hEl) hEl.textContent = `${height} cm`;
        const wEl = document.getElementById('profile-weight');
        if (wEl) wEl.textContent = `${weight} kg`;
        const targetEl = document.getElementById('profile-target');
        if (targetEl) targetEl.textContent = `${target} kkal`;
        const recEl = document.getElementById('profile-recommendation');
        if (recEl) recEl.textContent = recommendation;
        const riskEl = document.getElementById('profile-obesity-risk');
        if (riskEl) riskEl.textContent = obesityRisk;
        const scoreEl = document.getElementById('profile-obesity-score');
        if (scoreEl) scoreEl.textContent = obesityScore;

        updateProfileInnovationStats();
    }

    // ==========================================
    // 7. BMI PICKER / CALCULATOR PAGE HANDLERS
    // ==========================================
    const pickerState = {
        height: 170,
        weight: 56
    };

    function initBMIPicker() {
        renderPicker('height');
        renderPicker('weight');
    }

    function changePicker(type, delta) {
        if (!pickerState[type]) return;
        const min = type === 'height' ? 100 : 30;
        const max = type === 'height' ? 230 : 200;
        pickerState[type] = Math.min(max, Math.max(min, pickerState[type] + delta));
        renderPicker(type);
    }

    function renderPicker(type) {
        const value = pickerState[type];
        const topEl = document.getElementById(`${type}-top`);
        if (topEl) topEl.textContent = value - 1;
        const curEl = document.getElementById(`${type}-current`);
        if (curEl) curEl.textContent = value;
        const botEl = document.getElementById(`${type}-bottom`);
        if (botEl) botEl.textContent = value + 1;
        const inputEl = document.getElementById(`${type}-input`);
        if (inputEl) inputEl.value = value;
    }

    function calculateBMI() {
        const height = parseFloat(document.getElementById('height-input')?.value || pickerState.height);
        const weight = parseFloat(document.getElementById('weight-input')?.value || pickerState.weight);
        if (!height || !weight) {
            alert('Silakan masukkan tinggi dan berat badan.');
            return;
        }

        const bmi = weight / ((height / 100) ** 2);
        const status = getBMIStatus(bmi);
        const recommendation = getCalorieRecommendation(bmi);
        const risk = getObesityRiskScore(bmi);

        localStorage.setItem('userHeight', height);
        localStorage.setItem('userWeight', weight);
        localStorage.setItem('userBMI', bmi.toFixed(1));
        localStorage.setItem('userBMIStatus', status);
        localStorage.setItem('userObesityScore', risk.score);
        localStorage.setItem('userObesityRiskLabel', risk.label);
        localStorage.setItem('userObesityRiskExplanation', risk.explanation);
        localStorage.setItem('userCaloriesTarget', recommendation.target);
        localStorage.setItem('userCalorieAdvice', recommendation.advice);
        localStorage.setItem('userDietPlan', recommendation.label);

        const bmiVal = document.getElementById('bmi-value');
        if (bmiVal) bmiVal.textContent = bmi.toFixed(1);
        const bmiStat = document.getElementById('bmi-status');
        if (bmiStat) bmiStat.textContent = status;
        const obScore = document.getElementById('obesity-score');
        if (obScore) obScore.textContent = `${risk.score} / 100`;
        const obExp = document.getElementById('obesity-explanation');
        if (obExp) obExp.textContent = risk.explanation;
        const calTarget = document.getElementById('calorie-target');
        if (calTarget) calTarget.textContent = recommendation.target + ' kkal';
        const calAdv = document.getElementById('calorie-advice');
        if (calAdv) calAdv.textContent = recommendation.advice;

        const resCard = document.getElementById('bmi-result-card');
        if (resCard) resCard.style.display = 'block';
        const contLogin = document.getElementById('continue-login');
        if (contLogin) contLogin.style.display = 'block';
        const contSignup = document.getElementById('continue-signup');
        if (contSignup) contSignup.style.display = 'block';

        // Also save to active user if logged in
        serializeAndSaveActiveSessionToUser();
    }

    function goToLogin() {
        window.location.href = 'login.html';
    }

    function goToSignup() {
        window.location.href = 'signup.html';
    }

    // ==========================================
    // 8. GLOBAL PAGE INITIALIZERS & LIFECYCLE
    // ==========================================
    function initializePage() {
        const isAppPage = !!document.getElementById('dashboard-screen');
        const isBmiPage = !!document.getElementById('height-top');
        const isLoginPage = !!document.getElementById('login-screen');
        const isSignupPage = !!document.getElementById('signup-screen');

        if (isBmiPage) {
            const storedHeight = localStorage.getItem('userHeight');
            const storedWeight = localStorage.getItem('userWeight');
            if (storedHeight) pickerState.height = parseFloat(storedHeight);
            if (storedWeight) pickerState.weight = parseFloat(storedWeight);
            initBMIPicker();
        }

        if (isAppPage) {
            const activeEmail = CaloriaDB.getActiveEmail();
            const sessionActive = localStorage.getItem('sessionActive');

            if (sessionActive !== '1' && !activeEmail) {
                window.location.href = 'login.html';
                return;
            }

            // Sync user data
            const user = CaloriaDB.getUser(activeEmail);
            if (user) {
                syncUserToActiveSession(user);
            }

            const bottomNav = document.getElementById('bottom-nav-bar');
            if (bottomNav) bottomNav.style.display = 'flex';

            mealState = loadMealState();
            renderMealCards();
            updateDashboard();
            loadUserProfile();
        }
    }

    window.addEventListener('DOMContentLoaded', initializePage);
    window.addEventListener('load', initializePage);

    window.addEventListener('beforeunload', function (event) {
        if (hasTodayProgress()) {
            serializeAndSaveActiveSessionToUser();
        }
    });

    window.addEventListener('unload', function () {
        if (hasTodayProgress() && shouldAutoArchiveOnExit) {
            serializeAndSaveActiveSessionToUser();
        }
    });

    // ==========================================
    // 9. EXPORT GLOBALS TO WINDOW
    // ==========================================
    window.CaloriaDB = CaloriaDB;
    window.handleSignup = handleSignup;
    window.handleLogin = handleLogin;
    window.handleLogout = handleLogout;
    window.calculateBmiRiskStatus = calculateBmiRiskStatus;
    window.getBMIStatus = getBMIStatus;
    window.getCalorieRecommendation = getCalorieRecommendation;
    window.getObesityRiskScore = getObesityRiskScore;
    window.getEarlyWarningMessage = getEarlyWarningMessage;
    window.computeMacroTargets = computeMacroTargets;
    window.getTodayDate = getTodayDate;
    window.formatHistoryDate = formatHistoryDate;
    window.formatShortDate = formatShortDate;
    window.formatNameFromEmail = formatNameFromEmail;
    window.loadAllMealLogs = loadAllMealLogs;
    window.saveAllMealLogs = saveAllMealLogs;
    window.loadMealState = loadMealState;
    window.addMealLog = addMealLog;
    window.loadUserActivities = loadUserActivities;
    window.saveUserActivities = saveUserActivities;
    window.loadTodayActivities = loadTodayActivities;
    window.hasTodayProgress = hasTodayProgress;
    window.archiveTodayProgress = archiveTodayProgress;
    window.discardTodayProgress = discardTodayProgress;
    window.calculateBurnedCalories = calculateBurnedCalories;
    window.getTodayNutritionSnapshot = getTodayNutritionSnapshot;
    window.updateDashboard = updateDashboard;
    window.renderMealCards = renderMealCards;
    window.openMealDetail = openMealDetail;
    window.closeMealDetail = closeMealDetail;
    window.addIngredientRow = addIngredientRow;
    window.removeIngredientRow = removeIngredientRow;
    window.handleMealPhoto = handleMealPhoto;
    window.renderPhotoEstimate = renderPhotoEstimate;
    window.analyzeFoodImageWithVision = analyzeFoodImageWithVision;
    window.detectFoodFromFile = detectFoodFromFile;
    window.createPhotoHash = createPhotoHash;
    window.readFileAsDataUrl = readFileAsDataUrl;
    window.confirmMeal = confirmMeal;
    window.openActivityDetail = openActivityDetail;
    window.handleProfileFieldChange = handleProfileFieldChange;
    window.toggleRiskExplanation = toggleRiskExplanation;
    window.updateDashboardSummaryPanel = updateDashboardSummaryPanel;
    window.loadRiskHistory = loadRiskHistory;
    window.saveRiskHistory = saveRiskHistory;
    window.updateEarlyWarningPanel = updateEarlyWarningPanel;
    window.generateBehaviorCoach = generateBehaviorCoach;
    window.markCoachActionDone = markCoachActionDone;
    window.updateProfileInnovationStats = updateProfileInnovationStats;
    window.loadRecommendedActivityStatus = loadRecommendedActivityStatus;
    window.saveRecommendedActivityStatus = saveRecommendedActivityStatus;
    window.getTodayRecommendedActivityStatus = getTodayRecommendedActivityStatus;
    window.setTodayRecommendedActivityStatus = setTodayRecommendedActivityStatus;
    window.updateRecommendedActivityLog = updateRecommendedActivityLog;
    window.renderActivityRecommendations = renderActivityRecommendations;
    window.toggleRecommendedActivity = toggleRecommendedActivity;
    window.renderActivityLog = renderActivityLog;
    window.renderHistory = renderHistory;
    window.updateAnalysis = updateAnalysis;
    window.switchScreen = switchScreen;
    window.toggleModal = toggleModal;
    window.loadUserProfile = loadUserProfile;
    window.initBMIPicker = initBMIPicker;
    window.changePicker = changePicker;
    window.renderPicker = renderPicker;
    window.calculateBMI = calculateBMI;
    window.goToLogin = goToLogin;
    window.goToSignup = goToSignup;
    window.syncUserToActiveSession = syncUserToActiveSession;
    window.serializeAndSaveActiveSessionToUser = serializeAndSaveActiveSessionToUser;

})(window);
