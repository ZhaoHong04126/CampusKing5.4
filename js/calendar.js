// --- 行事曆功能 ---

// 用來記錄目前月曆顯示的日期 (年/月)，預設為當前時間
let calCurrentDate = new Date();

// 主要渲染函式 (同時渲染下方的活動列表 與 上方的月曆網格)
function renderCalendar() {
    renderCalendarList();// 渲染下方的活動列表
    renderMonthGrid();// 渲染上方的月曆網格
}

// 列表渲染邏輯
function renderCalendarList() {
    // 取得列表容器元素
    const listDiv = document.getElementById('calendar-list');
    if (!listDiv) return;

    // 依日期排序活動 (舊 -> 新)
    calendarEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = '';
    // 如果沒有活動
    if (calendarEvents.length === 0) {
        html = '<p style="color:#999; text-align:center;">😴 目前無活動</p>';
    } else {
        // 遍歷所有活動
        calendarEvents.forEach((event, index) => {
            const isPast = new Date(event.date) < new Date().setHours(0,0,0,0);// 判斷該活動是否已過期 (日期小於今天)
            const style = isPast ? 'opacity: 0.5;' : '';// 過期的活動顯示半透明
            
            // 組合 HTML
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
    // 寫入 HTML
    listDiv.innerHTML = html;
}

// 月曆格子渲染邏輯
function renderMonthGrid() {
    const gridDiv = document.getElementById('calendar-grid');// 取得網格容器
    const titleDiv = document.getElementById('calendar-month-year');// 取得標題容器 (顯示年月)
    if (!gridDiv || !titleDiv) return;

    // 取得目前的年份與月份
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); // 注意：0-11 代表 1-12 月

    // 1. 先計算「第幾週」文字 (防止變數未定義錯誤)
    let weekInfoText = "";
    
    // 檢查全域變數 semesterStartDate (開學日) 是否存在且有效
    if (typeof semesterStartDate !== 'undefined' && semesterStartDate) {
        const start = new Date(semesterStartDate);
        const currentMonthEnd = new Date(year, month + 1, 0);// 本月最後一天

        // 簡單判斷：如果這個月在學期開學日之後
        if (currentMonthEnd >= start) {
            // 本月第一天
            const currentMonthStart = new Date(year, month, 1);
            // 計算時間差
            const diffTime = currentMonthStart - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // 計算是第幾週
            let startWeek = Math.ceil(diffDays / 7);
            
            // 修正顯示：如果是負的(開學前)，或剛好第1週，最小顯示為 1
            if (startWeek < 1) startWeek = 1; 
            
            // 只有在合理範圍內才顯示 (避免寒暑假顯示奇怪的週次)
            if (startWeek > -10 && startWeek < 30) {
                weekInfoText = `<span style="font-size:0.8rem; color:var(--primary); margin-left:10px;">(約 第${startWeek}週起)</span>`;
            }
        }
    }

    // 2. 更新標題文字 (年月 + 週次資訊)
    titleDiv.innerHTML = `${year}年 ${month + 1}月 ${weekInfoText}`;

    // 3. 準備月曆格子的 HTML 標頭 (星期幾)
    let html = `
        <div class="cal-day-header" style="color:#e74c3c">日</div>
        <div class="cal-day-header">一</div>
        <div class="cal-day-header">二</div>
        <div class="cal-day-header">三</div>
        <div class="cal-day-header">四</div>
        <div class="cal-day-header">五</div>
        <div class="cal-day-header" style="color:#e74c3c">六</div>
    `;

    const firstDay = new Date(year, month, 1).getDay();// 計算當月第一天是星期幾 (0=週日, 1=週一...)
    const daysInMonth = new Date(year, month + 1, 0).getDate();// 計算當月總共有幾天 (下個月的第0天 = 本月最後一天)

    // 4. 補前面的空白格子 (上個月的日期位置)
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day cal-other-month"></div>`;
    }

    // 5. 填入當月日期
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;// 判斷是否為「現在這個月」(用於標示今天)

    // 準備活動日期的 Set 以便快速查詢 (將所有活動日期轉為字串集合)
    const eventDates = new Set();
    calendarEvents.forEach(e => eventDates.add(e.date));

    // 迴圈產生 1 ~ 最後一天的格子
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = isCurrentMonth && today.getDate() === d;// 判斷是否為今天
        const className = isToday ? 'cal-day cal-today' : 'cal-day';// 設定 CSS 類別
        
        // 補零格式化成 YYYY-MM-DD (例如 2026-01-05)
        const mStr = (month + 1).toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;
        
        const hasEvent = eventDates.has(dateStr);// 檢查這一天是否有活動
        const dotHtml = hasEvent ? '<div class="cal-dot"></div>' : '';// 如果有活動，加入紅點 HTML

        // 組合格子 HTML
        html += `<div class="${className}">
                    <span>${d}</span>
                    ${dotHtml}
                 </div>`;
    }
    gridDiv.innerHTML = html;// 寫入 HTML
}

// 切換月份函式
function changeMonth(offset) {
    // 調整目前檢視的月份 (+1 或 -1)
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderMonthGrid();// 重新渲染月曆
}

// 開啟新增活動 Modal
function openCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'flex';
    document.getElementById('input-cal-date').value = '';
    document.getElementById('input-cal-title').value = '';
}

// 關閉新增活動 Modal
function closeCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'none';
}

// 新增活動邏輯
function addCalendarEvent() {
    // 取得輸入資料
    const date = document.getElementById('input-cal-date').value;
    const title = document.getElementById('input-cal-title').value;

    // 驗證
    if (date && title) {
        calendarEvents.push({ date, title });// 加入陣列
        saveData();// 存檔
        closeCalendarModal();// 關閉 Modal
        renderCalendar(); // 重新渲染
    } else {
        // 錯誤提示
        if(window.showAlert) showAlert("請輸入日期與名稱");
        else alert("請輸入日期與名稱");
    }
}

// 刪除活動邏輯
function deleteCalendarEvent(index) {
    // 執行刪除的內部函式
    const doDelete = () => {
        calendarEvents.splice(index, 1);
        saveData();
        renderCalendar();
    };

    // 支援自訂 Confirm 或原生 confirm
    if(window.showConfirm) {
        showConfirm("確定刪除此活動？").then(ok => { if(ok) doDelete(); });
    } else {
        if(confirm("確定刪除此活動？")) doDelete();
    }
}