import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { formatTimestamp, truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';
import { ClaimAction } from './ClaimAction';
import { ReadingsChart } from './ReadingsChart';

interface Props {
  address: string;
  onBack: () => void;
}

export function DeviceDetail({ address, onBack }: Props) {
  const device = useAsync(() => api.getDevice(address), [address]);
  const readings = useAsync(() => api.getReadings(address, 20), [address]);
  const claims = useAsync(() => api.getClaims(address), [address]);

  return (
    <div className="page">
      <span className="back-link" onClick={onBack} role="button" tabIndex={0}>
        ← All devices
      </span>

      <section className="glass panel">
        <div className="panel-header">
          <h2>{truncateAddress(address, 10, 10)}</h2>
        </div>
        {device.status === 'loading' && <LoadingMessage />}
        {device.status === 'error' && <ErrorMessage message={device.error} />}
        {device.status === 'success' && (
          <>
            <div className="row">
              <span className="k">Status</span>
              <span className={`pill ${device.data.active ? 'pill-success' : 'pill-danger'}`}>
                {device.data.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="row">
              <span className="k">Type</span>
              <span className="v">{device.data.device_type}</span>
            </div>
            <div className="row">
              <span className="k">Owner</span>
              <span className="v mono">
                {device.data.owner ? truncateAddress(device.data.owner, 8, 8) : 'unknown'}
              </span>
            </div>
            <div className="row">
              <span className="k">Location</span>
              <span className="v">
                {device.data.lat != null && device.data.lon != null
                  ? `${(device.data.lat / 10_000).toFixed(4)}, ${(device.data.lon / 10_000).toFixed(4)}`
                  : 'unknown'}
              </span>
            </div>
          </>
        )}
      </section>

      <div className="two-col">
        <section className="glass panel">
          <div className="panel-header">
            <h2>Recent readings</h2>
          </div>
          {readings.status === 'loading' && <LoadingMessage />}
          {readings.status === 'error' && <ErrorMessage message={readings.error} />}
          {readings.status === 'success' && readings.data.length === 0 && (
            <EmptyMessage label="No readings yet." />
          )}
          {readings.status === 'success' && <ReadingsChart readings={readings.data} />}
          {readings.status === 'success' &&
            readings.data.map((reading) => (
              <div className="row" key={reading.id}>
                <span className="k">
                  epoch {reading.epoch} · region {reading.region_code}
                </span>
                <span className={`v ${reading.accepted ? '' : 'pill pill-danger'}`}>
                  {reading.value}
                  {!reading.accepted ? ' rejected' : ''}
                </span>
              </div>
            ))}
        </section>

        <section className="glass panel">
          <div className="panel-header">
            <h2>Claims</h2>
          </div>
          {claims.status === 'loading' && <LoadingMessage />}
          {claims.status === 'error' && <ErrorMessage message={claims.error} />}
          {claims.status === 'success' && claims.data.length === 0 && (
            <EmptyMessage label="No payouts claimed yet." />
          )}
          {claims.status === 'success' &&
            claims.data.map((claim) => (
              <div className="row" key={claim.id}>
                <span className="k">epoch {claim.epoch}</span>
                <div>
                  <span className="v">{claim.payout}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {formatTimestamp(claim.closed_at)}
                  </div>
                </div>
              </div>
            ))}
          <ClaimAction deviceAddress={address} />
        </section>
      </div>
    </div>
  );
}
