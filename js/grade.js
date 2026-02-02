let editingGradeIndex = -1;

function loadGrades() {
    const tb = document.getElementById('grade-body');
    if (!tb) return;
    tb.innerHTML = '';
    let ts = 0, tc = 0, ec = 0;
    
    gradeList.forEach(g => {
        const cr = parseFloat(g.credit) || 1,
            sc = parseFloat(g.score) || 0,
            pass = sc >= 60;

        if (pass) ec += cr;
        ts += sc * cr;
        tc += cr;
        
        tb.innerHTML += `<tr>
            <td>${g.subject}</td>
            <td>${cr}</td>
            <td>${pass ? cr : 0}</td>
            <td style="font-weight:bold; color:${pass ? '#2ecc71' : '#e74c3c'}">${sc}</td>
        </tr>`;
    }); 
    
    let avg = 0; 
    if (tc > 0) avg = ts / tc; 
    document.getElementById('average-score').innerHTML = `加權平均: ${avg.toFixed(1)} <span style="font-size:0.8rem; color:#666;">(實得${ec}學分)</span>`;
}

function renderGradeEditList() {
    const listDiv = document.getElementById('current-grade-list');
    let html = ''; 
    gradeList.forEach((item, i) => {
        const info = `${item.credit}學分 | ${item.score}分`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editGrade(${i})">修改</button>
                <button class="btn-delete" onclick="deleteGrade(${i})">刪除</button>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center">無成績</p>';
}

function editGrade(index) {
    const item = gradeList[index];
    if (!item) return;

    updateExamSubjectOptions(); 

    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    const btn = document.getElementById('btn-toggle-input');
    const optionExists = sel.querySelector(`option[value="${item.subject}"]`);

    if (optionExists) {
        sel.style.display = 'block';
        txt.style.display = 'none';
        btn.innerText = "✏️";
        sel.value = item.subject;
    } else {
        sel.style.display = 'none';
        txt.style.display = 'block';
        btn.innerText = "📜";
        txt.value = item.subject;
    }

    document.getElementById('input-grade-category').value = item.category || '通識';
    document.getElementById('input-grade-nature').value = item.nature || '必修';
    document.getElementById('input-grade-credit').value = item.credit || '';
    document.getElementById('input-grade-score').value = item.score || '';

    editingGradeIndex = index;
    const saveBtn = document.getElementById('btn-add-grade');
    if (saveBtn) {
        saveBtn.innerText = "💾 保存修改";
        saveBtn.style.background = "#f39c12";
    }
}

function addGrade() {
    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    let s = (sel.style.display !== 'none') ? sel.value : txt.value;

    const category = document.getElementById('input-grade-category').value;
    const nature = document.getElementById('input-grade-nature').value;
    const c = document.getElementById('input-grade-credit').value;
    const sc = document.getElementById('input-grade-score').value;

    if (s && sc) {
        const gradeData = {
            subject: s, 
            category: category, 
            nature: nature,
            credit: parseInt(c) || 0,
            score: parseInt(sc) || 0
        };

        if (editingGradeIndex > -1) {
            gradeList[editingGradeIndex] = gradeData;
            showAlert("成績修改成功！");
        } else {
            gradeList.push(gradeData);
        }

        resetGradeInput(); 
        saveData();
        renderGradeEditList();
    } else showAlert('資料不完整，請檢查科目與分數', '錯誤');
}

function resetGradeInput() {
    document.getElementById('input-grade-subject-select').style.display = 'block';
    document.getElementById('input-grade-subject-text').style.display = 'none';
    document.getElementById('btn-toggle-input').innerText = "✏️";
    document.getElementById('input-grade-subject-select').value = '';
    document.getElementById('input-grade-subject-text').value = '';
    document.getElementById('input-grade-category').value = '通識'; 
    document.getElementById('input-grade-nature').value = '必修';
    document.getElementById('input-grade-credit').value = userType === 'university' ? '3' : '1';
    document.getElementById('input-grade-score').value = '';
    
    editingGradeIndex = -1;
    const btn = document.getElementById('btn-add-grade');
    if (btn) {
        btn.innerText = "+ 加入成績單";
        btn.style.background = "#333";
    }
}

function deleteGrade(i) {
    showConfirm('確定刪除此成績？', '刪除確認').then(ok => {
        if (ok) {
            if (editingGradeIndex === i) resetGradeInput();
            gradeList.splice(i, 1);
            saveData();
            renderGradeEditList();
        }
    });
}

function openGradeModal() {
    updateExamSubjectOptions();
    document.getElementById('grade-modal').style.display = 'flex';
    const g = document.getElementById('input-credit-group');
    if (g) g.style.display = 'block'; 
    resetGradeInput(); 
    renderGradeEditList();
}
function closeGradeModal() {
    document.getElementById('grade-modal').style.display = 'none';
    resetGradeInput();
}

function updateExamSubjectOptions() {
    const regSelect = document.getElementById('regular-subject-select');
    const midSelect = document.getElementById('midterm-subject-select');
    const gradeSelect = document.getElementById('input-grade-subject-select'); 
    
    if (!regSelect || !midSelect || !gradeSelect) return;

    const regVal = regSelect.value;
    const midVal = midSelect.value;
    const gradeVal = gradeSelect.value;

    const placeholder = '<option value="" disabled selected>選擇科目</option>';
    regSelect.innerHTML = placeholder
    midSelect.innerHTML = placeholder;
    gradeSelect.innerHTML = placeholder;

    let allSubjects = new Set(); 
    Object.values(weeklySchedule).forEach(dayCourses => {
        dayCourses.forEach(course => {
            if (course.subject) allSubjects.add(course.subject);
        });
    });

    Array.from(allSubjects).sort().forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        regSelect.appendChild(opt.cloneNode(true));
        midSelect.appendChild(opt.cloneNode(true));
        gradeSelect.appendChild(opt.cloneNode(true));
    });

    if (regVal) regSelect.value = regVal;
    if (midVal) midSelect.value = midVal;
    if (gradeVal) gradeSelect.value = gradeVal;
}

