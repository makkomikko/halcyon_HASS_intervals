#!/usr/bin/env node
'use strict';

var path = require('path');
var FbSchedule = require(path.join(__dirname, '..', 'src', 'pkjs', 'fbschedule'));
var WorkSchedule = require(path.join(__dirname, '..', 'src', 'pkjs', 'workschedule'));
var FiHolidays = require(path.join(__dirname, '..', 'src', 'pkjs', 'fiholidays'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateAt(y, m, d) {
  return new Date(y, m, d);
}

function run() {
  var fb = FbSchedule.getFbForDate(dateAt(2026, 8, 9), {}, 0);
  assert(fb.name === 'FB2619', '2026-09-09 should be FB2619, got ' + fb.name);

  fb = FbSchedule.getFbForDate(dateAt(2026, 8, 22), {}, 0);
  assert(fb.name === 'FB2619', '2026-09-22 should still be FB2619, got ' + fb.name);

  fb = FbSchedule.getFbForDate(dateAt(2026, 8, 23), {}, 0);
  assert(fb.name === 'FB2620', '2026-09-23 should be FB2620, got ' + fb.name);

  var offset8 = FbSchedule.getFbForDate(dateAt(2026, 11, 30), {}, 0);
  assert(offset8.name === 'FB2701', 'After FB2626 should be FB2701, got ' + offset8.name);

  assert(FbSchedule.formatFb(26, 19) === 'FB2619', 'formatFb 26/19');
  assert(FbSchedule.formatFb(27, 1) === 'FB2701', 'formatFb 27/1');

  var wedToFri = WorkSchedule.countWorkingDaysRemaining(
    dateAt(2026, 8, 9),
    dateAt(2026, 8, 11),
    WorkSchedule.DEFAULT_WORK_DAYS,
    0
  );
  assert(wedToFri === 3, 'Wed-Fri should be 3 working days, got ' + wedToFri);

  assert(FiHolidays.isPublicHoliday(dateAt(2026, 11, 6)), '2026-12-06 is Independence Day');
  assert(FiHolidays.isPublicHoliday(dateAt(2026, 5, 19)), '2026-06-19 is Midsummer Eve');
  assert(!FiHolidays.isPublicHoliday(dateAt(2026, 8, 10)), '2026-09-10 is not a holiday');

  var finnishDays = WorkSchedule.countWorkingDaysRemaining(
    dateAt(2026, 11, 4),
    dateAt(2026, 11, 8),
    WorkSchedule.DEFAULT_WORK_DAYS,
    WorkSchedule.LANGUAGE_FI
  );
  assert(finnishDays === 3, 'Finnish week around Dec 6 should be 3 days, got ' + finnishDays);

  var activeOnHoliday = WorkSchedule.isActive(
    { SETTING_WORK_SCHEDULE_ENABLED: 1, SETTING_WORK_START: 540, SETTING_WORK_END: 900, SETTING_WORK_DAYS: 62 },
    dateAt(2026, 3, 3, 10, 0, 0),
    WorkSchedule.LANGUAGE_FI
  );
  assert(!activeOnHoliday, 'Work schedule should be inactive on Good Friday (Finnish public holiday)');

  console.log('All fbschedule tests passed.');
}

run();
