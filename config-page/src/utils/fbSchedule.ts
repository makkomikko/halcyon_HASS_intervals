// Mirrors src/pkjs/fbschedule.js + workschedule.js for config-page previews.

const LANGUAGE_FI = 20;
const ANCHOR_DATE = new Date(2026, 8, 9);
const ANCHOR_FB_YEAR = 26;
const ANCHOR_FB_NUM = 19;
const FB_DAYS = 14;
const MAX_FB_NUM = 26;
const DEFAULT_WORK_DAYS = 62;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function midsummerEve(year: number): Date {
  const date = new Date(year, 5, 19);
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function holidayKeysForYear(year: number): Record<string, true> {
  const keys: Record<string, true> = {};
  const easter = easterSunday(year);
  const add = (date: Date) => {
    keys[dateKey(date)] = true;
  };

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

const holidayCache: Record<number, Record<string, true>> = {};

function isFinnishPublicHoliday(date: Date): boolean {
  const year = date.getFullYear();
  if (!holidayCache[year]) {
    holidayCache[year] = holidayKeysForYear(year);
  }
  return !!holidayCache[year][dateKey(date)];
}

function isWeekdayEnabled(date: Date, workDaysBitmask: number): boolean {
  return (workDaysBitmask & (1 << date.getDay())) !== 0;
}

export function isWorkingDay(date: Date, workDaysBitmask: number, lang: number): boolean {
  if (!isWeekdayEnabled(date, workDaysBitmask)) return false;
  if (lang === LANGUAGE_FI && isFinnishPublicHoliday(date)) return false;
  return true;
}

export function countWorkingDaysRemaining(
  fromDate: Date,
  toDate: Date,
  workDaysBitmask: number,
  lang: number,
): number {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);
  if (from > to) return 0;

  let count = 0;
  let cursor = from;
  while (cursor <= to) {
    if (isWorkingDay(cursor, workDaysBitmask, lang)) {
      count++;
    }
    cursor = addDays(cursor, 1);
  }
  return count;
}

function addFbOffset(year: number, num: number, offset: number) {
  let y = year;
  let n = num + offset;
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

export function formatFb(year: number, num: number): string {
  const numText = num < 10 ? `0${num}` : String(num);
  return `FB${year}${numText}`;
}

export function getFbForDate(
  date: Date = new Date(),
  workDaysBitmask: number = DEFAULT_WORK_DAYS,
  lang: number = 0,
) {
  const offset = Math.floor(daysBetween(ANCHOR_DATE, date) / FB_DAYS);
  const fbParts = addFbOffset(ANCHOR_FB_YEAR, ANCHOR_FB_NUM, offset);
  const start = addDays(ANCHOR_DATE, offset * FB_DAYS);
  const end = addDays(start, FB_DAYS - 1);
  const workDaysLeft = countWorkingDaysRemaining(date, end, workDaysBitmask, lang);

  return {
    name: formatFb(fbParts.year, fbParts.num),
    start,
    end,
    workDaysLeft,
  };
}