document.addEventListener('change', (e) => {
    if (e.target.id === 'regular-subject-select') renderRegularExams();
    else if (e.target.id === 'midterm-subject-select') renderMidtermExams();
});

function renderRegularExams() {
    const subject = document.getElementById('regular-subject-select').value;
    const tbody = document.getElementById('regular-exam-body');
    if (!tbody) return;

    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }

    const scores = regularExams[subject] || [];
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    } else {
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteRegularExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}

function renderMidtermExams() {
    const subject = document.getElementById('midterm-subject-select').value;
    const tbody = document.getElementById('midterm-exam-body');
    if (!tbody) return;

    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }

    const scores = midtermExams[subject] || [];
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    } else {
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteMidtermExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}

function openRegularModal() {
    const subject = document.getElementById('regular-subject-select').value;
    if (!subject) { showAlert("請先在上方選單選擇一個科目！"); return; }
    document.getElementById('modal-regular-subject-name').innerText = subject;
    document.getElementById('input-regular-name').value = '';
    document.getElementById('input-regular-score').value = '';
    document.getElementById('regular-exam-modal').style.display = 'flex';
}
function closeRegularModal() {
    document.getElementById('regular-exam-modal').style.display = 'none';
}

function addRegularExam() {
    const subject = document.getElementById('regular-subject-select').value;
    const name = document.getElementById('input-regular-name').value;
    const score = document.getElementById('input-regular-score').value;

    if (!name || !score) { showAlert("請輸入名稱和分數"); return; }

    if (!regularExams[subject]) regularExams[subject] = [];
    regularExams[subject].push({ title: name, score: parseInt(score) || 0 });

    saveData(); 
    closeRegularModal();
    renderRegularExams(); 
}

function deleteRegularExam(index) {
    const subject = document.getElementById('regular-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if(ok) {
            regularExams[subject].splice(index, 1);
            saveData();
            renderRegularExams();
        }
    });
}

