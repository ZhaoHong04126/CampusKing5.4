window.showAlert = function(message, title = "💡 提示") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if(!modal) { alert(message); resolve(); return; }
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        document.getElementById('custom-modal-input-container').style.display = 'none';
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `<button class="btn" onclick="closeCustomModal(true)" style="flex:1; max-width:120px;">好，知道了</button>`;
        window._customModalResolve = resolve;
        modal.style.display = 'flex';
    });
}
window.showConfirm = function(message, title = "❓ 確認") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if(!modal) { resolve(confirm(message)); return; }
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        document.getElementById('custom-modal-input-container').style.display = 'none';
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(false)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(true)" style="flex:1;">確定</button>
        `;
        window._customModalResolve = resolve;
        modal.style.display = 'flex';
    });
}
window.showPrompt = function(message, defaultValue = "", title = "✏️ 輸入") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if(!modal) { resolve(prompt(message, defaultValue)); return; }
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        const inputContainer = document.getElementById('custom-modal-input-container');
        const input = document.getElementById('custom-modal-input');
        inputContainer.style.display = 'block';
        input.value = defaultValue;
        input.focus();
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(null)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(document.getElementById('custom-modal-input').value)" style="flex:1;">確定</button>
        `;
        window._customModalResolve = resolve;
        modal.style.display = 'flex';
    });
}
window.closeCustomModal = function(result) {
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'none';
    if (window._customModalResolve) {
        window._customModalResolve(result);
        window._customModalResolve = null;
    }
}
window.addEventListener('popstate', (event) => {
    const targetView = event.state ? event.state.view : 'home';
    switchTab(targetView, false);
});
function goBack() {
    if (window.history.state && window.history.state.view !== 'home') {
        window.history.back();
    } else {
        switchTab('home');
    }
}
function switchTab(tabName, addToHistory = true) {
    const views = [
        'home', 'schedule', 'calendar', 
        'info', 'settings', 'chart', 
        'credits', 'regular', 'midterm', 
        'grades', 'exams-hub', 'grade-manager', 
        'accounting', 'notes', 'anniversary', 
        'learning',
    ];
    views.forEach(view => {
        const el = document.getElementById('view-' + view);
        if (el) el.style.display = 'none';
        
        const btn = document.getElementById('btn-' + view);
        if (btn) btn.classList.remove('active');
    });
    const targetView = document.getElementById('view-' + tabName);
    if (targetView) targetView.style.display = 'block';
    const targetBtn = document.getElementById('btn-' + tabName);
    if (targetBtn) targetBtn.classList.add('active');
    const backBtn = document.getElementById('nav-back-btn');
    const titleEl = document.getElementById('app-title');
    if (tabName === 'home') {
        if (backBtn) backBtn.style.display = 'none';
        if (titleEl) titleEl.innerText = '📅 校園王';
    } else {
        if (backBtn) backBtn.style.display = 'block';
        let pageTitle = "校園王";
        switch(tabName) {
            case 'schedule': pageTitle = "我的課表"; break;
            case 'calendar': pageTitle = "學期行事曆"; break;
            case 'grade-manager': pageTitle = "成績管理"; break;
            case 'accounting': pageTitle = "學期記帳"; break;
            case 'settings': pageTitle = "個人設定"; break;
            case 'info': pageTitle = "系統資訊"; break;
            case 'notes': pageTitle = "記事本"; break;
            case 'anniversary': pageTitle = "紀念日"; break;
        }
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.innerText = pageTitle;
    }
    if (addToHistory) {
        if (tabName !== 'home') {
            history.pushState({ view: tabName }, null, `#${tabName}`);
        } else {
            history.pushState({ view: 'home' }, null, './');
        }
    }
    if (tabName === 'schedule') {
        switchDay(currentDay);
    }
    if (tabName === 'calendar') {
        if (typeof renderCalendar === 'function') renderCalendar();
    }
    if (tabName === 'info') loadAnnouncements();
    if (tabName === 'grade-manager' && typeof switchGradeTab === 'function') switchGradeTab('dashboard');
    if (tabName === 'accounting') {
        if (typeof switchAccTab === 'function') switchAccTab('summary');
        else if (typeof renderAccounting === 'function') renderAccounting();
    }
    if (tabName === 'learning') {
    if (typeof renderLearning === 'function') renderLearning();
}
}
function checkAdminStatus() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    if (currentUser && currentUser.uid === ADMIN_UID) adminPanel.style.display = 'block';
    else adminPanel.style.display = 'none';
}
function addAdminInfo() {
    const newInfoText = document.getElementById('admin-new-info').value;
    if (!newInfoText) return showAlert("請輸入內容");
    db.collection("announcements").add({
        content: newInfoText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        author: currentUser.uid
    })
    .then(() => {
        showAlert("公告已發布至雲端！", "成功");
        document.getElementById('admin-new-info').value = "";
        loadAnnouncements();
    })
    .catch((error) => {
        showAlert("發布失敗：" + error.message, "錯誤");
    });
}
function loadAnnouncements() {
    const infoContent = document.getElementById('info-content');
    if (!infoContent) return;
    const oldList = document.getElementById('announcement-list');
    if (oldList) oldList.remove();
    const listContainer = document.createElement('div');
    listContainer.id = 'announcement-list';
    listContainer.style.marginTop = '15px';
    listContainer.innerHTML = '<p style="color:#999;">正在載入最新公告...</p>';
    infoContent.appendChild(listContainer);
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).get()
    .then((querySnapshot) => {
        let html = '<h4 style="color: var(--primary); margin-top:20px;">📢 最新公告</h4>';
        if (querySnapshot.empty) {
            html += '<p style="color:#666; font-size:0.9rem;">目前沒有新公告。</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id;
                let dateStr = "剛剛";
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
                }
                let adminBtns = '';
                if (currentUser && currentUser.uid === ADMIN_UID) {
                    const safeContent = encodeURIComponent(data.content);
                    adminBtns = `
                        <div style="margin-top: 8px; text-align: right; border-top: 1px dashed #ddd; padding-top: 5px;">
                            <button onclick="editAnnouncement('${docId}', '${safeContent}')" style="background:transparent; border:none; color:#f39c12; cursor:pointer; font-size:0.85rem; margin-right:10px;">✏️ 編輯</button>
                            <button onclick="deleteAnnouncement('${docId}')" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size:0.85rem;">🗑️ 刪除</button>
                        </div>
                    `;
                }
                html += `
                <div style="background: var(--bg); padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--warning);">
                    <div style="font-size: 0.95rem; color: var(--text-main); white-space: pre-wrap;">${data.content}</div>
                    <div style="text-align: right; font-size: 0.75rem; color: var(--text-sub); margin-top: 5px;">
                        ${dateStr}
                    </div>
                    ${adminBtns}
                </div>`;
            });
        }
        listContainer.innerHTML = html;
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
        listContainer.innerHTML = '<p style="color:var(--danger);">無法載入公告 (請確認網路)</p>';
    });
}
function initUI() {
    loadTheme();
    document.getElementById('user-badge').innerText = userType === 'university' ? '大學部' : '高中部';
    const uniElements = document.querySelectorAll('.uni-only');
    uniElements.forEach(el => el.style.display = 'table-cell'); 
    switchDay(currentDay);
    loadGrades();
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}
let isEditingCredits = false;
function renderCreditSettings() {
    const viewContainer = document.getElementById('credits-view-mode');
    const editContainer = document.getElementById('category-settings-inputs');
    const gradInput = document.getElementById('edit-grad-target');
    if (!viewContainer || !editContainer) return;
    if (gradInput) gradInput.value = graduationTarget;
    let viewHtml = `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
                        <span>🏁 畢業總學分</span>
                        <span style="font-weight:bold; color:var(--primary);">${graduationTarget}</span>
                    </div>`;
    let editHtml = '';
    const order = ["通識", "院共同", "基礎", "核心", "專業", "自由"];
    order.forEach(cat => {
        const target = categoryTargets[cat];
        let targetText = '';
        if (typeof target === 'object') {
            targetText = `必${target['必修']} / 選${target['選修']}`;
        } else {
            targetText = `${target}`;
        }
        viewHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                <span style="color:var(--text-sub);">${cat}</span>
                <span>${targetText}</span>
             </div>`;
        editHtml += `<div style="margin-bottom: 12px;">
                        <div style="font-weight: bold; color: var(--text-main); margin-bottom: 5px; font-size:0.9rem;">${cat}</div>
                        <div style="display: flex; gap: 10px;">`;
        if (typeof target === 'object') {
            editHtml += `
                <div style="flex: 1;">
                    <span style="font-size: 0.8rem; color: var(--text-main);">必修</span>
                    <input type="number" id="input-${cat}-req" value="${target['必修'] || 0}" 
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="flex: 1;">
                    <span style="font-size: 0.8rem; color: var(--text-main);">選修</span>
                    <input type="number" id="input-${cat}-ele" value="${target['選修'] || 0}" 
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>`;
        } else {
            editHtml += `
                <div style="flex: 1;">
                    <input type="number" id="input-${cat}-total" value="${target || 0}" 
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>`;
        }
        editHtml += `</div></div>`;
    });
    viewContainer.innerHTML = viewHtml;
    editContainer.innerHTML = editHtml;
}
function toggleCreditEdit() {
    isEditingCredits = !isEditingCredits;
    const viewDiv = document.getElementById('credits-view-mode');
    const editDiv = document.getElementById('credits-edit-mode');
    const btn = document.getElementById('btn-edit-credits');
    if (isEditingCredits) {
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none';
    } else {
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block';
        renderCreditSettings();
    }
}
function renderCreditSettings() {
    const gradInput = document.getElementById('edit-grad-target');
    const textGradTarget = document.getElementById('text-grad-target');
    const viewUni = document.getElementById('view-settings-uni');
    const editUni = document.getElementById('edit-settings-uni');
    const viewHs = document.getElementById('view-settings-hs');
    const editHs = document.getElementById('edit-settings-hs');
    if (!viewUni || !viewHs) return;
    if (gradInput) gradInput.value = graduationTarget;
    if (textGradTarget) textGradTarget.innerText = graduationTarget;
    let viewHtml = '';
    let editHtml = '';
    if (userType === 'highschool') {
        viewUni.style.display = 'none';
        editUni.style.display = 'none';
        viewHs.style.display = 'block';
        editHs.style.display = 'block';
        ["必修", "選修"].forEach(type => {
            const target = categoryTargets[type] || 0;
            viewHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                <span style="color:var(--text-sub);">${type}</span>
                <span>${target}</span>
             </div>`;
            editHtml += `<div style="margin-bottom: 12px;">
                <div style="font-weight: bold; color: var(--text-main); margin-bottom: 5px; font-size:0.9rem;">${type}學分</div>
                <input type="number" id="input-hs-${type}" value="${target}" 
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>`;
        });
        viewHs.innerHTML = viewHtml;
        editHs.innerHTML = editHtml;
    } else {
        viewUni.style.display = 'block';
        editUni.style.display = 'block';
        viewHs.style.display = 'none';
        editHs.style.display = 'none';
        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由"];
        order.forEach(cat => {
            const target = categoryTargets[cat];
            let targetText = typeof target === 'object' ? `必${target['必修']} / 選${target['選修']}` : `${target}`;
            viewHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                    <span style="color:var(--text-sub);">${cat}</span>
                    <span>${targetText}</span>
                </div>`;
            editHtml += `<div style="margin-bottom: 12px;">
                            <div style="font-weight: bold; color: var(--text-main); margin-bottom: 5px; font-size:0.9rem;">${cat}</div>
                            <div style="display: flex; gap: 10px;">`;
            if (typeof target === 'object') {
                editHtml += `
                    <div style="flex: 1;"><span style="font-size: 0.8rem;">必修</span><input type="number" id="input-${cat}-req" value="${target['必修']||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>
                    <div style="flex: 1;"><span style="font-size: 0.8rem;">選修</span><input type="number" id="input-${cat}-ele" value="${target['選修']||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            } else {
                editHtml += `<div style="flex: 1;"><input type="number" id="input-${cat}-total" value="${target||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            }
            editHtml += `</div></div>`;
        });
        viewUni.innerHTML = viewHtml;
        editUni.innerHTML = editHtml;
    }
}
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}
function updateThemeUI(theme) {
    const statusEl = document.getElementById('theme-status');
    if (statusEl) {
        statusEl.innerText = theme === 'dark' ? 'ON' : 'OFF';
        statusEl.style.color = theme === 'dark' ? '#2ecc71' : '#ccc';
    }
    if (window.gradeChartInstance) {}
}
function exportSchedule() {
    const table = document.querySelector('.weekly-table');
    if (!table) return;
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ 處理中...";
    html2canvas(table, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `我的課表_${currentSemester || 'export'}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.innerHTML = originalText;
        showAlert("課表圖片已下載至您的裝置！", "匯出成功");
    }).catch(err => {
        console.error(err);
        btn.innerHTML = originalText;
        showAlert("圖片製作失敗，請稍後再試", "錯誤");
    });
}
function editAnnouncement(docId, encodedContent) {
    const oldContent = decodeURIComponent(encodedContent);
    showPrompt("修改公告內容：", oldContent, "✏️ 編輯公告")
    .then((newContent) => {
        if (newContent !== null && newContent.trim() !== "") {
            db.collection("announcements").doc(docId).update({
                content: newContent,
            })
            .then(() => {
                showAlert("公告已更新！", "成功");
                loadAnnouncements();
            })
            .catch((error) => {
                showAlert("更新失敗：" + error.message, "錯誤");
            });
        }
    });
}
function deleteAnnouncement(docId) {
    showConfirm("確定要永久刪除這則公告嗎？", "🗑️ 刪除確認")
    .then((isConfirmed) => {
        if (isConfirmed) {
            db.collection("announcements").doc(docId).delete()
            .then(() => {
                showAlert("公告已刪除。", "完成");
                loadAnnouncements();
            })
            .catch((error) => {
                showAlert("刪除失敗：" + error.message, "錯誤");
            });
        }
    });

}
function saveCreditSettings() {
    const gradInput = document.getElementById('edit-grad-target');
    if (gradInput) {
        graduationTarget = parseInt(gradInput.value) || 128;
    }
    if (userType === 'highschool') {
        ["必修", "選修"].forEach(type => {
            const el = document.getElementById(`input-hs-${type}`);
            if (el) {
                categoryTargets[type] = parseInt(el.value) || 0;
            }
        });
    } else {
        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由"];
        order.forEach(cat => {
            const reqInput = document.getElementById(`input-${cat}-req`);
            const eleInput = document.getElementById(`input-${cat}-ele`);
            const totalInput = document.getElementById(`input-${cat}-total`);
            if (reqInput && eleInput) {
                categoryTargets[cat] = {
                    "必修": parseInt(reqInput.value) || 0,
                    "選修": parseInt(eleInput.value) || 0
                };
            } else if (totalInput) {
                categoryTargets[cat] = parseInt(totalInput.value) || 0;
            }
        });
    }
    saveData();
    renderCreditSettings();
    if (typeof renderAnalysis === 'function') renderAnalysis(); 
    showAlert("學分標準設定已儲存！", "成功");
    toggleCreditEdit();
}
