// --- 行事曆功能 ---

// 用來記錄目前月曆顯示的年/月
let calCurrentDate = new Date();

// 1. 主要渲染函式 (同時渲染列表 與 月曆)
function renderCalendar() {
    renderCalendarList(); // 渲染下方的列表
    renderMonthGrid();    // 渲染上方的月曆
}

// --- (A) 列表渲染邏輯 ---
function renderCalendarList() {
    const listDiv = document.getElementById('calendar-list');
    if (!listDiv) return;

    calendarEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = '';
    if (calendarEvents.length === 0) {
        html = '<p style="color:#999; text-align:center;">😴 目前無活動</p>';
    } else {
        calendarEvents.forEach((event, index) => {
            const isPast = new Date(event.date) < new Date().setHours(0,0,0,0);
            const style = isPast ? 'opacity: 0.5;' : '';
            
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0; ${style}">
                <div style="text-align:left;">
                    <div style="font-weight:bold; color:var(--primary); font-size:0.9rem;">${event.date}</div>
                    <div style="font-size:1rem;">${event.title}</div>
                </div>
                <button class="btn-delete" onclick="deleteCalendarEvent(${index})" style="padding:4px 8px;">🗑️</button>
            </div>`;
        });
    }
    listDiv.innerHTML = html;
}

// --- (B) 月曆格子渲染邏輯 (修正版) ---
function renderMonthGrid() {
    const gridDiv = document.getElementById('calendar-grid');
    const titleDiv = document.getElementById('calendar-month-year');
    if (!gridDiv || !titleDiv) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); // 0-11

    // 1. 先計算「第幾週」文字 (防止變數未定義錯誤)
    let weekInfoText = "";
    
    // 檢查 semesterStartDate 是否存在且有效
    if (typeof semesterStartDate !== 'undefined' && semesterStartDate) {
        const start = new Date(semesterStartDate);
        const currentMonthEnd = new Date(year, month + 1, 0);

        // 簡單判斷：如果這個月在學期結束日之前
        if (currentMonthEnd >= start) {
            const currentMonthStart = new Date(year, month, 1);
            const diffTime = currentMonthStart - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let startWeek = Math.ceil(diffDays / 7);
            
            // 修正顯示：如果是負的(開學前)，或剛好第1週
            if (startWeek < 1) startWeek = 1; 
            
            // 只有在合理範圍內才顯示
            if (startWeek > -10 && startWeek < 30) {
                weekInfoText = `<span style="font-size:0.8rem; color:var(--primary); margin-left:10px;">(約 第${startWeek}週起)</span>`;
            }
        }
    }

    // 2. 更新標題 (現在 weekInfoText 已經安全了)
    titleDiv.innerHTML = `${year}年 ${month + 1}月 ${weekInfoText}`;

    // 3. 準備月曆格子的 HTML
    let html = `
        <div class="cal-day-header" style="color:#e74c3c">日</div>
        <div class="cal-day-header">一</div>
        <div class="cal-day-header">二</div>
        <div class="cal-day-header">三</div>
        <div class="cal-day-header">四</div>
        <div class="cal-day-header">五</div>
        <div class="cal-day-header" style="color:#e74c3c">六</div>
    `;

    // 計算當月第一天是星期幾
    const firstDay = new Date(year, month, 1).getDay();
    // 計算當月有幾天
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 4. 補前面的空白 (上個月)
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day cal-other-month"></div>`;
    }

    // 5. 填入當月日期
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // 準備活動日期 Set
    const eventDates = new Set();
    calendarEvents.forEach(e => eventDates.add(e.date));

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = isCurrentMonth && today.getDate() === d;
        const className = isToday ? 'cal-day cal-today' : 'cal-day';
        
        // 補零格式化 YYYY-MM-DD
        const mStr = (month + 1).toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;
        
        const hasEvent = eventDates.has(dateStr);
        const dotHtml = hasEvent ? '<div class="cal-dot"></div>' : '';

        html += `<div class="${className}">
                    <span>${d}</span>
                    ${dotHtml}
                 </div>`;
    }

    gridDiv.innerHTML = html;
}

// --- (C) 切換月份 ---
function changeMonth(offset) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderMonthGrid();
}

// --- 其他功能 (Modal, Add, Delete) ---
function openCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'flex';
    document.getElementById('input-cal-date').value = '';
    document.getElementById('input-cal-title').value = '';
}

function closeCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'none';
}

function addCalendarEvent() {
    const date = document.getElementById('input-cal-date').value;
    const title = document.getElementById('input-cal-title').value;

    if (date && title) {
        calendarEvents.push({ date, title });
        saveData();
        closeCalendarModal();
        renderCalendar(); 
    } else {
        if(window.showAlert) showAlert("請輸入日期與名稱");
        else alert("請輸入日期與名稱");
    }
}

function deleteCalendarEvent(index) {
    const doDelete = () => {
        calendarEvents.splice(index, 1);
        saveData();
        renderCalendar();
    };

    if(window.showConfirm) {
        showConfirm("確定刪除此活動？").then(ok => { if(ok) doDelete(); });
    } else {
        if(confirm("確定刪除此活動？")) doDelete();
    }
}