function openMidtermModal() {
    const subject = document.getElementById('midterm-subject-select').value;
    if (!subject) { showAlert("請先在上方選單選擇一個科目！"); return; }
    document.getElementById('modal-midterm-subject-name').innerText = subject;
    document.getElementById('input-midterm-name').value = '';
    document.getElementById('input-midterm-score').value = '';
    document.getElementById('midterm-exam-modal').style.display = 'flex';
}
function closeMidtermModal() {
    document.getElementById('midterm-exam-modal').style.display = 'none';
}

function addMidtermExam() {
    const subject = document.getElementById('midterm-subject-select').value;
    const name = document.getElementById('input-midterm-name').value;
    const score = document.getElementById('input-midterm-score').value;

    if (!name || !score) { showAlert("請輸入名稱和分數"); return; }

    if (!midtermExams[subject]) midtermExams[subject] = [];
    midtermExams[subject].push({ title: name, score: parseInt(score) || 0 });

    saveData();
    closeMidtermModal();
    renderMidtermExams();
}

function deleteMidtermExam(index) {
    const subject = document.getElementById('midterm-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if(ok) {
            midtermExams[subject].splice(index, 1);
            saveData();
            renderMidtermExams();
        }
    });
}

function toggleGradeInputMode() {
    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    const btn = document.getElementById('btn-toggle-input');
    
    if (sel.style.display !== 'none') {
        sel.style.display = 'none';
        txt.style.display = 'block';
        btn.innerText = "📜"; 
        txt.focus();
    } else {
        sel.style.display = 'block';
        txt.style.display = 'none';
        btn.innerText = "✏️";
    }
}

let gradeChartInstance = null;
function calculateSemesterAverage(grades) {
    let ts = 0, tc = 0;
    if (!grades || grades.length === 0) return 0;
    grades.forEach(g => {
        const cr = parseFloat(g.credit) || 1;
        const sc = parseFloat(g.score) || 0;
        ts += sc * cr;
        tc += cr;
    });
    return tc > 0 ? (ts / tc).toFixed(1) : 0;
}

