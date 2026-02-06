// --- 負責記帳(記帳功能的主要邏輯) ---

// 定義目前選中的記帳分頁，預設為 'summary' (總覽)
let currentAccTab = 'summary';
// -1 代表新增模式，大於 -1 代表正在編輯某筆資料
let editingAccountingIndex = -1; 

// 渲染記帳頁面的主函式
function renderAccounting() {
    let totalIncome = 0;// 初始化總收入
    let totalExpense = 0;// 初始化總支出
    // 每次渲染時，確保下拉選單是最新的
    updatePaymentMethodOptions();
    
    // 將記帳列表依照日期進行排序（新的日期在前）
    accountingList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 遍歷每一筆記帳資料來計算總收支
    accountingList.forEach(item => {
        // 將金額轉為整數，若無效則設為 0
        const amount = parseInt(item.amount) || 0;
        // 如果類型是收入，則加到總收入
        if (item.type === 'income') totalIncome += amount;
        // 否則（是支出），加到總支出
        else totalExpense += amount;
    });

    const summaryIncome = document.getElementById('acc-summary-income');// 取得顯示總收入的 DOM 元素
    const summaryExpense = document.getElementById('acc-summary-expense');// 取得顯示總支出的 DOM 元素
    const summaryBalance = document.getElementById('acc-summary-balance');// 取得顯示結餘的 DOM 元素
    
    // 如果 DOM 元素存在，則更新介面顯示
    if (summaryIncome) {
        summaryIncome.innerText = `$${totalIncome}`;// 更新收入文字
        summaryExpense.innerText = `$${totalExpense}`;// 更新支出文字
        const balance = totalIncome - totalExpense;// 計算結餘（收入 - 支出）
        summaryBalance.innerText = `$${balance}`;// 更新結餘文字
        summaryBalance.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';// 根據結餘正負設定顏色（正為綠色，負為紅色）
    }

    // 根據目前的分頁狀態，呼叫對應的渲染函式
    if (currentAccTab === 'details') renderAccDetails();// 如果是 'details' (明細) 分頁
    else if (currentAccTab === 'chart') renderAccChart();// 如果是 'chart' (圖表) 分頁
    else if (currentAccTab === 'daily') renderAccDaily();// 如果是 'daily' (日統計) 分頁
    else if (currentAccTab === 'accounts') renderAccAccounts();// 如果是帳戶分頁，就渲染帳戶列表
}

// 切換記帳分頁的函式
function switchAccTab(tabName) {
    // 更新全域變數 currentAccTab 為新的分頁名稱
    currentAccTab = tabName;
    
    // 定義所有可能的分頁名稱陣列
    const tabs = ['summary', 'details', 'chart', 'daily','accounts'];
    // 遍歷所有分頁以重置狀態
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-acc-${t}`);// 取得該分頁按鈕元素
        const view = document.getElementById(`view-acc-${t}`);// 取得該分頁內容區塊元素
        if (btn) btn.classList.remove('active');// 移除按鈕的 active 樣式
        if (view) view.style.display = 'none';// 隱藏該分頁的內容
    });
    const activeBtn = document.getElementById(`btn-acc-${tabName}`);
    const activeView = document.getElementById(`view-acc-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.style.display = 'block';
    // 重新執行渲染函式以更新資料
    renderAccounting();
}

