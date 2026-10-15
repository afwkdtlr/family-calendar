export const EVENT_COLORS = [
  { id: "#d9a394", label: "로즈" },
  { id: "#e0b25a", label: "골드" },
  { id: "#8fb8a0", label: "세이지" },
  { id: "#8aa4c8", label: "슬레이트" },
  { id: "#b89aa8", label: "라벤더" },
];

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
}

export function formatAgendaTitle(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

const SOLAR_HOLIDAYS = {
  "01-01": "신정",
  "03-01": "삼일절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "성탄절",
};

const LUNAR_HOLIDAYS = {
  "2024-02-09": "설날연휴",
  "2024-02-10": "설날",
  "2024-02-11": "설날연휴",
  "2024-02-12": "대체공휴일",
  "2024-09-16": "추석연휴",
  "2024-09-17": "추석",
  "2024-09-18": "추석연휴",
  "2025-01-28": "설날연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날연휴",
  "2025-10-05": "추석연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석연휴",
  "2025-10-08": "대체공휴일",
  "2026-02-16": "설날연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날연휴",
  "2026-09-24": "추석연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석연휴",
  "2027-02-06": "설날연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날연휴",
  "2027-02-09": "대체공휴일",
  "2027-09-14": "추석연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석연휴",
  "2028-01-26": "설날연휴",
  "2028-01-27": "설날",
  "2028-01-28": "설날연휴",
  "2028-10-02": "추석연휴",
  "2028-10-03": "추석",
  "2028-10-04": "추석연휴",
  "2028-10-05": "대체공휴일",
  "2029-02-12": "설날연휴",
  "2029-02-13": "설날",
  "2029-02-14": "설날연휴",
  "2029-09-21": "추석연휴",
  "2029-09-22": "추석",
  "2029-09-23": "추석연휴",
  "2029-09-24": "대체공휴일",
  "2030-02-02": "설날연휴",
  "2030-02-03": "설날",
  "2030-02-04": "설날연휴",
  "2030-02-05": "대체공휴일",
  "2030-09-11": "추석연휴",
  "2030-09-12": "추석",
  "2030-09-13": "추석연휴",
  "2031-01-22": "설날연휴",
  "2031-01-23": "설날",
  "2031-01-24": "설날연휴",
  "2031-09-30": "추석연휴",
  "2031-10-01": "추석",
  "2031-10-02": "추석연휴",
  "2032-02-10": "설날연휴",
  "2032-02-11": "설날",
  "2032-02-12": "설날연휴",
  "2032-09-18": "추석연휴",
  "2032-09-19": "추석",
  "2032-09-20": "추석연휴",
  "2032-09-21": "대체공휴일",
};

export function holidayName(dateKey) {
  const lunar = LUNAR_HOLIDAYS[dateKey] || "";
  const solar = SOLAR_HOLIDAYS[dateKey.slice(5)] || "";
  if (lunar && solar) {
    return `${solar}·${lunar}`;
  }
  return lunar || solar;
}

export function buildMonthRange(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  return { from: toDateKey(start), to: toDateKey(end) };
}

export function eachDateKey(fromKey, toKey) {
  const keys = [];
  const start = parseDateKey(fromKey);
  const end = parseDateKey(toKey || fromKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return keys;
  }
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const days = eachDateKey(event.eventDate, event.endDate || event.eventDate);
    for (const key of days.length ? days : [event.eventDate]) {
      acc[key] = acc[key] || [];
      acc[key].push(event);
    }
    return acc;
  }, {});
}

export function applyVisibilityFilter(items, hiddenHouses) {
  const hidden = new Set((hiddenHouses || []).map(Number));
  if (!hidden.size) {
    return items;
  }
  return items.filter((item) => !hidden.has(Number(item.familyId)));
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}
