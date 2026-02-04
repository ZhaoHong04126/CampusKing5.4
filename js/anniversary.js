// 渲染紀念日列表
function renderAnniversaries() {
    const listDiv = document.getElementById('anniversary-list');
    if (!listDiv) return;

    // 排序：依照日期先後排序
    anniversaryList.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = '';
    const now = new Date();
    // 將現在時間設為當天的 00:00:00，避免計算誤差
    now.setHours(0,0,0,0);

    if (anniversaryList.length === 0) {
        html = '<p style="color:#999; text-align:center; padding: 20px;">💝 新增第一個到數日吧！<br>(例如：交往紀念、生日倒數)</p>';
    } else {
        anniversaryList.forEach((item, index) => {
            const targetDate = new Date(item.date);
            targetDate.setHours(0,0,0,0);
            
            // 計算時間差 (毫秒)
            const diffTime = now - targetDate;
            // 換算成天數 (毫秒 -> 秒 -> 分 -> 時 -> 天)
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            let statusText = "";
            let daysText = "";
            let colorClass = "";

            if (diffDays === 0) {
                statusText = "就是今天！";
                daysText = "TODAY";
                colorClass = "color: #e74c3c; font-weight:bold;"; // 紅色
            } else if (diffDays > 0) {
                statusText = "已過去";
                daysText = `${diffDays} 天`;
                colorClass = "color: #7f8c8d;"; // 灰色
            } else {
                statusText = "還有";
                daysText = `${Math.abs(diffDays)} 天`;
                colorClass = "color: #27ae60; font-weight:bold;"; // 綠色
            }

            html += `
            <div style="background: white; border-bottom: 1px solid #eee; padding: 15px 0; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin-bottom: 4px;">${item.title}</div>
                    <div style="font-size: 0.85rem; color: #888;">${item.date} (${statusText})</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size: 1.4rem; ${colorClass}">${daysText}</div>
                    <button onclick="deleteAnniversary(${index})" style="background:transparent; border:none; color:#e74c3c; font-size:0.8rem; cursor:pointer; margin-top:5px; opacity: 0.7;">🗑️ 刪除</button>
                </div>
            </div>`;
        });
    }
    listDiv.innerHTML = html;
}

// 開啟新增視窗
function openAnniversaryModal() {
    document.getElementById('anniversary-modal').style.display = 'flex';
    document.getElementById('input-anniv-title').value = '';
    document.getElementById('input-anniv-date').value = '';
}

// 關閉視窗
function closeAnniversaryModal() {
    document.getElementById('anniversary-modal').style.display = 'none';
}

// 新增紀念日
function addAnniversary() {
    const title = document.getElementById('input-anniv-title').value;
    const date = document.getElementById('input-anniv-date').value;

    if (!title || !date) {
        showAlert("請輸入標題與日期", "資料不全");
        return;
    }

    anniversaryList.push({ title, date });
    saveData();
    closeAnniversaryModal();
    renderAnniversaries();
    showAlert("紀念日已新增！", "成功");
}

// 刪除紀念日
function deleteAnniversary(index) {
    showConfirm("確定要刪除這個紀念日嗎？", "刪除確認").then(ok => {
        if (ok) {
            anniversaryList.splice(index, 1);
            saveData();
            renderAnniversaries();
        }
    });
}