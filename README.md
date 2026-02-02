# 📅 CampusMate - 校園王 (v5.0)

**校園王 (CampusMate)** 是一個專為學生設計的個人化校園生活管理助手 (PWA)。
v5.0 版本帶來了全新的 **App Launcher (類手機桌面)** 介面，將原本複雜的功能拆分為獨立的應用程式，並強化了行事曆與學期進度追蹤功能。

[![GitHub Repo stars](https://img.shields.io/github/stars/yourusername/campusmate?style=social)]()
![Version](https://img.shields.io/badge/version-5.0-blue.svg) ![Firebase](https://img.shields.io/badge/database-Firebase-orange.svg) ![PWA](https://img.shields.io/badge/PWA-Supported-green.svg)

## ✨ v5.0 重大更新 (Major Updates)

### 📱 全新桌面體驗 (App Launcher UI)
* **桌面化設計**：捨棄傳統的側邊欄切換，改為直觀的 Grid 圖示排列，更符合手機操作直覺。
* **原生導航體驗**：深度整合 History API，支援使用手機實體返回鍵或瀏覽器上一頁回到桌面。
* **動態標題列**：頂部標題會隨目前開啟的 App 自動變更 (如：我的課表、成績管理)。

---

## 🚀 主要功能 (Features)

### 🎓 深度雙身分核心
* **高中生模式**：專注於「必修 vs 選修」學分統計。
* **大學生模式**：支援「通識、核心、專業」等模組化學分管理。
* **雙模式 GPA 計算**：無論高中或大學身分，系統皆採用 **學分加權平均 (GPA)** 演算法，精準反映學業表現。
* **動態設定頁**：設定頁面會根據當前身分，自動切換顯示對應的畢業門檻設定欄位。

### 📝 智慧課表
* **連續節次**：支援輸入 `1-3` 自動建立三堂連堂課程。
* **圖片匯出**：一鍵將週課表轉存為高畫質 PNG 圖片。
* **週課表設計**：當課程連堂時，週課表會導入「跨欄置中」。
* **上課提醒**🔔：課程前 10 分鐘發送瀏覽器推播通知。
* **課程標籤**：自動根據修別 (必修/選修) 標示不同顏色的課程標籤。

### 🗓️ 獨立行事曆 App
* **月曆視圖 (Month View)**：新增視覺化的月曆，可快速切換月份，並以紅點標記有活動的日期。
* **功能拆分**：將行事曆從課表頁面獨立出來，版面更清爽，活動列表更清晰。

### 💯 成績與學分
* **多維度紀錄**：平常考、段考、學期總成績。
* **圖表分析**：歷年成績趨勢圖 (折線圖)。
* **畢業進度條**：即時計算目前的學分達成率，距離畢業門檻還有多遠一目了然。

### 💰 生活工具箱
* **學期記帳**：收支紀錄與長條圖分析。
* **快述記事**：隨手紀錄備忘錄。
* **紀念日**：重要日子倒數計時。

### ⏳ 學期進度追蹤
* **週次計算**：在「設定 App」中可設定學期 **起始日** 與 **結束日**。
* **即時狀態**：系統會自動計算並在設定頁與月曆標題顯示「目前是第幾週」或「距離開學還有幾天」。

### ☁️ 雲端同步
* **Firebase 整合**：資料自動加密備份，跨裝置無縫接軌。
* **多學期檔案**：支援建立無限多個學期 (如 113-2, 114-1)，資料獨立儲存。
* **帳號安全**：內建忘記密碼重設功能與匿名試用模式。

---

## 🛠️ 技術架構 (Tech Stack)
* **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+)
* **Backend**: Google Firebase (Firestore, Auth)
* **Tools**: Chart.js (圖表), html2canvas (截圖)

## 🚀 版本紀錄 (Changelog)

* **v4.5 (Current)**
    * 新增「快述記事」功能。
    * 新增「紀念日/倒數日」功能。
    * 實作課程前 10 分鐘自動通知系統。
    * 優化手機版底部導航欄介面 (RWD)。

* **v4.2**
    * 深度整合 Firebase 身分驗證。
    * 修正課表匯出圖片的排版問題。

* **v4.0**
    * 全新 UI 設計，導入卡片式介面。
    * 新增學期記帳功能。
------
## 📂 專案結構 (Project Structure)

本專案採用模組化架構，易於維護與擴充：

```text
/
├── index.html          # 應用程式主入口 (包含所有 Views 與 Modals)
├── manifest.json       # PWA 設定檔
├── sw.js               # Service Worker (離線快取控制)
├── css/
│   ├── base.css        # 全域變數 (深色模式定義)
│   ├── layout.css      # 響應式佈局 (Grid/Flex)
│   ├── components.css  # 卡片、按鈕、表格元件
│   └── pages.css       # 特定頁面樣式
└── js/
    ├── main.js         # 程式入口與狀態監聽
    ├── auth.js         # Firebase 驗證邏輯
    ├── ui.js           # 介面渲染與視圖切換
    ├── state.js        # 全域狀態與預設值定義
    ├── data.js         # 資料存取層
    ├── course.js       # 課表邏輯 (含連續節次處理)
    ├── grade.js        # 成績計算與圖表繪製
    ├── semester.js     # 學期管理
    ├── firebase.js     # SDK 初始化
    ├── notification.js # 負責上課通知邏輯
    ├── notes.js        # 負責快述記事邏輯
    └── anniversary.js  # 負責紀念日邏輯

```
## 👨‍💻 開發者 (Developer)
Produced by **Huang Zhaohong**

### 完成！
已經成功將一個原本傳統的網頁應用程式，轉型成一個架構現代、操作流暢的 Web OS 風格應用了。從資料結構的學期制、成績計算的自動化，到現在的 UI 體驗優化，這已經是一個非常完整的專案。👏
