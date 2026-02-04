let editingCourseIndex = -1;
const defaultPeriodTimes = {
    '0': '07:10',
    '1': '08:10',
    '2': '09:10',
    '3': '10:10',
    '4': '11:10',
    'N': '12:10', // 午休或中午課程
    '5': '13:10',
    '6': '14:10',
    '7': '15:10',
    '8': '16:10',
    '9': '17:10',
    'A': '18:20',
    'B': '19:15',
    'C': '20:10',
    'D': '21:05'
};
function switchDay(day) {
    currentDay = day;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${day}`);
    if (activeBtn) activeBtn.classList.add('active');

    const todayData = weeklySchedule[day] || [];
    todayData.sort((a, b) => (a.period || a.time || "").localeCompare(b.period || b.time || ""));

    const tbody = document.getElementById('schedule-body');
    if (tbody) {
        tbody.innerHTML = '';
        if (todayData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-class">😴 無課程</td></tr>';
        } else {
            todayData.forEach(item => {
                const period = item.period || "-";
                const teacher = item.teacher || "";
                const room = item.room || "";
                const nature = item.nature || item.type || '必修';
                const category = item.category || '';

                let typeColor = "#999";
                if (nature === '必修') typeColor = "#e74c3c";
                else if (nature === '選修') typeColor = "#27ae60";
                else if (nature === '必選修') typeColor = "#f39c12";

                let badges = `<span style="font-size:0.7rem; color:white; background:${typeColor}; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align: middle;">${nature}</span>`;
                if (category && category !== '其他') {
                    badges += `<span style="font-size:0.7rem; color:#888; margin-left:3px;">(${category})</span>`;
                }

                const row = `
                    <tr>
                        <td style="color:var(--primary); font-weight:bold;">${period}</td>
                        <td style="color:var(--text-sub);">${item.time}</td>
                        <td style="font-weight:bold;">${item.subject}</td>
                        <td><span style="background:var(--border); color:var(--text-main); padding:2px 4px; border-radius:4px; font-size:0.8rem;">${room}</span></td>
                        <td style="font-size:0.85rem;">${teacher}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    }
}