// 渲染收支明細列表
function renderAccDetails() {
    const listBody = document.getElementById('accounting-list-body');// 取得列表的 tbody 元素
    if (!listBody) return;// 若找不到元素則結束
    listBody.innerHTML = '';// 清空目前的列表內容

    // 如果沒有任何記帳資料
    if (accountingList.length === 0) {
        // 顯示無資料的提示訊息
        listBody.innerHTML = '<tr><td colspan="5" class="no-class">💰 目前無收支紀錄</td></tr>';
        return;
    }
        // 遍歷資料列表逐一產生 HTML
    accountingList.forEach((item, index) => {
        const amount = parseInt(item.amount) || 0;
        const typeLabel = item.type === 'income' 
            ? '<span class="badge-income">收入</span>' 
            : '<span class="badge-expense">支出</span>';
        const amountColor = item.type === 'income' ? 'color: #2ecc71;' : 'color: #e74c3c;';
        const sign = item.type === 'income' ? '+' : '-';
        const method = item.method || '現金';

        listBody.innerHTML += `
            <tr>
                <td>${item.date}</td>
                <td style="text-align: left;">
                    ${typeLabel} ${item.title}
                </td>
                <td>
                    <span style="background-color: #f3e5f5; color: #8e24aa; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">
                        ${method}
                    </span>
                </td>
                <td style="font-weight:bold; ${amountColor}">${sign}$${amount}</td>
                <td>
                    <button class="btn-edit" onclick="editTransaction(${index})" style="padding:4px 8px; margin-right:5px;">✏️</button>
                    <button class="btn-delete" onclick="deleteTransaction(${index})" style="padding:4px 8px;">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// 渲染收支圖表 (Chart.js)
function renderAccChart() {
    const ctx = document.getElementById('accountingChart');// 取得 Canvas 元素
    if (!ctx) return;// 若無 Canvas 則結束

    
    const monthlyData = {};// 用來儲存每月的數據物件
    const allMonths = new Set();// 用 Set 來儲存所有出現過的月份 (去重複)

    // 遍歷所有記帳資料進行統計
    accountingList.forEach(item => {
        const month = item.date.substring(0, 7);// 取得月份字串 (例如 "2023-05")
        allMonths.add(month);// 將月份加入 Set
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };// 若該月份尚未在物件中，則初始化為 0
        
        const amount = parseInt(item.amount) || 0;// 解析金額
        // 累加收入或支出
        if (item.type === 'income') monthlyData[month].income += amount;
        else monthlyData[month].expense += amount;
    });

    
    const sortedMonths = Array.from(allMonths).sort();// 將月份排序
    const labels = sortedMonths;// 設定圖表標籤為排序後的月份
    const dataIncome = sortedMonths.map(m => monthlyData[m].income);// 準備收入數據陣列
    const dataExpense = sortedMonths.map(m => monthlyData[m].expense);// 準備支出數據陣列
    const dataBalance = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);// 準備結餘數據陣列 (收入 - 支出)

    // 如果舊的圖表實例存在，先銷毀它以免重複繪製
    if (accChartInstance) accChartInstance.destroy();

    // 建立新的 Chart 實例
    accChartInstance = new Chart(ctx, {
        type: 'bar', // 設定為長條圖
        data: {
            labels: labels, // X 軸標籤
            datasets: [
                {
                    type: 'line', // 混合圖表：結餘使用折線圖
                    label: '結餘',
                    data: dataBalance,
                    borderColor: '#f1c40f', // 黃色線條
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    order: 0 // 層級最高，顯示在最上層
                },
                {
                    label: '收入',
                    data: dataIncome,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)', // 綠色
                    borderColor: '#2ecc71',
                    borderWidth: 1,
                    order: 1
                },
                {
                    label: '支出',
                    data: dataExpense,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)', // 紅色
                    borderColor: '#e74c3c',
                    borderWidth: 1,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true } // Y 軸從 0 開始
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false } // Tooltip 設定
            }
        }
    });
}

// 渲染每日收支統計
function renderAccDaily() {
    const listBody = document.getElementById('daily-acc-body');// 取得 tbody 元素
    if (!listBody) return;// 若無元素則結束
    listBody.innerHTML = '';// 清空內容

    // 用來儲存每日數據的物件
    const dailyData = {};
    
    // 遍歷資料進行每日統計
    accountingList.forEach(item => {
        const date = item.date;
        // 初始化該日期
        if (!dailyData[date]) dailyData[date] = { income: 0, expense: 0 };
        
        const amount = parseInt(item.amount) || 0;
        // 累加數據
        if (item.type === 'income') dailyData[date].income += amount;
        else dailyData[date].expense += amount;
    });

    // 取得所有日期並排序 (新的在前)
    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));

    // 若無資料顯示提示
    if (sortedDates.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="no-class">📅 無資料</td></tr>';
        return;
    }

    // 產生每一日的統計列
    sortedDates.forEach(date => {
        const d = dailyData[date];
        const net = d.income - d.expense;// 計算淨收支
        const netColor = net >= 0 ? '#2ecc71' : '#e74c3c';// 設定顏色
        const netSign = net >= 0 ? '+' : '';// 設定正號

        // 插入 HTML
        listBody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td style="color:#2ecc71;">$${d.income}</td>
                <td style="color:#e74c3c;">$${d.expense}</td>
                <td style="font-weight:bold; color:${netColor};">${netSign}$${net}</td>
            </tr>
        `;
    });
}

