let discussionUnsubscribe = null;
let editingPostId = null;

// 1. 渲染討論區
function initDiscussion() {
    const listDiv = document.getElementById('discussion-list');
    if (!listDiv) return;

    // 如果使用者還沒登入，先顯示提示 (避免因為讀取不到 currentUser 而以為沒按鈕)
    if (!currentUser) {
        // 這裡不 return，因為我們還是要顯示列表給未登入的人看，只是不顯示刪除鈕
        console.log("訪客模式：僅供瀏覽");
    }

    listDiv.innerHTML = '<p style="text-align:center; color:#999;">正在載入討論...</p>';

    // 監聽資料庫
    discussionUnsubscribe = db.collection("discussions")
        .orderBy("createdAt", "desc")
        .limit(20)
        .onSnapshot((snapshot) => {
            let html = '';
            if (snapshot.empty) {
                listDiv.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">📭 目前還沒有討論，來搶頭香吧！</div>';
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // --- 權限判斷核心 ---
                // 1. 是作者本人嗎？
                const isAuthor = currentUser && data.authorUid === currentUser.uid;
                // 2. 是管理員嗎？(需確保 firebase.js 裡有定義 ADMIN_UID)
                const isAdmin = currentUser && (typeof ADMIN_UID !== 'undefined') && currentUser.uid === ADMIN_UID;
                
                // 只要符合其中一個條件，就顯示刪除鈕
                const canEdit = isAuthor || isAdmin;

                // 時間格式化
                let timeStr = "剛剛";
                if (data.createdAt) {
                    const d = data.createdAt.toDate();
                    timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                }

                // 產生刪除按鈕 HTML
                let actionBtns = '';
                if (canEdit) {
                    // 將內容編碼，避免引號或特殊字元破壞 HTML 結構
                    const safeContent = encodeURIComponent(data.content);
                    actionBtns = `
                        <div style="display:flex; gap: 8px;">
                            <button onclick="confirmEditPost('${doc.id}', '${safeContent}')" style="color:#f39c12; background:none; border:none; cursor:pointer; font-size:0.85rem; padding:0;">✎ 編輯</button>
                            <button onclick="deletePost('${doc.id}')" style="color:#e74c3c; background:none; border:none; cursor:pointer; font-size:0.85rem; padding:0;">🗑️ 刪除</button>
                        </div>
                    `;
                }

                const avatar = data.authorPhoto || "https://cdn-icons-png.flaticon.com/512/847/847969.png";

                html += `
                <div class="card" style="padding: 15px; margin-bottom: 15px; display:flex; gap:12px;">
                    <img src="${avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <span style="font-weight:bold; color:var(--text-main); font-size:0.95rem;">${escapeHtml(data.authorName)}</span>
                                <span style="font-size:0.75rem; color:#999; margin-left:5px;">${timeStr}</span>
                            </div>
                            ${actionBtns}
                        </div>
                        <div style="margin-top:6px; color:var(--text-main); line-height:1.5; white-space: pre-wrap;">${escapeHtml(data.content)}</div>
                    </div>
                </div>`;
            });
            listDiv.innerHTML = html;
        });
}

function stopDiscussionListener() {
    if (discussionUnsubscribe) {
        discussionUnsubscribe();
        discussionUnsubscribe = null;
    }
}

