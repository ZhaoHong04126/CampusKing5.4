// Service Worker 只能在https和localhost下執行
// 生命週期： 包含 Install (安裝)、Activate (激活)、Fetch (攔截) 三個主要事件。
// 用途： 離線體驗、預先快取、動態快取。 

const CACHE_NAME = 'v5.4';  // 快取版本

const ASSETS_TO_CACHE = [ // 快取的檔案
    './',
    './index.html',
    './manifest.json',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/pages.css',
    './js/main.js',
    './js/ui.js',
    './js/data.js',
    './js/state.js',
    './js/auth.js',
    './js/firebase.js',
    './js/course.js',
    './js/grade.js',
    './js/semester.js',
    './js/calendar.js',
    './js/accounting.js',
    './js/notification.js',
    './js/notes.js',
    './js/anniversary.js',
    './js/learning.js'
];

self.addEventListener('install', (e) => { // 安裝
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (e) => { // 攔截
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
