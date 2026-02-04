let currentUser = null;
let userType = localStorage.getItem('userType');
let isRegisterMode = false
let currentDay = new Date().getDay();
if (currentDay === 0 || currentDay === 6) currentDay = 1;
let currentSemester = "114-2";
let semesterList = ["114-2"];
let allData = {};
let weeklySchedule = {};
let gradeList = [];
let regularExams = {};
let midtermExams = {};
let calendarEvents = [];
let accountingList = [];
let accChartInstance = null;
let quickNotes = [];
let anniversaryList = [];
let semesterStartDate = "";
let semesterEndDate = "";
let learningList = [];
let graduationTarget = 128; 
let categoryTargets = {
    "通識": 28,
    "院共同": 9,
    "基礎": {
        "必修": 15,
        "選修": 9
    },
    "核心": {
        "必修": 15,
        "選修": 9
    },
    "專業": {
        "必修": 0,
        "選修": 23
    },
    "自由": 20,
    "其他": 0
};
let periodConfig = {
    classDur: 50, // 上課時間
    breakDur: 10, // 下課時間
    startHash: "08:10" // 開始時間
};

const defaultSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] };
