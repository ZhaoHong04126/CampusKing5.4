function renderSemesterOptions() {
    const select = document.getElementById('semester-select');
    if (!select) return; //防止找不到元素
    select.innerHTML = '';
    semesterList.sort().reverse();
    semesterList.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.text = sem;
        if (sem === currentSemester) option.selected = true;
        select.appendChild(option);
    });
}

function switchSemester() {
    // 在儲存(重繪)之前，先抓取使用者想切換的新學期
    const select = document.getElementById('semster-select');
    const newSemester = select.value;
    saveData(); // 儲存舊學期資料
    currentSemester = newSemester; //更新
    loadSemesterData(currentSemester); // 載入新學期資料
    refreshUI(); // 強制刷新畫面
}

function addNewSemester() {
    showPrompt("請輸入新學期名稱 (例如: 114-1)", "114-2", "新增學期")
    .then(newSemName => {
        if (newSemName) {
            saveData(); //先存檔目前狀態

            if (semesterList.includes(newSemName)) {
                showAlert("這個學期已經存在囉！", "重複");
                currentSemester = newSemName;
            } else {
                semesterList.push(newSemName);
                currentSemester = newSemName;
                allData[newSemName] = { 
                    schedule: JSON.parse(JSON.stringify(defaultSchedule)), 
                    grades: [],
                    regularExams: {},
                    midtermExams: {},
                    calendarEvents: [],
                    accounting: [],
                    notes: [],
                    anniversaries: [],
                    learning: []
                };
                }

            loadSemesterData(currentSemester);
            saveData(); // 存檔新學期
            renderSemesterOptions(); // 刷新全介面
            howAlert(`已切換至 ${newSemName}`, "成功");
        }
    });
}

function editSemester() {
    showPrompt("請輸入新的學期名稱", currentSemester, "修改名稱")
    .then(newName => {
        if (newName && newName !== currentSemester) {
            if (semesterList.includes(newName)) {
                showAlert("名稱重複！", "錯誤");
                return;
            } // 搬移資料
            allData[newName] = allData[currentSemester];
            delete allData[currentSemester];
            // 更新列表
            const index = semesterList.indexOf(currentSemester);
            semesterList[index] = newName;
            currentSemester = newName;

            saveData();
            renderSemesterOptions();
            showAlert("修改成功！", "完成");
        }
    });
}

function deleteSemester() {
    if (semesterList.length <= 1) {
        showAlert("至少要保留一個學期，無法刪除！", "無法執行");
        return;
    }
    
    showConfirm(`確定要刪除「${currentSemester}」的所有資料嗎？此動作無法復原！`, "刪除確認")
    .then(isConfirmed => {
        if (isConfirmed) {
            delete allData[currentSemester];
            semesterList = semesterList.filter(s => s !== currentSemester);
            currentSemester = semesterList[0];

            saveData();
            // renderSemesterOptions();
            loadSemesterData(currentSemester);
            refreshUI();
            showAlert("已刪除並切換至上一個學期", "完成")
            // switchDay(currentDay);
            // loadGrades();
        }
    });
}


// 儲存日期設定
function saveSemesterDates() {
    // 取得輸入值
    const startVal = document.getElementById('setting-sem-start').value;
    const endVal = document.getElementById('setting-sem-end').value;

    // 驗證
    if (!startVal) {
        showAlert("請至少設定「學期開始日」！", "無法儲存");
        return;
    }
    
    // 更新變數
    semesterStartDate = startVal;
    semesterEndDate = endVal;

    // 存檔與更新介面
    saveData();
    refreshUI(); // 確保都更新
    // updateSemesterStatus(); 
    
    // 如果月曆已經載入，刷新它
    // if (typeof renderMonthGrid === 'function') renderMonthGrid();

    showAlert("學期日期已更新！", "儲存成功");
    
    // 切換回檢視模式
    toggleSemesterEdit();
}

// 更新介面顯示
function renderSemesterSettings() {
    const startInput = document.getElementById('setting-sem-start');
    const endInput = document.getElementById('setting-sem-end');
    const startText = document.getElementById('text-sem-start');
    const endText = document.getElementById('text-sem-end');
    
    if (startInput) startInput.value = semesterStartDate;
    if (endInput) endInput.value = semesterEndDate;
    if (startText) startText.innerText = semesterStartDate || "未設定";
    if (endText) endText.innerText = semesterEndDate || "未設定";
    
    updateSemesterStatus();
}

// 計算並顯示目前週次
function updateSemesterStatus() {
    const statusDiv = document.getElementById('semester-status-text');
    if (!statusDiv) return;

    if (!semesterStartDate) {
        statusDiv.innerText = "尚未設定學期開始日";
        statusDiv.style.color = "#999";
        return;
    }

    const start = new Date(semesterStartDate);
    const now = new Date();
    const end = semesterEndDate ? new Date(semesterEndDate) : null;

    // 計算週次差異
    const diffTime = now - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 假設一週 7 天，且開始日當天算第 1 週的第 1 天
    // 如果還沒開始
    if (diffDays < 0) {
        statusDiv.innerText = `距離開學還有 ${Math.abs(diffDays)} 天`;
        statusDiv.style.color = "#f39c12";
    } else {
        const weekNum = Math.ceil(diffDays / 7);
        
        // 如果已經結束
        if (end && now > end) {
             statusDiv.innerText = "學期已結束";
             statusDiv.style.color = "#999";
        } else {
             statusDiv.innerText = `🟢 目前是 第 ${weekNum} 週`;
             statusDiv.style.color = "var(--primary)";
        }
    }
}
let isEditingSemester = false;
function toggleSemesterEdit() {
    isEditingSemester = !isEditingSemester;
    const viewDiv = document.getElementById('semester-date-view-mode');
    const editDiv = document.getElementById('semester-date-edit-mode');
    const btn = document.getElementById('btn-edit-semester-dates');

    if (isEditingSemester) {
        // 進入編輯模式
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none';
        
        // 確保輸入框裡有值
        const startInput = document.getElementById('setting-sem-start');
        const endInput = document.getElementById('setting-sem-end');
        if(startInput) startInput.value = semesterStartDate;
        if(endInput) endInput.value = semesterEndDate;

    } else {
        // 回到檢視模式
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block';
        
        // 刷新文字顯示
        renderSemesterSettings();
    }
}
