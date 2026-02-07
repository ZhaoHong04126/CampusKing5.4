// js/calendar.js

// 用來記錄目前月曆顯示的日期 (年/月)
let calCurrentDate = new Date();

// 主要渲染函式
function renderCalendar() {
    renderCalendarList();
    renderMonthGrid();
}

// ---------------------------------------------------------
// 1. 列表渲染 (顯示日期區間)
// ---------------------------------------------------------
function renderCalendarList() {
    const listDiv = document.getElementById('calendar-list');
    if (!listDiv) return;

    // 排序：依起始日期 -> 起始時間
    calendarEvents.sort((a, b) => {
        const dateA = new Date(a.date + (a.startTime ? 'T' + a.startTime : 'T00:00'));
        const dateB = new Date(b.date + (b.startTime ? 'T' + b.startTime : 'T00:00'));
        return dateA - dateB;
    });

    let html = '';
    if (calendarEvents.length === 0) {
        html = '<p style="color:#999; text-align:center;">😴 目前無活動</p>';
    } else {
        calendarEvents.forEach((event, index) => {
            // 判斷過期：如果 "結束日" (若無則用起始日) 小於今天，就變淡
            const endDateCheck = event.endDate ? new Date(event.endDate) : new Date(event.date);
            const isPast = endDateCheck < new Date().setHours(0,0,0,0);
            const style = isPast ? 'opacity: 0.5;' : '';
            
            // 處理時間顯示標籤
            let timeBadge = '';
            if (!event.isAllDay && event.startTime) {
                timeBadge = `<span style="background:#e3f2fd; color:#1565c0; padding:2px 6px; border-radius:4px; font-size:0.8rem; margin-right:6px;">${event.startTime}${event.endTime ? '~'+event.endTime : ''}</span>`;
            } else {
                timeBadge = `<span style="background:#eee; color:#666; padding:2px 6px; border-radius:4px; font-size:0.8rem; margin-right:6px;">全天</span>`;
            }

            // 處理日期顯示 (如果是跨日，顯示 02/08 ~ 02/10)
            let dateDisplay = event.date;
            if (event.endDate && event.endDate !== event.date) {
                // 簡化顯示，只取月/日
                const s = event.date.split('-').slice(1).join('/');
                const e = event.endDate.split('-').slice(1).join('/');
                dateDisplay = `${s} ~ ${e}`;
            }

            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0; ${style}">
                <div style="text-align:left;">
                    <div style="font-weight:bold; color:var(--primary); font-size:0.9rem; margin-bottom:2px;">
                        ${dateDisplay}
                    </div>
                    <div style="font-size:1rem; display:flex; align-items:center; flex-wrap:wrap;">
                        ${timeBadge}
                        <span>${event.title}</span>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteCalendarEvent(${index})" style="padding:4px 8px;">🗑️</button>
            </div>`;
        });
    }
    listDiv.innerHTML = html;
}

// ---------------------------------------------------------
// 2. 月曆網格渲染 (核心：處理跨日顯示)
// ---------------------------------------------------------
function renderMonthGrid() {
    const gridDiv = document.getElementById('calendar-grid');
    const titleDiv = document.getElementById('calendar-month-year');
    if (!gridDiv || !titleDiv) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); 

    // 標題顯示週次 (維持不變)
    let weekInfoText = "";
    if (typeof semesterStartDate !== 'undefined' && semesterStartDate) {
        const start = new Date(semesterStartDate);
        const currentMonthEnd = new Date(year, month + 1, 0);
        if (currentMonthEnd >= start) {
            const currentMonthStart = new Date(year, month, 1);
            const diffTime = currentMonthStart - start;
            const startWeek = Math.max(1, Math.ceil(Math.ceil(diffTime / (86400000)) / 7));
            if (startWeek < 30) weekInfoText = `<span style="font-size:0.8rem; color:var(--primary); margin-left:10px;">(約 第${startWeek}週起)</span>`;
        }
    }
    titleDiv.innerHTML = `${year}年 ${month + 1}月 ${weekInfoText}`;

    // 建立星期標頭
    let html = `
        <div class="cal-day-header" style="color:#e74c3c">日</div>
        <div class="cal-day-header">一</div>
        <div class="cal-day-header">二</div>
        <div class="cal-day-header">三</div>
        <div class="cal-day-header">四</div>
        <div class="cal-day-header">五</div>
        <div class="cal-day-header" style="color:#e74c3c">六</div>
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 補空白格
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day cal-other-month"></div>`;
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // --- 遍歷每一天 ---
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = isCurrentMonth && today.getDate() === d;
        const className = isToday ? 'cal-day cal-today' : 'cal-day';
        
        // 建構當天的日期字串 YYYY-MM-DD
        const mStr = (month + 1).toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        const currentDateStr = `${year}-${mStr}-${dStr}`;

        // 篩選：如果這一天落在 "起始日 ~ 結束日" 之間，就要顯示
        const dayEvents = calendarEvents.filter(e => {
            const start = e.date; 
            const end = e.endDate || e.date; // 如果沒有結束日，就當作單日活動
            return currentDateStr >= start && currentDateStr <= end;
        });

        // 排序：讓全天活動排上面
        dayEvents.sort((a, b) => (b.isAllDay ? 1 : 0) - (a.isAllDay ? 1 : 0));

        // 產生當天的小標籤
        let eventsHtml = '';
        dayEvents.forEach(e => {
            // 如果是跨日活動，且今天不是第一天，就不顯示時間，只顯示名稱簡寫
            let prefix = '';
            
            // 只有 "非全天" 且 "今天是起始日" 才顯示時間
            if (!e.isAllDay && e.startTime && e.date === currentDateStr) {
                prefix = `<span style="font-size:0.7em; opacity:0.8;">${e.startTime.replace(':','')}</span> `;
            }
            
            // 跨日活動樣式微調 (如果是連續活動的中間幾天，標題可以淡一點或加箭頭)
            let style = "";
            if (e.date !== currentDateStr && e.endDate && e.endDate !== currentDateStr) {
                // 中間的天數
                style = "opacity: 0.7;"; 
            }
            
            eventsHtml += `<div class="cal-event-text" style="${style}">${prefix}${e.title}</div>`;
        });

        html += `<div class="${className}">
                    <div class="cal-date-num">${d}</div>
                    <div class="cal-events-wrapper">${eventsHtml}</div>
                 </div>`;
    }
    gridDiv.innerHTML = html;
}

// ---------------------------------------------------------
// 3. 互動與資料處理
// ---------------------------------------------------------

function changeMonth(offset) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderMonthGrid();
}

function openCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'flex';
    document.getElementById('input-cal-date').value = '';
    document.getElementById('input-cal-end-date').value = ''; // 重置結束日
    document.getElementById('input-cal-title').value = '';
    
    // 重置時間
    document.getElementById('input-cal-allday').checked = true;
    document.getElementById('input-cal-start').value = '';
    document.getElementById('input-cal-end').value = '';
    toggleCalTimeInput();
}

function closeCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'none';
}

function toggleCalTimeInput() {
    const isAllDay = document.getElementById('input-cal-allday').checked;
    const timeDiv = document.getElementById('cal-time-inputs');
    timeDiv.style.display = isAllDay ? 'none' : 'flex';
}

function addCalendarEvent() {
    const date = document.getElementById('input-cal-date').value;
    const endDate = document.getElementById('input-cal-end-date').value; // 取得結束日
    const title = document.getElementById('input-cal-title').value;
    const isAllDay = document.getElementById('input-cal-allday').checked;
    const startTime = document.getElementById('input-cal-start').value;
    const endTime = document.getElementById('input-cal-end').value;

    if (date && title) {
        // 驗證：如果填了結束日，不能早於起始日
        if (endDate && endDate < date) {
            showAlert("結束日期不能早於起始日期！");
            return;
        }
        // 驗證：非全天需填時間
        if (!isAllDay && !startTime) {
            showAlert("請輸入開始時間");
            return;
        }

        calendarEvents.push({ 
            date, 
            endDate: endDate || null, // 存入結束日 (若無則 null)
            title,
            isAllDay,
            startTime: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime
        });

        saveData();
        closeCalendarModal();
        renderCalendar(); 
        showAlert("活動已新增！", "成功");
    } else {
        showAlert("請至少輸入起始日期與名稱");
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