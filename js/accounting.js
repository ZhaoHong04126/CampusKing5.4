// --- 負責記帳(記帳功能的主要邏輯) ---

let currentAccTab = 'summary';

function renderAccounting() {
    let totalIncome = 0;
    let totalExpense = 0;
    
    accountingList.sort((a, b) => new Date(b.date) - new Date(a.date));
    accountingList.forEach(item => {
        const amount = parseInt(item.amount) || 0;
        if (item.type === 'income') totalIncome += amount;
        else totalExpense += amount;
    });

    const summaryIncome = document.getElementById('acc-summary-income');
    const summaryExpense = document.getElementById('acc-summary-expense');
    const summaryBalance = document.getElementById('acc-summary-balance');
    
    if (summaryIncome) {
        summaryIncome.innerText = `$${totalIncome}`;
        summaryExpense.innerText = `$${totalExpense}`;
        const balance = totalIncome - totalExpense;
        summaryBalance.innerText = `$${balance}`;
        summaryBalance.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';
    }

    if (currentAccTab === 'details') renderAccDetails();
    else if (currentAccTab === 'chart') renderAccChart();
    else if (currentAccTab === 'daily') renderAccDaily();
}

function switchAccTab(tabName) {
    currentAccTab = tabName;
    
    const tabs = ['summary', 'details', 'chart', 'daily'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-acc-${t}`);
        const view = document.getElementById(`view-acc-${t}`);
        if (btn) btn.classList.remove('active');
        if (view) view.style.display = 'none';
    });

    document.getElementById(`btn-acc-${tabName}`).classList.add('active');
    document.getElementById(`view-acc-${tabName}`).style.display = 'block';

    renderAccounting();
}

function renderAccDetails() {
    const listBody = document.getElementById('accounting-list-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    if (accountingList.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="no-class">💰 目前無收支紀錄</td></tr>';
    } else {
        accountingList.forEach((item, index) => {
            const amount = parseInt(item.amount) || 0;
            const typeLabel = item.type === 'income' ? '<span class="badge-income">收入</span>' : '<span class="badge-expense">支出</span>';
            const amountColor = item.type === 'income' ? 'color: #2ecc71;' : 'color: #e74c3c;';
            const sign = item.type === 'income' ? '+' : '-';

            listBody.innerHTML += `
                <tr>
                    <td>${item.date}</td>
                    <td>${typeLabel} ${item.title}</td>
                    <td style="font-weight:bold; ${amountColor}">${sign}$${amount}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteTransaction(${index})" style="padding:4px 8px;">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }
}

function renderAccChart() {
    const ctx = document.getElementById('accountingChart');
    if (!ctx) return;

    const monthlyData = {};
    const allMonths = new Set();

    accountingList.forEach(item => {
        const month = item.date.substring(0, 7);
        allMonths.add(month);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        
        const amount = parseInt(item.amount) || 0;
        if (item.type === 'income') monthlyData[month].income += amount;
        else monthlyData[month].expense += amount;
    });

    const sortedMonths = Array.from(allMonths).sort();
    const labels = sortedMonths;
    const dataIncome = sortedMonths.map(m => monthlyData[m].income);
    const dataExpense = sortedMonths.map(m => monthlyData[m].expense);
    const dataBalance = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);

    if (accChartInstance) accChartInstance.destroy();

    accChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: '結餘',
                    data: dataBalance,
                    borderColor: '#f1c40f', 
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    order: 0
                },
                {
                    label: '收入',
                    data: dataIncome,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1,
                    order: 1
                },
                {
                    label: '支出',
                    data: dataExpense,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
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
                y: { beginAtZero: true }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

function renderAccDaily() {
    const listBody = document.getElementById('daily-acc-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    const dailyData = {};
    
    accountingList.forEach(item => {
        const date = item.date;
        if (!dailyData[date]) dailyData[date] = { income: 0, expense: 0 };
        
        const amount = parseInt(item.amount) || 0;
        if (item.type === 'income') dailyData[date].income += amount;
        else dailyData[date].expense += amount;
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="no-class">📅 無資料</td></tr>';
        return;
    }

    sortedDates.forEach(date => {
        const d = dailyData[date];
        const net = d.income - d.expense;
        const netColor = net >= 0 ? '#2ecc71' : '#e74c3c';
        const netSign = net >= 0 ? '+' : '';

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

function openAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'flex';
    document.getElementById('input-acc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('input-acc-title').value = '';
    document.getElementById('input-acc-amount').value = '';
    document.getElementById('input-acc-type').value = 'expense';
}

function closeAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'none';
}

function addTransaction() {
    const date = document.getElementById('input-acc-date').value;
    const title = document.getElementById('input-acc-title').value;
    const amount = document.getElementById('input-acc-amount').value;
    const type = document.getElementById('input-acc-type').value;

    if (!date || !title || !amount) {
        showAlert("請輸入完整資料", "資料不全");
        return;
    }

    const newItem = {
        date: date,
        title: title,
        amount: parseInt(amount),
        type: type 
    };

    accountingList.push(newItem);
    saveData();
    closeAccountingModal();
    renderAccounting();
    showAlert("記帳成功！", "完成");
}

function deleteTransaction(index) {
    showConfirm("確定要刪除這筆紀錄嗎？", "刪除確認").then(ok => {
        if (ok) {
            accountingList.splice(index, 1);
            saveData();
            renderAccounting();
        }
    });
}