// --- 資料存取核心 ---

function loadData() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const dbKey = 'campusMate_v5.4_' + uid;
    
    const savedData = localStorage.getItem(dbKey);
    if (savedData) {
        parseAndApplyData(JSON.parse(savedData));
    } else {
        initDefaultData(); 
    }

    if (navigator.onLine) {
        syncFromCloud(uid);
    }
    refreshUI();

    // 如果使用者已經授權過通知，開啟 App 時就自動啟動檢查
    if (Notification.permission === "granted") {
        // 呼叫 notification.js 裡的函式
        if (typeof startCourseChecker === 'function') {
            startCourseChecker();
        }
    }
}

function parseAndApplyData(parsed) {
    allData = parsed.allData || {};
    semesterList = parsed.semesterList || ["114-2"];
    currentSemester = parsed.currentSemester || semesterList[0];
    graduationTarget = parsed.graduationTarget || 128;
    
    if (parsed.categoryTargets) {
        categoryTargets = parsed.categoryTargets;
    }

    loadSemesterData(currentSemester);
}

function initDefaultData() {
    semesterList = ["114-1"];
    currentSemester = "114-2";
    allData = {
        "114-2": {
            schedule: JSON.parse(JSON.stringify(defaultSchedule)),
            grades: [],
            regularExams: {},
            midtermExams: {},
            calendarEvents: []
        }
    };
    loadSemesterData(currentSemester);
}

function syncFromCloud(uid) {
    const statusBtn = document.getElementById('user-badge');
    if(statusBtn) statusBtn.innerText = "同步中...";

    db.collection("users").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const cloudData = doc.data();
            console.log("🔥 雲端資料已下載");
            
            parseAndApplyData(cloudData);
            
            const dbKey = 'campusMate_v5.4_' + uid;
            localStorage.setItem(dbKey, JSON.stringify(cloudData));

            refreshUI();
            if(statusBtn) statusBtn.innerText = userType === 'university' ? '大學部' : '高中部';
        } else {
            console.log("☁️ 此帳號尚無雲端資料，將自動上傳本地資料...");
            saveData();
            if(statusBtn) statusBtn.innerText = userType === 'university' ? '大學部' : '高中部';
        }
    }).catch((error) => {
        console.error("同步失敗:", error);
        if(statusBtn) statusBtn.innerText = "離線";
    });
}

function saveData() {
    if (!currentUser) return;

    allData[currentSemester] = { 
        schedule: weeklySchedule, 
        grades: gradeList,
        regularExams: regularExams,
        midtermExams: midtermExams,
        calendarEvents: calendarEvents,
        accounting:accountingList,
        notes: quickNotes,
        anniversaries: anniversaryList,
        startDate: semesterStartDate,
        endDate: semesterEndDate,
        learning: learningList,
    };

    const storageObj = {
        allData: allData,
        semesterList: semesterList,
        currentSemester: currentSemester,
        graduationTarget: graduationTarget,
        categoryTargets: categoryTargets,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    const dbKey = 'campusMate_v5.4_' + currentUser.uid;
    const localObj = JSON.parse(JSON.stringify(storageObj)); 
    delete localObj.lastUpdated; 
    localStorage.setItem(dbKey, JSON.stringify(localObj));

    db.collection("users").doc(currentUser.uid).set(storageObj, { merge: true })
    .then(() => {
        console.log("✅ 資料已備份至雲端");
    })
    .catch((error) => {
        console.error("❌ 雲端備份失敗: ", error);
    });

    refreshUI();
}

function refreshUI() {
    renderSemesterOptions();
    if (typeof updateExamSubjectOptions === 'function') updateExamSubjectOptions();
    switchDay(currentDay);
    loadGrades();
    if (typeof renderRegularExams === 'function') renderRegularExams();
    if (typeof renderMidtermExams === 'function') renderMidtermExams();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();
    if (typeof renderAnalysis === 'function') renderAnalysis(); 

    const targetInput = document.getElementById('setting-grad-target');
    if (targetInput) targetInput.value = graduationTarget;
    if (typeof renderCategorySettingsInputs === 'function') renderCategorySettingsInputs();
    if (typeof renderCreditSettings === 'function') renderCreditSettings();
    if (typeof renderAccounting === 'function') renderAccounting();
    if (typeof renderNotes === 'function') renderNotes();
    if (typeof renderAnniversaries === 'function') renderAnniversaries();
    if (typeof renderSemesterSettings === 'function') renderSemesterSettings();

}

function loadSemesterData(sem) {
    if (!allData[sem]) allData[sem] = {
        schedule: JSON.parse(JSON.stringify(defaultSchedule)),
        grades: [],
        regularExams: {},
        midtermExams: {},
        calendarEvents: [],
        accounting: [],
        notes:[],
        startDate: "",
        endDate: ""
    };
    weeklySchedule = allData[sem].schedule;
    gradeList = allData[sem].grades;
    regularExams = allData[sem].regularExams || {};
    midtermExams = allData[sem].midtermExams || {};
    calendarEvents = allData[sem].calendarEvents || [];
    accountingList = allData[sem].accounting || [];
    quickNotes = allData[sem].notes || [];
    anniversaryList = allData[sem].anniversaries || [];
    semesterStartDate = allData[sem].startDate || "";
    semesterEndDate = allData[sem].endDate || "";
    learningList = allData[sem].learning || [];
}

function updateCategorySettings(category, type, value) {
    const val = parseInt(value) || 0;
    if (typeof categoryTargets[category] === 'object') {
        if (type === '必修') categoryTargets[category]['必修'] = val;
        if (type === '選修') categoryTargets[category]['選修'] = val;
    } else {
        categoryTargets[category] = val;
    }
    saveData();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}