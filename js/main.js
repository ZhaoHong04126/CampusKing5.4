// --- 3. 程式啟動 ---

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        updateLoginUI(true);
        loadData();
        checkUserType();

        checkAdminStatus();
    } else {
        currentUser = null;
        updateLoginUI(false);

        document.getElementById('admin-panel').style.display = 'none';
    }
});