// 開啟新增記帳視窗
function openAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'flex';// 顯示 Modal
    document.getElementById('input-acc-date').value = new Date().toISOString().split('T')[0];// 預設日期為今天
    document.getElementById('input-acc-title').value = '';// 清空標題
    document.getElementById('input-acc-amount').value = '';// 清空金額
    document.getElementById('input-acc-type').value = 'expense';// 預設類型為支出
    document.getElementById('input-acc-method').value = '現金';// 預設重置為現金

    // 預設清空
    document.getElementById('input-acc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('input-acc-title').value = '';
    document.getElementById('input-acc-amount').value = '';
    document.getElementById('input-acc-type').value = 'expense';
    
    // 更新下拉選單
    if (typeof updatePaymentMethodOptions === 'function') updatePaymentMethodOptions();
    
    // ✨ 重置編輯狀態 (變回新增模式)
    editingAccountingIndex = -1;
    const btn = document.getElementById('btn-save-acc');
    if (btn) {
        btn.innerText = "+ 確定新增";
        btn.style.background = "#333";
    }
}

// 關閉新增記帳視窗
function closeAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'none';// 隱藏 Modal
}

// 新增一筆交易
function addTransaction() {
    const date = document.getElementById('input-acc-date').value;// 取得使用者輸入的日期
    const title = document.getElementById('input-acc-title').value;// 取得標題
    const amount = document.getElementById('input-acc-amount').value;// 取得金額
    const type = document.getElementById('input-acc-type').value;// 取得類型
    const method = document.getElementById('input-acc-method').value;// 取得支付方式

    // 檢查資料是否完整
    if (!date || !title || !amount) {
        showAlert("請輸入完整資料", "資料不全");
        return;
    }

    // 建立新資料物件
    const newItem = {
        date: date,
        title: title,
        amount: parseInt(amount), // 轉為整數
        type: type,
        method: method
    };

    if (editingAccountingIndex > -1) {
        // --- 編輯模式：更新舊資料 ---
        accountingList[editingAccountingIndex] = newItem;
        showAlert("修改成功！", "完成");
    } else {
        // --- 新增模式：加入新資料 ---
        accountingList.push(newItem);
        showAlert("記帳成功！", "完成");
    }
    saveData();// 儲存至本地與雲端
    closeAccountingModal();// 關閉視窗
    renderAccounting();// 重新渲染畫面
}

// 刪除交易紀錄
function deleteTransaction(index) {
    // 顯示確認對話框
    showConfirm("確定要刪除這筆紀錄嗎？", "刪除確認").then(ok => {
        // 如果使用者確認
        if (ok) {
            accountingList.splice(index, 1);// 從陣列中移除該筆資料
            saveData();// 存檔
            renderAccounting();// 重新渲染
        }
    });
}

