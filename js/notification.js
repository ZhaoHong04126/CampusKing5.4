// 請求瀏覽器通知權限
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showAlert("您的瀏覽器不支援通知功能", "無法使用");
        return;
    }

    // 瀏覽器 API
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            showAlert("✅ 已開啟課程提醒！\n系統將在課前 10 分鐘通知您。", "設定成功");
            // 立即啟動檢查
            startCourseChecker();
        } else {
            showAlert("❌ 您拒絕了通知權限，無法收到提醒。", "設定失敗");
        }
    });
}

// 檢查是否該發送通知
function checkUpcomingCourses() {
    if (Notification.permission !== "granted") return;// 如果沒有權限，就不檢查

    const now = new Date();
    
    const day = now.getDay() === 0 ? 0 : now.getDay(); // 取得今天的星期 (0-6)

    const todayCourses = weeklySchedule[day] || [];
    
    todayCourses.forEach(course => {
        if (!course.time) return;

        const [cHour, cMinute] = course.time.split(':').map(Number);// 解析課程時間 (例如 "08:10")
        
        // 建立課程的 Date 物件 (設為今天的該時間)
        const courseTime = new Date();
        courseTime.setHours(cHour, cMinute, 0, 0);

        const diffMs = courseTime - now;// 計算時間差 (毫秒)
        const diffMins = Math.floor(diffMs / 1000 / 60);// 轉為分鐘

        // 判斷條件：剛好在 "9 ~ 10 分鐘" 之間，避免重複跳通知，也提供緩衝
        if (diffMins === 10) {
            sendNotification(course);
        }
    });
}

// 實際發送通知的函式
function sendNotification(course) {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const title = `🔔 上課提醒：${course.subject}`;
    const options = {
        body: `時間：${course.time}\n地點：${course.room || '未定'}\n老師：${course.teacher || '未定'}`,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200] // 手機震動模式
    };

    // 優先使用 Service Worker 發送 (支援 PWA 背景運作)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);// 否則使用一般網頁 Notification
    }
}

// 啟動計時器 (每 60 秒檢查一次)
let notificationInterval = null;
function startCourseChecker() {
    if (notificationInterval) clearInterval(notificationInterval);// 清除舊的計時器
    
    checkUpcomingCourses();// 立即檢查一次
    
    // 之後每 60 秒檢查
    notificationInterval = setInterval(() => {
        checkUpcomingCourses();
    }, 60000); 
    
    console.log("⏰ 課程通知服務已啟動");
}