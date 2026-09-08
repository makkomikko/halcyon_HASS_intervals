
var PING_TIMEOUT_MS = 5000;
var FETCH_TIMEOUT_MS = 15000;
var CACHE_MAX_AGE_MS = 30 * 60 * 1000;
var CACHE_DISPLAY_MAX_AGE_MS = 6 * 60 * 60 * 1000;
var MAX_SENSORS = 4;

function isFresh(data) {
  if (!data || !data.fetchedAt || !data.isHome) return false;
  return (Date.now() - data.fetchedAt) <= CACHE_MAX_AGE_MS;
}

function isDisplayable(data) {
  if (!data || !data.fetchedAt) return false;
  if (!data.isHome) return true;
  return (Date.now() - data.fetchedAt) <= CACHE_DISPLAY_MAX_AGE_MS;
}

function clear() {
  localStorage.removeItem('halcyonHa');
}

function restore() {
  var saved = localStorage.getItem('halcyonHa');
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

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/+$/, '');
}

function authHeader(token) {
  return 'Bearer ' + token;
}

function getSensorMap(settings) {
  settings = settings || {};
  var raw = settings.SETTING_HA_SENSORS;
  if (!raw || typeof raw !== 'string') return [];

  try {
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    var sensors = [];
    for (var i = 0; i < parsed.length && sensors.length < MAX_SENSORS; i++) {
      var item = parsed[i];
      if (!item || typeof item !== 'object') continue;
      var name = String(item.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      var entity = String(item.entity || '').trim();
      if (!name || !entity) continue;
      sensors.push({ name: name, entity: entity });
    }
    return sensors;
  } catch (e) {
    return [];
  }
}

function toCelsius(value, unit) {
  if (unit === '°F' || unit === 'F' || unit === 'fahrenheit') {
    return (value - 32) * 5 / 9;
  }
  return value;
}

function formatTemperature(value, unit, isImperial) {
  if (value === null || value === undefined || isNaN(value)) return '--';

  var celsius = toCelsius(value, unit);
  if (isImperial) {
    return String(Math.round(celsius * 9 / 5 + 32));
  }
  return String(Math.round(celsius));
}

function formatToken(name, data, isImperial) {
  if (!data || !data.isHome || !data.sensors) return '--';

  var sensor = data.sensors[name];
  if (!sensor) return '--';

  return formatTemperature(sensor.value, sensor.unit, isImperial);
}

function request(url, token, timeoutMs, callback, errback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = timeoutMs;
  xhr.setRequestHeader('Authorization', authHeader(token));

  xhr.onload = function () {
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
    if (errback) errback('timeout after ' + timeoutMs + 'ms');
  };
  xhr.send();
}

function ping(url, token, callback, errback) {
  request(normalizeUrl(url) + '/api/', token, PING_TIMEOUT_MS, function () {
    callback(true);
  }, errback);
}

function fetchState(url, token, entity, callback, errback) {
  request(
    normalizeUrl(url) + '/api/states/' + encodeURIComponent(entity),
    token,
    FETCH_TIMEOUT_MS,
    callback,
    errback
  );
}

function extractSensorState(json) {
  if (!json || json.state === undefined || json.state === null) {
    return null;
  }

  var value = parseFloat(json.state);
  if (isNaN(value) || json.state === 'unavailable' || json.state === 'unknown') {
    return null;
  }

  var unit = '';
  if (json.attributes && json.attributes.unit_of_measurement) {
    unit = String(json.attributes.unit_of_measurement);
  }

  return { value: value, unit: unit };
}

function fetch(url, token, sensors, callback, errback) {
  if (!url || !token) {
    if (errback) errback('missing URL or token');
    return;
  }

  if (!sensors || !sensors.length) {
    if (errback) errback('no sensors configured');
    return;
  }

  ping(url, token, function () {
    var pending = sensors.length;
    var failed = false;
    var sensorData = {};

    function fail(reason) {
      if (failed) return;
      failed = true;
      console.log('Home Assistant fetch failed: ' + reason);
      if (errback) errback(reason);
    }

    function done() {
      if (failed) return;
      pending--;
      if (pending > 0) return;

      var data = {
        isHome: true,
        sensors: sensorData,
        fetchedAt: Date.now()
      };

      localStorage.setItem('halcyonHa', JSON.stringify(data));
      console.log('Home Assistant fetched: ' + JSON.stringify(data));

      if (callback) callback(data);
    }

    sensors.forEach(function (sensor) {
      fetchState(url, token, sensor.entity, function (json) {
        var state = extractSensorState(json);
        if (state) {
          sensorData[sensor.name] = state;
        }
        done();
      }, function () {
        done();
      });
    });
  }, function (reason) {
    var awayData = {
      isHome: false,
      sensors: {},
      fetchedAt: Date.now()
    };
    localStorage.setItem('halcyonHa', JSON.stringify(awayData));
    console.log('Home Assistant unreachable (' + reason + '); treating as away');
    if (callback) callback(awayData);
  });
}

module.exports = {
  fetch: fetch,
  restore: restore,
  isFresh: isFresh,
  isDisplayable: isDisplayable,
  clear: clear,
  formatToken: formatToken,
  getSensorMap: getSensorMap,
  MAX_SENSORS: MAX_SENSORS
};
