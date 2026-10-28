import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';

interface Props {
  onSelect: (address: string) => void;
}

export function DeviceList({ onSelect }: Props) {
  const state = useAsync(() => api.listDevices(), []);

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Registered devices</h2>
        <span className="muted">Live from the indexer</span>
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