function addPost() {
    const content = document.getElementById('input-post-content').value;
    
    if (!content.trim()) {
        showAlert("請輸入內容");
        return;
    }
    if (!currentUser) {
        showAlert("請先登入才能發文！");
        return;
    }

    const btn = document.getElementById('btn-send-post');
    btn.disabled = true;
    
    // 判斷是編輯還是新增
    if (editingPostId) {
        // --- 編輯模式 ---
        btn.innerText = "儲存中...";
        db.collection("discussions").doc(editingPostId).update({
            content: content,
            // 可以選擇性加入更新時間
            // updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            closePostModal();
            showAlert("修改成功！");
            editingPostId = null; // 重置
        })
        .catch((error) => {
            console.error("Error:", error);
            showAlert("修改失敗：" + error.message);
        })
        .finally(() => {
            btn.disabled = false;
        });

    } else {
        // 決定發文身分資料
        const anonCheck = document.getElementById('check-post-anonymous');
        // 判斷：如果有勾選 "匿名發文" 或者是 "本來就是匿名登入"
        const isAnonymousPost = (anonCheck && anonCheck.checked) || currentUser.isAnonymous;

        let postName = currentUser.displayName || "匿名同學";
        let postPhoto = currentUser.photoURL;

        // 如果要匿名，強制覆寫資料
        if (isAnonymousPost) {
            postName = "匿名同學";
            postPhoto = "https://cdn-icons-png.flaticon.com/512/847/847969.png"; // 預設匿名頭貼
        }
        // --- 新增模式 ---
        btn.innerText = "發送中...";
        db.collection("discussions").add({
            content: content,
            authorUid: currentUser.uid,   // UID 保持不變，這樣使用者自己還是能刪除文章
            authorName: postName,         // 使用我們判斷後的變數
            authorPhoto: postPhoto,       // 使用我們判斷後的變數
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            closePostModal();
            showAlert("發布成功！");
        })
        .catch((error) => {
            console.error("Error:", error);
            showAlert("發布失敗：" + error.message);
        })
        .finally(() => {
            btn.disabled = false;
            // 如果是新增模式，結束後改回預設文字
            btn.innerText = "🚀 發送";
        });
    }
}

function deletePost(docId) {
    if (confirm("確定要刪除這則貼文嗎？")) {
        db.collection("discussions").doc(docId).delete()
            .then(() => {
                showAlert("貼文已刪除");
            })
            .catch((err) => {
                showAlert("刪除失敗 (權限不足或網路錯誤)");
                console.error(err);
            });
    }
}

function openPostModal() {
    if(!currentUser) {
        showAlert("請先登入帳號");
        return;
    }
    editingPostId = null
    document.getElementById('post-modal').style.display = 'flex';
    document.getElementById('input-post-content').value = '';
    document.getElementById('btn-send-post').innerText = "🚀 發送";
    // [新增] 控制匿名選項的顯示邏輯
    const anonContainer = document.getElementById('post-anon-container');
    const anonCheck = document.getElementById('check-post-anonymous');
    
    // 1. 先重置勾選狀態 (預設不勾選)
    if(anonCheck) anonCheck.checked = false;

    // 2. 判斷顯示時機：
    //    必須有登入 (currentUser)
    //    且 不是匿名登入 (!currentUser.isAnonymous)
    //    且 不是在編輯模式 (!editingPostId) -> 編輯時不給改身分
    if (currentUser && !currentUser.isAnonymous && !editingPostId) {
        if(anonContainer) anonContainer.style.display = 'block';
    } else {
        if(anonContainer) anonContainer.style.display = 'none';
    }
    document.getElementById('input-post-content').focus();
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 確認並開啟編輯模式
function confirmEditPost(docId, encodedContent) {
    // 詢問使用者
    showConfirm("確定要修改這則留言嗎？", "編輯確認").then(isConfirmed => {
        if (isConfirmed) {
            const content = decodeURIComponent(encodedContent); // 解碼內容
            
            // 設定為編輯模式
            editingPostId = docId;
            // [新增] 編輯模式時隱藏匿名選項
            const anonContainer = document.getElementById('post-anon-container');
            if(anonContainer) anonContainer.style.display = 'none';
            
            // 開啟與填入 Modal
            document.getElementById('post-modal').style.display = 'flex';
            document.getElementById('input-post-content').value = content;
            document.getElementById('btn-send-post').innerText = "💾 儲存修改"; // 改變按鈕文字
            document.getElementById('input-post-content').focus();
        }
    });
}