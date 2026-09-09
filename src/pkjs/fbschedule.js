var WorkSchedule = require('./workschedule');

var ANCHOR_YEAR = 2026;
var ANCHOR_MONTH = 8;
var ANCHOR_DAY = 9;
var ANCHOR_FB_YEAR = 26;
var ANCHOR_FB_NUM = 19;
var FB_DAYS = 14;
var MAX_FB_NUM = 26;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from, to) {
  var msPerDay = 24 * 60 * 60 * 1000;
  var fromDay = startOfDay(from).getTime();
  var toDay = startOfDay(to).getTime();
  return Math.round((toDay - fromDay) / msPerDay);
}

function addDays(date, days) {
  var result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function formatFb(year, num) {
  var numText = num < 10 ? '0' + num : String(num);
  return 'FB' + year + numText;
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

function getAnchorDate() {
  return new Date(ANCHOR_YEAR, ANCHOR_MONTH, ANCHOR_DAY);
}

function getFbForDate(date, settings, lang) {
  date = date || new Date();
  settings = settings || {};
  lang = lang || 0;

  var anchor = getAnchorDate();
  var offset = Math.floor(daysBetween(anchor, date) / FB_DAYS);
  var fbParts = addFbOffset(ANCHOR_FB_YEAR, ANCHOR_FB_NUM, offset);
  var start = addDays(anchor, offset * FB_DAYS);
  var end = addDays(start, FB_DAYS - 1);
  var workDays = WorkSchedule.getWorkDays(settings);
  var workDaysLeft = WorkSchedule.countWorkingDaysRemaining(
    date, end, workDays, lang
  );

  return {
    name: formatFb(fbParts.year, fbParts.num),
    start: start,
    end: end,
    workDaysLeft: workDaysLeft
  };
}

function formatDaysLeft(fb) {
  if (!fb) return '--';
  return String(fb.workDaysLeft);
}

function formatName(fb) {
  if (!fb) return '--';
  return fb.name;
}

module.exports = {
  ANCHOR_DATE: getAnchorDate(),
  FB_DAYS: FB_DAYS,
  formatFb: formatFb,
  addFbOffset: addFbOffset,
  getFbForDate: getFbForDate,
  formatDaysLeft: formatDaysLeft,
  formatName: formatName,
  daysBetween: daysBetween
};
