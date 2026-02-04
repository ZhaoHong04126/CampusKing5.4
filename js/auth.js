// --- 帳號驗證與管理 ---
function toggleLoginMode() {
    isRegisterMode = !isRegisterMode;
    const btn = document.getElementById('btn-submit');
    const toggleBtn = document.getElementById('toggle-btn');
    const toggleText = document.getElementById('toggle-text');
    if (isRegisterMode) { btn.innerText = "註冊並登入"; toggleText.innerText = "已經有帳號？"; toggleBtn.innerText = "直接登入"; }
    else { btn.innerText = "登入"; toggleText.innerText = "還沒有帳號？"; toggleBtn.innerText = "建立新帳號"; }
}

function handleEmailAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) { showAlert("請輸入 Email 和密碼", "資料不全"); return; }
    
    if (isRegisterMode) {
        auth.createUserWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "註冊失敗"));
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "登入失敗"));
    }
}

function loginWithGoogle() {
    auth.signInWithPopup(provider).catch(e => showAlert(e.message, "登入錯誤"));
}

function loginAnonymously() {
    auth.signInAnonymously().catch(e => showAlert(e.message, "登入錯誤"));
}

function logout() {
    if (currentUser && currentUser.isAnonymous) {
        showConfirm("⚠️ 匿名帳號登出後資料會消失，確定嗎？", "警告").then(ok => {
            if (ok) performLogout();
        });
    } else {
        performLogout();
    }
}

function performLogout() {
    auth.signOut().then(() => window.location.reload());
}
// 註銷帳號
function deleteAccount() {
    if (!currentUser) return;

    // 第一層確認
    showConfirm("⚠️ 警告：此動作將「永久刪除」您的所有資料（包含課表、成績、記帳...等），且無法復原！\n\n確定要註銷帳號嗎？", "危險操作")
    .then(isConfirmed => {
        if (isConfirmed) {
            // 第二層確認：要求輸入關鍵字
            return showPrompt("為了確認您的意願，請輸入「DELETE」", "", "最終確認");
        }
        return null;
    })
    .then(inputStr => {
        if (inputStr === "DELETE") {
            const uid = currentUser.uid;
            
            // 顯示處理中狀態（非必要，但體驗較好）
            if(window.showAlert) showAlert("正在刪除資料，請稍候...", "處理中");

            // 刪除雲端資料 (Firestore)
            db.collection("users").doc(uid).delete()
            .then(() => {
                // 刪除本地資料 (LocalStorage)
                const dbKey = 'campusMate_v5.2_' + uid;
                localStorage.removeItem(dbKey);
                // 這裡選擇保留 userType (身分偏好) 或一併刪除皆可，這裡選擇一併刪除讓一切重來
                localStorage.removeItem('userType'); 

                // 刪除 Firebase Auth 帳號 (最關鍵的一步)
                return currentUser.delete();
            })
            .then(() => {
                // 成功後強制刷新
                alert("帳號已成功註銷，感謝您的使用。"); // 這裡用原生 alert 確保跳轉前使用者看得到
                window.location.reload();
            })
            .catch((error) => {
                console.error("Delete error:", error);
                // 處理 Firebase 的安全機制：若登入時間過久，禁止刪除帳號
                if (error.code === 'auth/requires-recent-login') {
                    showAlert("🔒 為了確保帳號安全，系統要求您必須「重新登入」後才能執行刪除操作。\n\n請登出後再登入一次試試。", "驗證過期");
                } else {
                    showAlert("註銷失敗：" + error.message, "錯誤");
                }
            });
        } else if (inputStr !== null) {
            // 如果使用者按了取消會回傳 null，如果輸入錯誤字串則進入這裡
            showAlert("輸入內容不正確，已取消操作。", "取消");
        }
    });
}

function checkUserType() {
    if (!userType) document.getElementById('welcome-modal').style.display = 'flex';
    else initUI();
}

function setUserType(type) {
    localStorage.setItem('userType', type);
    userType = type;
    document.getElementById('welcome-modal').style.display = 'none';
    initUI();
}

function resetIdentity() {
    showConfirm("確定要重新選擇身分嗎？\n\n切換後將改變「學分模組結構」：\n• 高中生：必修 / 選修\n• 大學生：通識 / 核心 / 專業...\n\n(更換身分資料不會被刪除)", "切換身分")
    .then(isConfirmed => {
        if (isConfirmed) {
            localStorage.removeItem('userType');
            userType = null;
            document.getElementById('welcome-modal').style.display = 'flex';
            switchTab('home'); 
        }
    });
}

function updateLoginUI(isLoggedIn) {
    const loginOverlay = document.getElementById('login-overlay');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');
    if (loginOverlay) loginOverlay.style.display = isLoggedIn ? 'none' : 'flex';
    if (userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';
    if (userPhoto && currentUser) userPhoto.src = currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
}

function forgotPassword() {
    const email = document.getElementById('email').value;

    if (!email) {
        showAlert("請先在上方輸入您的 Email，系統才能寄送重設信給您！", "缺少 Email");
        return;
    }

    showConfirm(`確定要寄送重設密碼信件至 ${email} 嗎？`, "重設密碼").then(isConfirmed => {
        if (isConfirmed) {
            auth.sendPasswordResetEmail(email)
            .then(() => {
                showAlert("📧 重設信已寄出！\n\n請檢查您的信箱 (若沒收到請查看垃圾郵件)。", "寄送成功");
            })
            .catch((error) => {
                let msg = "發送失敗：" + error.message;
                if (error.code === 'auth/user-not-found') msg = "找不到此 Email 的使用者。";
                showAlert(msg, "錯誤");
            });
        }
    });
}