let editingCourseIndex = -1;

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
    document.getElementById('input-time').value = item.time || '';
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
const PERIOD_ORDER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

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

    // --- 核心邏輯：若是修改模式，先更新當下那一筆 ---
    if (editingCourseIndex > -1) {
        // 更新原本的那一筆資料 (設為起始節次)
        weeklySchedule[currentDay][editingCourseIndex] = {
            period: PERIOD_ORDER[idxStart],
            time, subject: sub, category, nature, room, teacher
        };

        // 如果區間包含多節 (例如 1~3)，則第 2, 3 節視為「新課程」加入
        // 從 idxStart + 1 開始迴圈
        for (let i = idxStart + 1; i <= idxEnd; i++) {
            weeklySchedule[currentDay].push({
                period: PERIOD_ORDER[i],
                time, subject: sub, category, nature, room, teacher
            });
        }
        showAlert("修改成功！(若有延長節次已自動新增)", "成功");
    } 
    // --- 新增模式：迴圈建立多筆資料 ---
    else {
        let count = 0;
        for (let i = idxStart; i <= idxEnd; i++) {
            weeklySchedule[currentDay].push({
                period: PERIOD_ORDER[i],
                time, subject: sub, category, nature, room, teacher
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
