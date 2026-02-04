// 請求通知權限
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showAlert("您的瀏覽器不支援通知功能", "無法使用");
        return;
    }

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
    // 如果沒有權限，就不檢查
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const day = now.getDay() === 0 ? 0 : now.getDay(); // 確保週日是 0 (或配合您的系統邏輯)
    // 注意：您的系統 currentDay 週日可能是 0 或 7，請確保與 weeklySchedule 的 key 一致
    // 您的 state.js 裡：週日=0, 週一~週六=1~6

    const todayCourses = weeklySchedule[day] || [];
    
    todayCourses.forEach(course => {
        if (!course.time) return;

        // 解析課程時間 (例如 "08:10")
        const [cHour, cMinute] = course.time.split(':').map(Number);
        
        // 建立課程的 Date 物件
        const courseTime = new Date();
        courseTime.setHours(cHour, cMinute, 0, 0);

        // 計算時間差 (毫秒)
        const diffMs = courseTime - now;
        const diffMins = Math.floor(diffMs / 1000 / 60);

        // 判斷條件：剛好在 "9 ~ 10 分鐘" 之間，避免重複跳通知
        if (diffMins === 10) {
            sendNotification(course);
        }
    });
}

// 發送通知
function sendNotification(course) {
    // 這裡可以使用校園王的圖示
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const title = `🔔 上課提醒：${course.subject}`;
    const options = {
        body: `時間：${course.time}\n地點：${course.room || '未定'}\n老師：${course.teacher || '未定'}`,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200] // 手機震動模式
    };

    // 嘗試使用 Service Worker 發送 (支援 PWA 背景)，若無則用一般 Notification
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);
    }
}

// 啟動計時器 (每 60 秒檢查一次)
let notificationInterval = null;
function startCourseChecker() {
    if (notificationInterval) clearInterval(notificationInterval);
    
    // 立即檢查一次
    checkUpcomingCourses();
    
    // 之後每 60 秒檢查
    notificationInterval = setInterval(() => {
        checkUpcomingCourses();
    }, 60000); 
    
    console.log("⏰ 課程通知服務已啟動");
}