function renderAnalysis() {
    const labels = [];
    const dataPoints = [];
    let totalCreditsEarned = 0;
    let categoryEarned = {};
    const categories = ["通識", "院共同", "基礎", "核心", "專業", "自由", "其他"];
    categories.forEach(cat => {
        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
    });

    const sortedSemesters = semesterList.slice().sort(); 

    sortedSemesters.forEach(sem => {
        let semData = allData[sem];
        let grades = (sem === currentSemester) ? gradeList : (semData ? semData.grades : []);

        if (grades) {
            const avg = calculateSemesterAverage(grades);
            if (grades.length > 0) {
                labels.push(sem);
                dataPoints.push(avg);
            }
            grades.forEach(g => {
                const sc = parseFloat(g.score) || 0;
                const cr = parseFloat(g.credit) || 1;
                const cat = g.category || '其他';
                const nature = g.nature || '必修';

                if (sc >= 60) {
                    totalCreditsEarned += cr;
                    if (!categoryEarned[cat]) {
                        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
                    }
                    categoryEarned[cat].total += cr;
                    if (categoryEarned[cat][nature] !== undefined) {
                        categoryEarned[cat][nature] += cr;
                    } else {
                         categoryEarned[cat]["選修"] += cr;
                    }
                }
            });
        }
    });

    const ctx = document.getElementById('gradeChart');
    if (ctx) {
        if (gradeChartInstance) gradeChartInstance.destroy();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e0e0e0' : '#666666'; 
        const gridColor = isDark ? '#444444' : '#dddddd';

        const thresholdLinesPlugin = {
            id: 'thresholdLines',
            beforeDatasetsDraw(chart) {
                const { ctx, scales: { y }, chartArea: { left, right } } = chart;
                
                ctx.save();
                ctx.lineWidth = 3; 
                ctx.strokeStyle = '#f1c40f';
                ctx.setLineDash([5, 5]);

                const y60 = y.getPixelForValue(60);
                if (y60 >= chart.chartArea.top && y60 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y60);
                    ctx.lineTo(right, y60);
                    ctx.stroke();
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '12px Arial';
                    ctx.fillText('', left + 5, y60 - 5);
                }

                const y80 = y.getPixelForValue(80);
                if (y80 >= chart.chartArea.top && y80 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y80);
                    ctx.lineTo(right, y80);
                    ctx.stroke();
                    ctx.fillText('', left + 5, y80 - 5);
                }
                
                ctx.restore();
            }
        };

        gradeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '學期平均',
                    data: dataPoints,
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },

            plugins: [thresholdLinesPlugin], 
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: {
                            display: true,
                            text: '學期',
                            color: textColor,
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        suggestedMin: 40, 
                        suggestedMax: 100,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: {
                            display: true,
                            text: '平\n均\n分\n數',
                            color: textColor,
                            font: { size: 14, weight: 'bold' },
                            rotation: 0,
                            align: 'center'
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
    updateTotalProgressBar(totalCreditsEarned);
    renderCategoryBreakdown(categoryEarned);
}

function updateTotalProgressBar(earned) {
    const progressEl = document.getElementById('credit-progress-bar');
    const totalEl = document.getElementById('total-credits');
    const container = document.getElementById('credit-progress-container');

    if (userType === 'highschool') {
        if(container) container.style.display = 'none';
        return;
    }
    if(container) container.style.display = 'block';

    if (progressEl && totalEl) {
        const percentage = Math.min((earned / graduationTarget) * 100, 100);
        progressEl.style.width = percentage + '%';
        if(percentage < 30) progressEl.style.background = '#e74c3c';
        else if(percentage < 70) progressEl.style.background = '#f39c12';
        else progressEl.style.background = '#2ecc71';

        totalEl.innerText = earned;
    }
}

function renderCategoryBreakdown(earnedMap) {
    const panelUni = document.getElementById('panel-credits-uni');
    const panelHs = document.getElementById('panel-credits-hs');
    const listUni = document.getElementById('list-credits-uni');
    const listHs = document.getElementById('list-credits-hs');

    if (!panelUni || !panelHs) return;

    let html = '';

    if (userType === 'highschool') {
        panelUni.style.display = 'none';
        panelHs.style.display = 'block';

        const types = ["必修", "選修"];
        types.forEach(type => {
            const earned = earnedMap[type] || 0;
            const target = categoryTargets[type] || 0;
            const percent = target > 0 ? Math.min(Math.round((earned / target) * 100), 100) : (earned > 0 ? 100 : 0);
            
            let color = "#4a90e2";
            if (percent >= 100) color = "#2ecc71";
            else if (percent < 30) color = "#e74c3c";

            html += `
            <div style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; font-size:1rem; margin-bottom:6px;">
                    <span style="font-weight:bold; color:#555;">${type}學分</span>
                    <span style="color:#666;">
                        <span style="font-weight:bold; color:${color}">${earned}</span> / ${target}
                    </span>
                </div>
                <div style="background: #eee; border-radius: 8px; height: 12px; width: 100%; overflow: hidden;">
                    <div style="background: ${color}; width: ${percent}%; height: 100%; transition: width 0.5s;"></div>
                </div>
            </div>`;
        });
        listHs.innerHTML = html;

    } else {
        panelUni.style.display = 'block';
        panelHs.style.display = 'none';

        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由", "其他"];
        order.forEach(cat => {
            const data = earnedMap[cat] || { total: 0, "必修": 0, "選修": 0 };
            const targetConfig = categoryTargets[cat];
            const isComplex = (typeof targetConfig === 'object');

            if (!isComplex) {
                const target = targetConfig || 0;
                const earned = data.total;
                if (target === 0 && earned === 0 && cat !== "其他") return;
                let percent = 0; if (target > 0) percent = Math.min(Math.round((earned / target) * 100), 100);
                let barColor = percent >= 100 ? "#2ecc71" : "#4a90e2";
                
                html += `
                <div style="margin-bottom: 12px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                        <span style="font-weight:bold; color:#555;">${cat}</span>
                        <span><span style="font-weight:bold; color:${barColor}">${earned > 0 ? earned + ' / ' + target : earned}</span></span>
                    </div>
                    <div style="background: #eee; border-radius: 6px; height: 10px; width: 100%; overflow: hidden;">
                        <div style="background: ${barColor}; width: ${percent}%; height: 100%;"></div>
                    </div>
                </div>`;
            } else {
                const reqTarget = targetConfig["必修"] || 0;
                const eleTarget = targetConfig["選修"] || 0;
                const reqEarned = data["必修"] || 0;
                const eleEarned = (data["選修"] || 0) + (data["必選修"] || 0);

                const reqPercent = reqTarget > 0 ? Math.min(Math.round((reqEarned / reqTarget) * 100), 100) : (reqEarned > 0 ? 100 : 0);
                const elePercent = eleTarget > 0 ? Math.min(Math.round((eleEarned / eleTarget) * 100), 100) : (eleEarned > 0 ? 100 : 0);
                const reqColor = reqPercent >= 100 ? "#2ecc71" : "#e74c3c";
                const eleColor = elePercent >= 100 ? "#2ecc71" : "#f39c12";

                html += `
                <div style="margin-bottom: 15px; background: #fafafa; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
                    <div style="font-weight:bold; color:#333; margin-bottom: 8px; font-size: 0.95rem;">${cat}模組</div>
                    <div style="margin-bottom: 6px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                            <span>必修</span><span>${reqEarned} / ${reqTarget}</span>
                        </div>
                        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                            <div style="background: ${reqColor}; width: ${reqPercent}%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                            <span>選修</span><span>${eleEarned} / ${eleTarget}</span>
                        </div>
                        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                            <div style="background: ${eleColor}; width: ${elePercent}%; height: 100%;"></div>
                        </div>
                    </div>
                </div>`;
            }
        });
        listUni.innerHTML = html;
    }
}

function updateGraduationTarget(val) {
    const newVal = parseInt(val);
    if (newVal && newVal > 0) {
        graduationTarget = newVal;
        saveData();
    } else {
        showAlert("請輸入有效的正整數");
        document.getElementById('setting-grad-target').value = graduationTarget;
    }
}

function switchGradeTab(tabName) {
    const tabs = ['dashboard', 'regular', 'midterm', 'list', 'chart', 'credits'];

    tabs.forEach(t => {
        const btn = document.getElementById(`tab-grade-${t}`);
        const view = document.getElementById(`subview-grade-${t}`);
        if (btn) btn.classList.remove('active');
        if (view) view.style.display = 'none';
    });

    const activeBtn = document.getElementById(`tab-grade-${tabName}`);
    const activeView = document.getElementById(`subview-grade-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.style.display = 'block';

    if (tabName === 'dashboard') {
        renderGradeDashboard();
    } else if (tabName === 'regular') {
        updateExamSubjectOptions();
        renderRegularExams();
    } else if (tabName === 'midterm') {
        updateExamSubjectOptions();
        renderMidtermExams();
    } else if (tabName === 'list') {
        loadGrades();
    } else if (tabName === 'chart') {
        setTimeout(() => {
            if (typeof renderAnalysis === 'function') renderAnalysis();
        }, 50);
    } else if (tabName === 'credits') {
        if (typeof renderAnalysis === 'function') renderAnalysis();
    }
}

function renderGradeDashboard() {
    let totalScore = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    let failedCount = 0;

    gradeList.forEach(g => {
        const score = parseFloat(g.score) || 0;
        const credit = parseFloat(g.credit) || 1;
        const isPass = score >= 60;

        totalScore += score * credit;
        totalCredits += credit;
        
        if (isPass) earnedCredits += credit;
        else failedCount++;
    });

    const avg = totalCredits > 0 ? (totalScore / totalCredits).toFixed(1) : "0.0";

    const elGpa = document.getElementById('dash-gpa');
    const elCredits = document.getElementById('dash-credits');
    const elFailed = document.getElementById('dash-failed');

    if (elGpa) elGpa.innerText = avg;
    if (elCredits) elCredits.innerText = earnedCredits;
    if (elFailed) elFailed.innerText = failedCount;
}