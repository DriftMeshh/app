import { useState } from 'react';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';

interface Props {
  onSelect: (address: string) => void;
}

export function DeviceList({ onSelect }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useAsync(() => api.listDevices(), [refreshKey]);

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Registered devices</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted">Live from the indexer</span>
          <button
            className="glass-button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={state.status === 'loading'}
            aria-label="Refresh device list"
            style={{ padding: '4px 12px', fontSize: 13 }}
          >
            {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {state.status === 'loading' && <LoadingMessage label="Fetching devices…" />}
      {state.status === 'error' && <ErrorMessage message={state.error} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyMessage label="No devices indexed yet. Register one with device-sdk and it'll show up here." />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <div className="device-grid">
          {state.data.map((device) => (
            <button
              key={device.address}
              className="glass device-card"
              onClick={() => onSelect(device.address)}
              aria-label={`View device ${device.address}`}
            >
              <span className={`pill ${device.active ? 'pill-success' : 'pill-danger'}`}>
                {device.active ? 'Active' : 'Inactive'}
              </span>
              <span className="type">{device.device_type}</span>
              <span className="addr">{truncateAddress(device.address, 8, 8)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
