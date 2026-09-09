var FiHolidays = require('./fiholidays');

var LANGUAGE_FI = 20;

var DEFAULT_WORK_START = 540;
var DEFAULT_WORK_END = 900;
var DEFAULT_WORK_DAYS = 62; // Mon–Fri (bit 1–5 set; Sun=0, Mon=1, … Sat=6)

var WORK_WIDGET_KEYS = [
  'SETTING_WORK_WIDGET_UPPER_SECONDARY',
  'SETTING_WORK_WIDGET_UPPER_PRIMARY',
  'SETTING_WORK_WIDGET_LOWER_PRIMARY',
  'SETTING_WORK_WIDGET_LOWER_SECONDARY'
];

function parseIntSetting(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  var n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function getWorkDays(settings) {
  return parseIntSetting(settings.SETTING_WORK_DAYS, DEFAULT_WORK_DAYS);
}

function getWorkStart(settings) {
  return parseIntSetting(settings.SETTING_WORK_START, DEFAULT_WORK_START);
}

function getWorkEnd(settings) {
  return parseIntSetting(settings.SETTING_WORK_END, DEFAULT_WORK_END);
}

function isWeekdayEnabled(date, workDaysBitmask) {
  var day = date.getDay();
  return (workDaysBitmask & (1 << day)) !== 0;
}

function isWorkingDay(date, workDaysBitmask, lang) {
  if (!isWeekdayEnabled(date, workDaysBitmask)) return false;
  if (lang === LANGUAGE_FI && FiHolidays.isPublicHoliday(date)) return false;
  return true;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextDay(date) {
  var result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + 1);
  return result;
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
    cursor = nextDay(cursor);
  }
  return count;
}

function isHolidayMode(settings) {
  return parseIntSetting(settings.SETTING_HOLIDAY_MODE, 0) === 1;
}

function isScheduleEnabled(settings) {
  return parseIntSetting(settings.SETTING_WORK_SCHEDULE_ENABLED, 0) === 1;
}

function isActive(settings, date, lang) {
  settings = settings || {};
  date = date || new Date();
  lang = lang || 0;

  if (!isScheduleEnabled(settings)) return false;
  if (isHolidayMode(settings)) return false;

  var workDays = getWorkDays(settings);
  if (!isWeekdayEnabled(date, workDays)) return false;
  if (lang === LANGUAGE_FI && FiHolidays.isPublicHoliday(date)) return false;

  var minutes = date.getHours() * 60 + date.getMinutes();
  var start = getWorkStart(settings);
  var end = getWorkEnd(settings);
  return minutes >= start && minutes < end;
}

function getWorkWidget(settings, slotKey) {
  settings = settings || {};
  var value = settings[slotKey];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getDefaultWorkWidgets() {
  return {
    SETTING_WORK_WIDGET_UPPER_SECONDARY: '',
    SETTING_WORK_WIDGET_UPPER_PRIMARY: '{fb_name}',
    SETTING_WORK_WIDGET_LOWER_PRIMARY: '{fb_days_left}d',
    SETTING_WORK_WIDGET_LOWER_SECONDARY: ''
  };
}

function resolveWidgetFormat(settings, slotKey, normalFmt, isWork) {
  if (!isWork) return normalFmt;

  settings = settings || {};
  if (!Object.prototype.hasOwnProperty.call(settings, slotKey)) {
    var defaults = getDefaultWorkWidgets();
    var fallbackFmt = defaults[slotKey] || '';
    return fallbackFmt || normalFmt;
  }

  var workFmt = getWorkWidget(settings, slotKey);
  return workFmt || normalFmt;
}

module.exports = {
  LANGUAGE_FI: LANGUAGE_FI,
  DEFAULT_WORK_START: DEFAULT_WORK_START,
  DEFAULT_WORK_END: DEFAULT_WORK_END,
  DEFAULT_WORK_DAYS: DEFAULT_WORK_DAYS,
  WORK_WIDGET_KEYS: WORK_WIDGET_KEYS,
  getWorkDays: getWorkDays,
  getWorkStart: getWorkStart,
  getWorkEnd: getWorkEnd,
  isWeekdayEnabled: isWeekdayEnabled,
  isWorkingDay: isWorkingDay,
  countWorkingDaysRemaining: countWorkingDaysRemaining,
  isHolidayMode: isHolidayMode,
  isScheduleEnabled: isScheduleEnabled,
  isActive: isActive,
  getDefaultWorkWidgets: getDefaultWorkWidgets,
  resolveWidgetFormat: resolveWidgetFormat
};
