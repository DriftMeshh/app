import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress } from '../format';
import { ErrorMessage, EmptyMessage, MapSkeleton } from './StatusMessage';
import type { Device } from '../api/types';

type LocatedDevice = Device & { lat: number; lon: number };

// Optional — when unset, falls back to plain OpenStreetMap tiles (see
// below) so the map still works with zero setup. When set, uses Mapbox's
// own dark style directly instead of faking one with a CSS filter over
// OSM tiles, and moves off an unauthenticated third-party tile host before
// any real deployment (see app/README.md's known limitations).
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const TILE_CONFIG = MAPBOX_TOKEN
  ? {
      // Raster tiles from a Mapbox *style* (not the legacy classic tile
      // API) — {tileSize}/{z}/{x}/{y}{@2x} is the documented raster
      // endpoint for a style; 512px tiles need zoomOffset=-1 to line up
      // with Leaflet's 256px zoom levels.
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 512,
      zoomOffset: -1,
      osmFallback: false,
    }
  : {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 256,
      zoomOffset: 0,
      osmFallback: true,
    };

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
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useAsync(() => api.listDevices(), [refreshKey]);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted">Plotted from each device's registered coordinates</span>
          <button
            className="glass-button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={state.status === 'loading'}
            aria-label="Refresh device map"
            style={{ padding: '4px 12px', fontSize: 13 }}
          >
            {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {state.status === 'loading' && <MapSkeleton />}
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
              className={`device-leaflet-map${TILE_CONFIG.osmFallback ? ' osm-fallback' : ''}`}
            >
              <TileLayer
                attribution={TILE_CONFIG.attribution}
                url={TILE_CONFIG.url}
                tileSize={TILE_CONFIG.tileSize}
                zoomOffset={TILE_CONFIG.zoomOffset}
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
