// Keep in sync with config-page/src/data/widgetTypes.ts (WIDGET_TOKENS).

var MAX_WIDGET_FORMAT_LENGTH = 47;

var FORK_CATEGORIES = {
  'Feature Build': true,
  'Intervals.icu': true,
  'Home Assistant': true
};

var WIDGET_TOKENS = [
  { token: '{local_date}', label: 'Local Date', category: 'Date & Time' },
  { token: '{alt_tz}', label: 'Alt TZ Full', category: 'World Time' },
  { token: '{alt_tz_label}', label: 'Alt TZ Label', category: 'World Time' },
  { token: '{alt_tz_time}', label: 'Alt TZ Time', category: 'World Time' },
  { token: '{alt_tz_day}', label: 'Alt TZ Day', category: 'World Time' },
  { token: '{alt_tz2}', label: 'Alt TZ 2 Full', category: 'World Time' },
  { token: '{alt_tz2_label}', label: 'Alt TZ 2 Label', category: 'World Time' },
  { token: '{alt_tz2_time}', label: 'Alt TZ 2 Time', category: 'World Time' },
  { token: '{alt_tz2_day}', label: 'Alt TZ 2 Day', category: 'World Time' },
  { token: '{day_name}', label: 'Day Name', category: 'Date & Time' },
  { token: '{month_name}', label: 'Month Name', category: 'Date & Time' },
  { token: '{day0}', label: 'Day (Leading Zero)', category: 'Date & Time' },
  { token: '{day}', label: 'Day', category: 'Date & Time' },
  { token: '{month_num}', label: 'Month No.', category: 'Date & Time' },
  { token: '{year}', label: 'Year', category: 'Date & Time' },
  { token: '{day_of_year}', label: 'Day No.', category: 'Date & Time' },
  { token: '{week_of_year}', label: 'Week No.', category: 'Date & Time' },
  { token: '{sunrise}', label: 'Sunrise', category: 'Solar' },
  { token: '{sunset}', label: 'Sunset', category: 'Solar' },
  { token: '{next_solar}', label: 'Next sunrise/sunset', category: 'Solar' },
  { token: '{next_solar_label}', label: 'Rise/Set Label', category: 'Solar' },
  { token: '{next_solar_time}', label: 'Solar Time', category: 'Solar' },
  { token: '{steps}', label: 'Steps', category: 'Health & Device', requires: 'health' },
  { token: '{dist}', label: 'Distance', category: 'Health & Device', requires: 'health' },
  { token: '{dist_unit}', label: 'Dist. Unit', category: 'Health & Device', requires: 'health' },
  { token: '{hr}', label: 'Heart Rate', category: 'Health & Device', requires: 'hrm' },
  { token: '{icu_stats}', label: 'Intervals.icu Stats', category: 'Intervals.icu' },
  { token: '{fb_name}', label: 'Feature Build Name', category: 'Feature Build' },
  { token: '{fb_days_left}', label: 'FB Working Days Left', category: 'Feature Build' },
  { token: '{ha_lr}', label: 'HA Living Room', category: 'Home Assistant' },
  { token: '{ha_br}', label: 'HA Bedroom', category: 'Home Assistant' },
  { token: '{batt}', label: 'Battery', category: 'Health & Device' },
  { token: '{temp}', label: 'Temp', category: 'Weather' },
  { token: '{thi}', label: 'High', category: 'Weather' },
  { token: '{tlo}', label: 'Low', category: 'Weather' },
  { token: '{cond}', label: 'Condition', category: 'Weather' },
  { token: '{cond_day}', label: 'Day Cond.', category: 'Weather' },
  { token: '{hum}', label: 'Humidity', category: 'Weather' },
  { token: '{wind}', label: 'Wind', category: 'Weather' },
  { token: '{wind_unit}', label: 'Wind Unit', category: 'Weather' },
  { token: '{wind_dir}', label: 'Wind Dir.', category: 'Weather' },
  { token: '{uv}', label: 'UV', category: 'Weather' },
  { token: '{rain}', label: 'Rain', category: 'Weather' },
  { token: '{pop}', label: 'Rain %', category: 'Weather' },
  { token: '{dew}', label: 'Dew Point', category: 'Weather' },
  { token: '{temp_unit}', label: 'Temp Unit', category: 'Weather' }
];

function groupTokensByCategory(tokens) {
  var groups = {};
  tokens.forEach(function (item) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  });
  return groups;
}

function compareLabels(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function compareCategories(a, b) {
  if (a === 'Custom') return 1;
  if (b === 'Custom') return -1;
  return compareLabels(a, b);
}

function filterTokensByCapabilities(tokens, hasHealth, hasHrm) {
  return tokens.filter(function (token) {
    if (token.requires === 'health') return hasHealth;
    if (token.requires === 'hrm') return hasHrm;
    return true;
  });
}

function isForkCategory(category) {
  return !!FORK_CATEGORIES[category];
}
