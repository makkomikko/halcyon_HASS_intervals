import React from 'react';
import { useConfig } from '../context/PebbleConfigContext';
import { Section } from './Section';
import { TextInput } from './TextInput';
import { FormItem } from './FormItem';

export interface HaSensorMapping {
  name: string;
  entity: string;
}

const MAX_SENSORS = 4;

const normalizeTokenName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 12);

const parseSensors = (raw: string): HaSensorMapping[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is HaSensorMapping => {
        return (
          !!item &&
          typeof item === 'object' &&
          typeof item.name === 'string' &&
          typeof item.entity === 'string'
        );
      })
      .map((item) => ({
        name: normalizeTokenName(item.name),
        entity: item.entity.trim(),
      }))
      .filter((item) => item.name && item.entity)
      .slice(0, MAX_SENSORS);
  } catch {
    return [];
  }
};

export const HomeAssistantSection: React.FC = () => {
  const { settings, updateSetting } = useConfig();
  const sensors = React.useMemo(
    () => parseSensors(settings.SETTING_HA_SENSORS),
    [settings.SETTING_HA_SENSORS],
  );

  const saveSensors = (nextSensors: HaSensorMapping[]) => {
    updateSetting('SETTING_HA_SENSORS', JSON.stringify(nextSensors.slice(0, MAX_SENSORS)));
  };

  const updateSensor = (index: number, field: keyof HaSensorMapping, value: string) => {
    const next = sensors.map((sensor, i) => {
      if (i !== index) return sensor;
      if (field === 'name') {
        return { ...sensor, name: normalizeTokenName(value) };
      }
      return { ...sensor, entity: value };
    });
    saveSensors(next);
  };

  const addSensor = () => {
    if (sensors.length >= MAX_SENSORS) return;
    saveSensors([...sensors, { name: '', entity: '' }]);
  };

  const removeSensor = (index: number) => {
    saveSensors(sensors.filter((_, i) => i !== index));
  };

  return (
    <Section title="Home Assistant">
      <TextInput
        label="URL"
        description="Local Home Assistant URL, e.g. http://192.168.1.50:8123"
        messageKey="SETTING_HA_URL"
        spellCheck={false}
      />
      <TextInput
        label="Long-Lived Access Token"
        description="From HA Profile → Security → Long-Lived Access Tokens. Stored on your phone only."
        messageKey="SETTING_HA_TOKEN"
        type="password"
        spellCheck={false}
      />

      <FormItem
        label="Temperature sensors"
        description="Map short token names to HA entity IDs. Use tokens like {ha_lr} in widget formats. When HA is unreachable, the slot shows heart rate instead (requires HRM watch)."
        className="halite-ha-sensors"
      >
        {sensors.map((sensor, index) => (
          <div key={index} className="halite-ha-sensor-row">
            <input
              className="halite-input halite-ha-sensor-name"
              type="text"
              value={sensor.name}
              placeholder="lr"
              maxLength={12}
              onChange={(event) => updateSensor(index, 'name', event.target.value)}
              spellCheck={false}
              aria-label={`Sensor ${index + 1} token name`}
            />
            <input
              className="halite-input halite-ha-sensor-entity"
              type="text"
              value={sensor.entity}
              placeholder="sensor.living_room_temperature"
              onChange={(event) => updateSensor(index, 'entity', event.target.value)}
              spellCheck={false}
              aria-label={`Sensor ${index + 1} entity ID`}
            />
            <button
              type="button"
              className="halite-ha-sensor-remove"
              onClick={() => removeSensor(index)}
              aria-label={`Remove sensor ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        {sensors.length < MAX_SENSORS && (
          <button type="button" className="halite-ha-sensor-add" onClick={addSensor}>
            Add sensor
          </button>
        )}
        {sensors.length > 0 && (
          <p className="halite-description">
            Example widget:{' '}
            {sensors
              .filter((sensor) => sensor.name)
              .map((sensor) => `{ha_${sensor.name}}`)
              .join(' ') || '{ha_lr} {ha_br}'}
          </p>
        )}
      </FormItem>
    </Section>
  );
};
