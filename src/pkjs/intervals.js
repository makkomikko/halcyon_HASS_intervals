
var INTERVALS_BASE = 'https://intervals.icu/api/v1';
var FETCH_TIMEOUT_MS = 15000;
var CACHE_MAX_AGE_MS = 30 * 60 * 1000;
var CACHE_DISPLAY_MAX_AGE_MS = 6 * 60 * 60 * 1000;
var RUN_TYPES = { Run: true, TrailRun: true, VirtualRun: true };

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatLocalDate(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function getWeekStartMonday() {
  var now = new Date();
  var day = now.getDay();
  var diff = (day + 6) % 7;
  var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return formatLocalDate(monday);
}

function getToday() {
  return formatLocalDate(new Date());
}

function isFresh(data) {
  if (!data || !data.fetchedAt) return false;
  if (data.wellnessDate !== getToday()) return false;
  return (Date.now() - data.fetchedAt) <= CACHE_MAX_AGE_MS;
}

function isDisplayable(data) {
  if (!data || !data.fetchedAt) return false;
  if (data.wellnessDate !== getToday()) return false;
  return (Date.now() - data.fetchedAt) <= CACHE_DISPLAY_MAX_AGE_MS;
}

function clear() {
  localStorage.removeItem('halcyonIntervals');
}

function restore() {
  var saved = localStorage.getItem('halcyonIntervals');
  if (!saved) return null;

  try {
    var data = JSON.parse(saved);
    if (isDisplayable(data)) return data;
    clear();
    return null;
  } catch (e) {
    clear();
    return null;
  }
}

function formatStats(data) {
  if (!data) return '--KM -- HRV';

  var km = data.runWeekKm;
  var hrv = data.hrv;

  var kmText = (km === null || km === undefined) ? '--' : String(km);
  var hrvText = (hrv === null || hrv === undefined) ? '-- HRV' : String(hrv) + 'HRV';

  return kmText + 'KM ' + hrvText;
}

function sumRunDistanceKm(activities) {
  var totalMeters = 0;

  if (!activities || !activities.length) return 0;

  for (var i = 0; i < activities.length; i++) {
    var activity = activities[i];
    if (!activity || !RUN_TYPES[activity.type]) continue;
    if (typeof activity.distance === 'number') {
      totalMeters += activity.distance;
    }
  }

  return (totalMeters / 1000).toFixed(1);
}

function extractTodayHrv(wellness) {
  if (!wellness) return null;

  var value = wellness.hrv;
  if (value === null || value === undefined) {
    value = wellness.hrvSDNN;
  }
  if (value === null || value === undefined) return null;

  return Math.round(value);
}

function authHeader(apiKey) {
  return 'Basic ' + btoa('API_KEY:' + apiKey);
}

function requestJson(url, apiKey, callback, errback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = FETCH_TIMEOUT_MS;
  xhr.setRequestHeader('Authorization', authHeader(apiKey));

  xhr.onload = function () {
    if (xhr.status === 404) {
      callback(null);
      return;
    }
    if (xhr.status !== 200) {
      if (errback) errback('status ' + xhr.status);
      return;
    }
    try {
      callback(JSON.parse(xhr.responseText));
    } catch (e) {
      if (errback) errback('parse error: ' + e);
    }
  };
  xhr.onerror = function () {
    if (errback) errback('network error');
  };
  xhr.ontimeout = function () {
    if (errback) errback('timeout after ' + FETCH_TIMEOUT_MS + 'ms');
  };
  xhr.send();
}

function fetch(apiKey, callback, errback) {
  if (!apiKey) {
    if (errback) errback('missing API key');
    return;
  }

  var monday = getWeekStartMonday();
  var today = getToday();
  var activitiesUrl = INTERVALS_BASE +
    '/athlete/0/activities?oldest=' + monday +
    '&newest=' + today +
    '&fields=type,distance';
  var wellnessUrl = INTERVALS_BASE + '/athlete/0/wellness/' + today;

  var pending = 2;
  var failed = false;
  var activities = null;
  var wellness = null;

  function fail(reason) {
    if (failed) return;
    failed = true;
    console.log('Intervals fetch failed: ' + reason);
    if (errback) errback(reason);
  }

  function done() {
    if (failed) return;
    pending--;
    if (pending > 0) return;

    var data = {
      runWeekKm: sumRunDistanceKm(activities),
      hrv: extractTodayHrv(wellness),
      wellnessDate: today,
      fetchedAt: Date.now()
    };

    localStorage.setItem('halcyonIntervals', JSON.stringify(data));
    console.log('Intervals fetched: ' + JSON.stringify(data));

    if (callback) callback(data);
  }

  requestJson(activitiesUrl, apiKey, function (json) {
    activities = json || [];
    done();
  }, fail);

  requestJson(wellnessUrl, apiKey, function (json) {
    wellness = json;
    done();
  }, fail);
}

module.exports = {
  fetch: fetch,
  restore: restore,
  isFresh: isFresh,
  isDisplayable: isDisplayable,
  clear: clear,
  formatStats: formatStats
};
