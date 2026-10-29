import { useState } from 'react';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';
import type { Device } from '../api/types';

const WIDTH = 900;
const HEIGHT = 420;
const LAT_TICKS = [-90, -45, 0, 45, 90];
const LON_TICKS = [-180, -90, 0, 90, 180];

function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return { x, y };
}

interface Props {
  onSelect: (address: string) => void;
}

export function DeviceMap({ onSelect }: Props) {
  const state = useAsync(() => api.listDevices(), []);
  const [hovered, setHovered] = useState<Device | null>(null);

  const located =
    state.status === 'success'
      ? state.data.filter((d): d is Device & { lat: number; lon: number } => d.lat != null && d.lon != null)
      : [];
  const unlocated = state.status === 'success' ? state.data.length - located.length : 0;

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Device map</h2>
        <span className="muted">Plotted from each device's registered coordinates</span>
      </div>

      {state.status === 'loading' && <LoadingMessage label="Fetching devices…" />}
      {state.status === 'error' && <ErrorMessage message={state.error} />}
      {state.status === 'success' && located.length === 0 && (
        <EmptyMessage label="No devices with known locations yet." />
      )}

      {state.status === 'success' && located.length > 0 && (
        <>
          <div className="map-wrap">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="device-map-svg"
              role="img"
              aria-label="Map of device locations"
            >
              <rect x={0} y={0} width={WIDTH} height={HEIGHT} className="map-bg" rx={16} />

              {LAT_TICKS.map((lat) => {
                const { y } = project(lat, 0);
                return (
                  <line
                    key={`lat-${lat}`}
                    x1={0}
                    x2={WIDTH}
                    y1={y}
                    y2={y}
                    className={lat === 0 ? 'map-grid-major' : 'map-grid'}
                  />
                );
              })}
              {LON_TICKS.map((lon) => {
                const { x } = project(0, lon);
                return (
                  <line
                    key={`lon-${lon}`}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={HEIGHT}
                    className={lon === 0 ? 'map-grid-major' : 'map-grid'}
                  />
                );
              })}

              {LAT_TICKS.map((lat) => {
                const { y } = project(lat, -180);
                return (
                  <text key={`lat-label-${lat}`} x={6} y={y - 4} className="map-tick-label">
                    {lat}°
                  </text>
                );
              })}
              {LON_TICKS.map((lon) => {
                const { x } = project(-90, lon);
                return (
                  <text key={`lon-label-${lon}`} x={x + 4} y={HEIGHT - 6} className="map-tick-label">
                    {lon}°
                  </text>
                );
              })}

              {located.map((device) => {
                const { x, y } = project(device.lat / 10_000, device.lon / 10_000);
                return (
                  <g
                    key={device.address}
                    transform={`translate(${x}, ${y})`}
                    className="map-pin"
                    onMouseEnter={() => setHovered(device)}
                    onMouseLeave={() => setHovered((h) => (h?.address === device.address ? null : h))}
                    onClick={() => onSelect(device.address)}
                  >
                    <circle r={9} className={device.active ? 'map-pin-glow-active' : 'map-pin-glow-inactive'} />
                    <circle r={4.5} className={device.active ? 'map-pin-dot-active' : 'map-pin-dot-inactive'} />
                  </g>
                );
              })}
            </svg>

            {hovered && (
              <div className="map-tooltip glass">
                <strong>{hovered.device_type}</strong>
                <span className="mono">{truncateAddress(hovered.address, 6, 6)}</span>
                <span className={`pill ${hovered.active ? 'pill-success' : 'pill-danger'}`}>
                  {hovered.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>

          {unlocated > 0 && (
            <p className="muted" style={{ marginTop: 10 }}>
              {unlocated} device{unlocated === 1 ? '' : 's'} without a known location not shown
              (see the indexer's enrichment notes in its README).
            </p>
          )}
        </>
      )}
    </section>
  );
}
