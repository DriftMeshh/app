import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';
import type { Device } from '../api/types';

type LocatedDevice = Device & { lat: number; lon: number };

function toLatLng(device: LocatedDevice): [number, number] {
  return [device.lat / 10_000, device.lon / 10_000];
}

function makePinIcon(active: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span class="leaflet-pin ${active ? 'leaflet-pin-active' : 'leaflet-pin-inactive'}"><span class="leaflet-pin-glow"></span></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

/** Auto-frames the map around whatever devices are plotted, instead of a fixed zoom that might crop them out or show empty ocean. */
function FitToDevices({ devices }: { devices: LocatedDevice[] }) {
  const map = useMap();

  useEffect(() => {
    if (devices.length === 0) return;
    if (devices.length === 1) {
      map.setView(toLatLng(devices[0]), 6);
      return;
    }
    map.fitBounds(L.latLngBounds(devices.map(toLatLng)), { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  return null;
}

interface Props {
  onSelect: (address: string) => void;
}

export function DeviceMap({ onSelect }: Props) {
  const state = useAsync(() => api.listDevices(), []);
  const activeIcon = useMemo(() => makePinIcon(true), []);
  const inactiveIcon = useMemo(() => makePinIcon(false), []);

  const located: LocatedDevice[] =
    state.status === 'success'
      ? state.data.filter((d): d is LocatedDevice => d.lat != null && d.lon != null)
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
          <div className="leaflet-wrap">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              scrollWheelZoom
              className="device-leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToDevices devices={located} />
              {located.map((device) => (
                <Marker
                  key={device.address}
                  position={toLatLng(device)}
                  icon={device.active ? activeIcon : inactiveIcon}
                  eventHandlers={{ click: () => onSelect(device.address) }}
                >
                  <Popup>
                    <strong>{device.device_type}</strong>
                    <br />
                    <span className="mono">{truncateAddress(device.address, 6, 6)}</span>
                    <br />
                    {device.active ? 'Active' : 'Inactive'}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
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
