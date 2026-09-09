// Mirrors config-page/src/utils/fbSchedule.ts and src/pkjs/fbschedule.js.

var LANGUAGE_FI = 20;
var ANCHOR_DATE = new Date(2026, 8, 9);
var ANCHOR_FB_YEAR = 26;
var ANCHOR_FB_NUM = 19;
var FB_DAYS = 14;
var MAX_FB_NUM = 26;
var DEFAULT_WORK_DAYS = 62;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from, to) {
  var msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function addDays(date, days) {
  var result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function dateKey(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function easterSunday(year) {
  var a = year % 19;
  var b = Math.floor(year / 100);
  var c = year % 100;
  var d = Math.floor(b / 4);
  var e = b % 4;
  var f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4);
  var k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * l) / 451);
  var month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  var day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function midsummerEve(year) {
  var date = new Date(year, 5, 19);
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

var holidayCache = {};

function holidayKeysForYear(year) {
  var keys = {};
  var easter = easterSunday(year);
  function add(date) {
    keys[dateKey(date)] = true;
  }

  add(new Date(year, 0, 1));
  add(new Date(year, 0, 6));
  add(addDays(easter, -2));
  add(addDays(easter, 1));
  add(new Date(year, 4, 1));
  add(addDays(easter, 39));
  add(midsummerEve(year));
  add(addDays(midsummerEve(year), 1));
  add(new Date(year, 11, 6));
  add(new Date(year, 11, 24));
  add(new Date(year, 11, 25));
  add(new Date(year, 11, 26));
  return keys;
}

function isFinnishPublicHoliday(date) {
  var year = date.getFullYear();
  if (!holidayCache[year]) {
    holidayCache[year] = holidayKeysForYear(year);
  }
  return !!holidayCache[year][dateKey(date)];
}

function isWeekdayEnabled(date, workDaysBitmask) {
  return (workDaysBitmask & (1 << date.getDay())) !== 0;
}

function isWorkingDay(date, workDaysBitmask, lang) {
  if (!isWeekdayEnabled(date, workDaysBitmask)) return false;
  if (lang === LANGUAGE_FI && isFinnishPublicHoliday(date)) return false;
  return true;
}

function countWorkingDaysRemaining(fromDate, toDate, workDaysBitmask, lang) {
  var from = startOfDay(fromDate);
  var to = startOfDay(toDate);
  if (from > to) return 0;

  var count = 0;
  var cursor = from;
  while (cursor <= to) {
    if (isWorkingDay(cursor, workDaysBitmask, lang)) {
      count++;
    }
    cursor = addDays(cursor, 1);
  }
  return count;
}

function addFbOffset(year, num, offset) {
  var y = year;
  var n = num + offset;
  while (n > MAX_FB_NUM) {
    y++;
    n -= MAX_FB_NUM;
  }
  while (n < 1) {
    y--;
    n += MAX_FB_NUM;
  }
  return { year: y, num: n };
}

function formatFb(year, num) {
  var numText = num < 10 ? '0' + num : String(num);
  return 'FB' + year + numText;
}

function getFbForDate(date, workDaysBitmask, lang) {
  date = date || new Date();
  workDaysBitmask = workDaysBitmask === undefined ? DEFAULT_WORK_DAYS : workDaysBitmask;
  lang = lang || 0;

  var offset = Math.floor(daysBetween(ANCHOR_DATE, date) / FB_DAYS);
  var fbParts = addFbOffset(ANCHOR_FB_YEAR, ANCHOR_FB_NUM, offset);
  var start = addDays(ANCHOR_DATE, offset * FB_DAYS);
  var end = addDays(start, FB_DAYS - 1);
  var workDaysLeft = countWorkingDaysRemaining(date, end, workDaysBitmask, lang);

  return {
    name: formatFb(fbParts.year, fbParts.num),
    workDaysLeft: workDaysLeft
  };
}

function parseIntSetting(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  var n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}