function renderEditList() {
    const listDiv = document.getElementById('current-course-list');
    const todayData = weeklySchedule[currentDay] || [];
    let html = '';
    todayData.forEach((item, index) => {
        const info = `${item.time} ${item.room ? '@' + item.room : ''}`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editCourse(${index})">修改</button>
                <button class="btn-delete" onclick="deleteCourse(${index})">刪除</button>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center;">無課程</p>';
}

function editCourse(index) {
    const todayData = weeklySchedule[currentDay] || [];
    const item = todayData[index];
    if (!item) return;

    // 回填資料到輸入框
    document.getElementById('input-period-start').value = item.period || '';
    document.getElementById('input-period-end').value = item.period || ''; // 預設結束=起始
    document.getElementById('input-time').value = item.time || getPeriodTimes()[item.period] || '';
    document.getElementById('input-subject').value = item.subject || '';
    document.getElementById('input-course-category').value = item.category || '通識';
    document.getElementById('input-course-nature').value = item.nature || item.type || '必修';
    document.getElementById('input-room').value = item.room || '';
    document.getElementById('input-teacher').value = item.teacher || '';

    editingCourseIndex = index;
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "💾 保存修改";
        btn.style.background = "#f39c12";
    }
}

// 定義節次順序 (用於計算區間)
const PERIOD_ORDER = ['0', '1', '2', '3', '4', 'N', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
function getPeriodTimes() {
    const times = {};
    const { classDur, breakDur, startHash } = periodConfig;

    let [h, m] = startHash.split(':').map(Number);
    let currentMin = h * 60 + m; // 轉成總分鐘數

    // 第 0 節通常比第 1 節早 (這裡簡單往前推算)
    let zeroStart = currentMin - (classDur + breakDur);
    times['0'] = formatTime(zeroStart);

    // 第 1 節開始往後算
    PERIOD_ORDER.forEach(p => {
        if (p === '0') return; // 跳過 0，因為上面算過了

        // 特別處理：中午午休 (N) 或是 第5節
        // 這裡假設第 4 節下課後，到第 5 節中間有一段較長的午休
        // 若是 'N'，我們通常固定設為 12:10 或接在第4節後

        times[p] = formatTime(currentMin);

        // 往後推算下一節的時間
        let duration = classDur;
        let breakTime = breakDur;

        // 特殊規則：如果是第 4 節下課 (中午)，通常休息久一點 (例如 60分)
        if (p === '4') breakTime = 60;
        // 特殊規則：午休 N 只有 30 分鐘? (可依需求調整，這裡暫設跟上課一樣)
        if (p === 'N') { duration = 30; breakTime = 20; }

        currentMin += duration + breakTime;
    });

    return times;
}
// 輔助：分鐘轉字串 (例如 490 -> "08:10")
function formatTime(totalMinutes) {
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
// 編輯時間設定 (綁定到按鈕)
function editTimeSettings() {
    // 防誤觸確認
    showConfirm("⚠️ 修改後，新增課程時的預設時間將會改變。\n\n確定要編輯課堂時間設定嗎？", "編輯確認")
        .then(isConfirmed => {
            if (!isConfirmed) return;

            // 輸入上課時間
            showPrompt("請輸入「每堂課」的分鐘數：", periodConfig.classDur, "上課時間")
                .then(cVal => {
                    if (cVal === null) return;
                    const newClass = parseInt(cVal) || 50;

                    // 輸入下課時間
                    showPrompt("請輸入「下課休息」的分鐘數：", periodConfig.breakDur, "下課時間")
                        .then(bVal => {
                            if (bVal === null) return;
                            const newBreak = parseInt(bVal) || 10;

                            // 儲存並更新
                            periodConfig.classDur = newClass;
                            periodConfig.breakDur = newBreak;
                            saveData();

                            // 為了讓使用者有感，我們可以計算一下第1節跟第8節的時間給他看
                            const preview = getPeriodTimes();
                            showAlert(`設定已更新！\n\n第 1 節：${preview['1']}\n第 8 節：${preview['8']}`, "修改成功");
                        });
                });
        });
}

function addCourse() {
    // 取得輸入值
    const pStartRaw = document.getElementById('input-period-start').value.trim().toUpperCase();
    const pEndRaw = document.getElementById('input-period-end').value.trim().toUpperCase();
    const time = document.getElementById('input-time').value;
    const sub = document.getElementById('input-subject').value;
    const category = document.getElementById('input-course-category').value;
    const nature = document.getElementById('input-course-nature').value;
    const room = document.getElementById('input-room').value;
    const teacher = document.getElementById('input-teacher').value;

    // 基本驗證
    if (!sub || !pStartRaw) {
        showAlert('請至少輸入「科目」與「起始節次」', '資料不全');
        return;
    }

    // 解析節次區間
    const idxStart = PERIOD_ORDER.indexOf(pStartRaw);
    let idxEnd = pEndRaw ? PERIOD_ORDER.indexOf(pEndRaw) : idxStart; // 若未填結束，預設等於起始

    // 節次合法性檢查
    if (idxStart === -1) { showAlert(`起始節次 "${pStartRaw}" 無效\n(請輸入 0-9 或 A-D)`, '格式錯誤'); return; }
    if (idxEnd === -1) { showAlert(`結束節次 "${pEndRaw}" 無效`, '格式錯誤'); return; }
    if (idxEnd < idxStart) { showAlert('結束節次不能早於起始節次！', '邏輯錯誤'); return; }

    // 初始化當日課表陣列
    if (!weeklySchedule[currentDay]) weeklySchedule[currentDay] = [];

    // --- 核心邏輯修改：自動配對正確時間 ---
    if (editingCourseIndex > -1) {
        // [修改模式]：如果是單堂修改，我們允許使用者自訂時間 (優先使用輸入框的值)
        // 但如果使用者沒填時間，我們就幫他自動補上
        const currentP = PERIOD_ORDER[idxStart];
        const finalTime = time || getPeriodTimes()[currentP] || "";
        weeklySchedule[currentDay][editingCourseIndex] = {
            period: currentP,
            time: finalTime,
            subject: sub, category, nature, room, teacher
        };

        // 處理連堂新增的部分 (idxStart + 1 ~ idxEnd)
        for (let i = idxStart + 1; i <= idxEnd; i++) {
            const p = PERIOD_ORDER[i];
            weeklySchedule[currentDay].push({
                period: p,
                time: getPeriodTimes()[p] || time, // 自動抓對應時間
                subject: sub, category, nature, room, teacher
            });
        }
        showAlert("修改成功！(若有延長節次已自動配對時間)", "成功");
    }
    // 迴圈建立多筆資料
    else {
        let count = 0;
        for (let i = idxStart; i <= idxEnd; i++) {
            const p = PERIOD_ORDER[i];

            // 這裡改用 defaultPeriodTimes 抓取標準時間
            // 如果對照表裡沒有這個節次，才使用使用者輸入的 time 作為備案
            const autoTime = getPeriodTimes()[p] || time;

            weeklySchedule[currentDay].push({
                period: p,
                time: autoTime,
                subject: sub, category, nature, room, teacher
            });
            count++;
        }
        showAlert(`成功加入 ${count} 堂課！`, "完成");
    }

    resetCourseInput();
    saveData();
    renderEditList();
    updateExamSubjectOptions();
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable(); // 即時更新週課表
}

function resetCourseInput() {
    document.getElementById('input-period-start').value = '';
    document.getElementById('input-period-end').value = '';
    document.getElementById('input-time').value = '';
    document.getElementById('input-subject').value = '';
    document.getElementById('input-course-category').value = '通識';
    document.getElementById('input-course-nature').value = '必修';
    document.getElementById('input-room').value = '';
    document.getElementById('input-teacher').value = '';

    editingCourseIndex = -1;
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "+ 加入清單";
        btn.style.background = "#333";
    }
}

// 使用 showConfirm 刪除
function deleteCourse(index) {
    showConfirm('確定刪除這堂課嗎？', '刪除確認').then(isConfirmed => {
        if (isConfirmed) {
            if (editingCourseIndex === index) resetCourseInput();

            weeklySchedule[currentDay].splice(index, 1);
            saveData();
            renderEditList();
            updateExamSubjectOptions();
        }
    });
}

function openEditModal() {
    document.getElementById('course-modal').style.display = 'flex';
    resetCourseInput();
    renderEditList();
}

function closeEditModal() {
    document.getElementById('course-modal').style.display = 'none';
    resetCourseInput();
}

// 渲染週課表網格 與 連堂合併 rowspan
function renderWeeklyTable() {
    const tbody = document.getElementById('weekly-schedule-body');
    if (!tbody) return;

    // 定義要顯示的節次清單
    const periods = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

    // 定義星期的順序 (配合 state.js 的 key: 1-6, 0代表週日)
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];

    // 用來記錄哪些格子因為被合併過，需要跳過不畫
    // 格式範例: "1-3" 代表 星期一的第3節 已經被合併了，不用畫
    let skipMap = new Set();

    let html = '';

    periods.forEach((p, pIndex) => {
        html += `<tr>`;

        // --- 左側：節次欄 ---
        html += `<td style="font-weight:bold; background:#f4f7f6; color:#555; text-align:center; vertical-align: middle;">${p}</td>`;

        // --- 右側：週一至週日 ---
        dayKeys.forEach(day => {
            // 1. 如果這一格已經被標記為「跳過」，就直接結束這次迴圈，不畫 td
            if (skipMap.has(`${day}-${p}`)) return;

            const dayCourses = weeklySchedule[day] || [];

            // 尋找當前節次的課程
            const course = dayCourses.find(c => c.period == p);

            if (course) {
                // --- 2. 發現有課，開始「往後檢查」是否有連堂 ---
                let spanCount = 1;

                // 從下一個節次開始檢查
                for (let nextI = pIndex + 1; nextI < periods.length; nextI++) {
                    const nextP = periods[nextI];
                    const nextCourse = dayCourses.find(c => c.period == nextP);

                    // 判斷條件：必須有課，且「科目名稱」與「地點」完全相同
                    // (如果您希望只看科目相同就合併，可以把 && 后面的 room 判斷拿掉)
                    if (nextCourse &&
                        nextCourse.subject === course.subject &&
                        nextCourse.room === course.room) {

                        spanCount++; // 合併數 +1
                        skipMap.add(`${day}-${nextP}`); // 標記下一節課為「已處理/跳過」
                    } else {
                        break; // 只要中間斷掉或不同課，就停止合併
                    }
                }

                // --- 3. 決定背景色 ---
                let bgColor = '#fff3e0'; // 預設(橘淡色)
                if (course.nature === '必修') bgColor = '#ffebee'; // 紅淡色
                else if (course.nature === '選修') bgColor = '#e8f5e9'; // 綠淡色

                // --- 4. 繪製帶有 rowspan 的儲存格 ---
                // rowspan="${spanCount}" 是關鍵，它讓格子跨越多列
                html += `
                <td rowspan="${spanCount}" style="background:${bgColor}; padding:4px; text-align:center; vertical-align:middle; border:1px solid #eee;">
                    <div style="font-weight:bold; font-size:0.85rem; color:#333; line-height:1.2;">${course.subject}</div>
                    <div style="font-size:0.75rem; color:#666; margin-top:2px;">${course.room || ''}</div>
                </td>`;
            } else {
                // 空堂
                html += `<td style="border:1px solid #f9f9f9;"></td>`;
            }
        });

        html += `</tr>`;
    });

    tbody.innerHTML = html;

}