// 渲染帳戶與餘額列表
function renderAccAccounts() {
    const listDiv = document.getElementById('acc-accounts-list');
    if (!listDiv) return;

    let html = '';
    
    // 計算每個帳戶的餘額 (只計算本學期)
    // 邏輯：遍歷記帳列表，依照 method 分類加減
    const balances = {};
    paymentMethods.forEach(method => balances[method] = 0); // 初始化

    accountingList.forEach(item => {
        const method = item.method || '現金'; // 舊資料預設為現金
        const amount = parseInt(item.amount) || 0;
        
        // 如果這個支付方式已經被刪除了，我們還是統計它，或者歸類為"其他"
        if (balances[method] === undefined) balances[method] = 0;

        if (item.type === 'income') balances[method] += amount;
        else balances[method] -= amount;
    });

    // 產生 HTML
    paymentMethods.forEach((method, index) => {
        const bal = balances[method];
        const color = bal >= 0 ? '#2ecc71' : '#e74c3c';
        
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0; border-bottom: 1px solid #eee;">
            <div>
                <div style="font-size: 1rem; font-weight: bold; color: var(--text-main);">${method}</div>
                <div style="font-size: 0.85rem; color: #888;">本學期結餘</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight:bold; color: ${color};">$${bal}</div>
                <button onclick="deletePaymentMethod(${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size:0.8rem; margin-top:5px;">🗑️ 刪除</button>
            </div>
        </div>`;
    });

    listDiv.innerHTML = html;
}

// 更新下拉選單 (給新增記帳視窗用)
function updatePaymentMethodOptions() {
    const select = document.getElementById('input-acc-method');
    if (!select) return;
    
    const currentVal = select.value; // 記住目前選的值

    let optionsHtml = '';
    paymentMethods.forEach(method => {
        optionsHtml += `<option value="${method}">${method}</option>`;
    });
    
    select.innerHTML = optionsHtml;

    // 如果原本選的值還在列表內，就選回去；否則選第一個
    if (paymentMethods.includes(currentVal)) {
        select.value = currentVal;
    }
}

// 新增支付方式
function addPaymentMethod() {
    showPrompt("請輸入新支付方式名稱 (例如: LINE Pay, 私房錢)", "", "新增帳戶")
    .then(name => {
        if (!name) return;// 如果使用者按取消或沒輸入，就停止
        // 檢查是否重複
        if (name) {
            if (paymentMethods.includes(name)) {
                showAlert("這個名稱已經存在囉！");
                return;
            }
        }
        // 輸入初始金額 (預設 0)
        showPrompt(`請輸入「${name}」的初始金額：`, "0", "設定餘額")
        .then(amountStr => {
            // 解析金額，若沒輸入或輸入非數字則為 0
            const amount = parseInt(amountStr) || 0;

            // 新增到支付方式列表
            paymentMethods.push(name);
            
            // 如果有設定初始金額 (大於 0)，自動加入一筆「收入」紀錄
            if (amount > 0) {
                accountingList.push({
                    date: new Date().toISOString().split('T')[0], // 設為今天日期
                    title: "初始餘額", // 固定標題，方便識別
                    amount: amount,
                    type: "income", // 設為收入，這樣餘額才會增加
                    method: name // 指定給這個新帳戶
                });
            }

            saveData(); // 存檔 (包含新列表與新紀錄)
            renderAccounting(); // 刷新畫面 (帳戶頁面會立即顯示餘額)
            
            // 顯示成功訊息
            const msg = amount > 0 ? `已新增「${name}」\n(初始餘額 $${amount})` : `已新增「${name}」`;
            showAlert(msg);
        });
    });
}

// 刪除支付方式
function deletePaymentMethod(index) {
    const target = paymentMethods[index];
    showConfirm(`確定要刪除「${target}」嗎？\n(注意：這不會刪除該帳戶的歷史記帳紀錄，但無法再選擇此方式)`, "刪除確認")
    .then(ok => {
        if (ok) {
            paymentMethods.splice(index, 1);
            saveData();
            renderAccounting();
            showAlert("已刪除");
        }
    });
}

// 編輯交易
function editTransaction(index) {
    // 更改前先詢問
    showConfirm("確定要更改這筆紀錄嗎？", "更改確認").then(ok => {
        if (ok) {
            const item = accountingList[index];
            
            // 開啟視窗
            openAccountingModal(); 
            
            // 填入舊資料
            document.getElementById('input-acc-date').value = item.date;
            document.getElementById('input-acc-title').value = item.title;
            document.getElementById('input-acc-amount').value = item.amount;
            document.getElementById('input-acc-type').value = item.type;
            document.getElementById('input-acc-method').value = item.method || '現金';

            // 設定為編輯模式
            editingAccountingIndex = index;

            // 改變按鈕文字與顏色
            const btn = document.getElementById('btn-save-acc');
            if (btn) {
                btn.innerText = "💾 保存修改";
                btn.style.background = "#f39c12"; // 橘色代表修改
            }
        }
    });
}