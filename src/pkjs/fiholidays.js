// Finnish public holidays — computed locally (no API).
// Uses the Anonymous Gregorian algorithm for Easter Sunday.

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function dateKey(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function atLocalMidnight(year, month, day) {
  return new Date(year, month, day);
}

function addDays(date, days) {
  var result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
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
  return atLocalMidnight(year, month, day);
}

function midsummerEve(year) {
  var date = atLocalMidnight(year, 5, 19);
  while (date.getDay() !== 5) {
    date = addDays(date, 1);
  }
  return date;
}

function midsummerDay(year) {
  return addDays(midsummerEve(year), 1);
}

function holidayKeysForYear(year) {
  var keys = {};
  var easter = easterSunday(year);

  function add(date) {
    keys[dateKey(date)] = true;
  }

  add(atLocalMidnight(year, 0, 1));
  add(atLocalMidnight(year, 0, 6));
  add(addDays(easter, -2));
  add(addDays(easter, 1));
  add(atLocalMidnight(year, 4, 1));
  add(addDays(easter, 39));
  add(midsummerEve(year));
  add(midsummerDay(year));
  add(atLocalMidnight(year, 11, 6));
  add(atLocalMidnight(year, 11, 24));
  add(atLocalMidnight(year, 11, 25));
  add(atLocalMidnight(year, 11, 26));

  return keys;
}

var cache = {};

function getHolidayKeys(year) {
  if (!cache[year]) {
    cache[year] = holidayKeysForYear(year);
  }
  return cache[year];
}

function isPublicHoliday(date) {
  if (!date) return false;
  var keys = getHolidayKeys(date.getFullYear());
  return !!keys[dateKey(date)];
}

module.exports = {
  isPublicHoliday: isPublicHoliday,
  easterSunday: easterSunday,
  midsummerEve: midsummerEve
};
