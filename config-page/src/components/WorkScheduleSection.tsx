import React from 'react';
import { useConfig } from '../context/PebbleConfigContext';
import { Section } from './Section';
import { Toggle } from './Toggle';
import { TextInput } from './TextInput';
import { FormItem } from './FormItem';
import { getFbForDate } from '../utils/fbSchedule';
import { renderPreview } from '../data/i18nPreview';

const WEEKDAYS = [
  { label: 'Sun', bit: 0 },
  { label: 'Mon', bit: 1 },
  { label: 'Tue', bit: 2 },
  { label: 'Wed', bit: 3 },
  { label: 'Thu', bit: 4 },
  { label: 'Fri', bit: 5 },
  { label: 'Sat', bit: 6 },
];

const DEFAULT_WORK_DAYS = 62;
const DEFAULT_WORK_START = 540;
const DEFAULT_WORK_END = 900;

const WORK_WIDGET_SLOTS = [
  {
    key: 'SETTING_WORK_WIDGET_UPPER_SECONDARY' as const,
    label: 'Work upper secondary',
    placeholder: 'Leave empty to keep off-work widget',
  },
  {
    key: 'SETTING_WORK_WIDGET_UPPER_PRIMARY' as const,
    label: 'Work upper primary',
    placeholder: '{fb_name}',
  },
  {
    key: 'SETTING_WORK_WIDGET_LOWER_PRIMARY' as const,
    label: 'Work lower primary',
    placeholder: '{fb_days_left}d',
  },
  {
    key: 'SETTING_WORK_WIDGET_LOWER_SECONDARY' as const,
    label: 'Work lower secondary',
    placeholder: 'Leave empty to keep off-work widget',
  },
];

function parseIntSetting(value: number | string | undefined, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isNaN(n) ? fallback : n;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

function timeToMinutes(value: string, fallback: number): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return h * 60 + m;
}

export const WorkScheduleSection: React.FC = () => {
  const { settings, updateSetting } = useConfig();
  const lang = Number(settings.SETTING_LANGUAGE) || 0;
  const workDays = parseIntSetting(settings.SETTING_WORK_DAYS, DEFAULT_WORK_DAYS);
  const fb = React.useMemo(() => getFbForDate(new Date(), workDays, lang), [workDays, lang]);

  const updateWorkDays = (bit: number, enabled: boolean) => {
    const next = enabled ? workDays | (1 << bit) : workDays & ~(1 << bit);
    updateSetting('SETTING_WORK_DAYS', next);
  };

  const updateWorkTime = (key: 'SETTING_WORK_START' | 'SETTING_WORK_END', value: string) => {
    const fallback = key === 'SETTING_WORK_START' ? DEFAULT_WORK_START : DEFAULT_WORK_END;
    updateSetting(key, timeToMinutes(value, fallback));
  };

  return (
    <Section title="Work Schedule">
      <Toggle
        label="Enable work schedule"
        description="During work hours, show work widgets instead of the normal layout"
        messageKey="SETTING_WORK_SCHEDULE_ENABLED"
      />
      <Toggle
        label="Holiday mode"
        description="Disable work schedule until turned off (e.g. vacation)"
        messageKey="SETTING_HOLIDAY_MODE"
      />

      <FormItem
        label="Work hours"
        description="Widgets switch during these hours on selected weekdays"
      >
        <div className="halite-work-time-row">
          <label className="halite-work-time-label">
            Start
            <input
              className="halite-input"
              type="time"
              value={minutesToTime(parseIntSetting(settings.SETTING_WORK_START, DEFAULT_WORK_START))}
              onChange={(event) => updateWorkTime('SETTING_WORK_START', event.target.value)}
            />
          </label>
          <label className="halite-work-time-label">
            End
            <input
              className="halite-input"
              type="time"
              value={minutesToTime(parseIntSetting(settings.SETTING_WORK_END, DEFAULT_WORK_END))}
              onChange={(event) => updateWorkTime('SETTING_WORK_END', event.target.value)}
            />
          </label>
        </div>
      </FormItem>

      <FormItem label="Work days" description="Weekdays counted for work hours and FB days remaining">
        <div className="halite-work-days">
          {WEEKDAYS.map((day) => (
            <label key={day.bit} className="halite-work-day">
              <input
                type="checkbox"
                checked={(workDays & (1 << day.bit)) !== 0}
                onChange={(event) => updateWorkDays(day.bit, event.target.checked)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </FormItem>

      {WORK_WIDGET_SLOTS.map((slot) => (
        <TextInput
          key={slot.key}
          label={slot.label}
          description={slot.key === WORK_WIDGET_SLOTS[0].key
            ? 'Optional overrides during work hours. Tokens: {fb_name}, {fb_days_left}. Empty slot keeps the off-work widget.'
            : undefined}
          messageKey={slot.key}
          placeholder={slot.placeholder}
          spellCheck={false}
        />
      ))}

      <p className="halite-description">
        Today: <strong>{fb.name}</strong> — {fb.workDaysLeft} working day
        {fb.workDaysLeft === 1 ? '' : 's'} remaining
        {lang === 20 ? ' (Finnish public holidays excluded)' : ''}
      </p>
      <p className="halite-description">
        Preview: {renderPreview('{fb_name}', lang)} / {renderPreview('{fb_days_left}d', lang)}
      </p>
    </Section>
  );
};
