import { useWallet } from '../wallet/WalletContext';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { aggregateOperatorStats, type DeviceWithClaims } from '../operatorStats';
import { formatDmu, truncateAddress } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';

interface Props {
  onSelectDevice: (address: string) => void;
}

async function fetchOwnerDevices(ownerAddress: string): Promise<DeviceWithClaims[]> {
  // The indexer has no "devices for owner X" endpoint — filtering client-side
  // is fine at today's data scale; a real indexer endpoint would be a
  // separate issue in that repo if a fleet ever outgrows this.
  const allDevices = await api.listDevices({ limit: 500 });
  const owned = allDevices.filter((d) => d.owner === ownerAddress);
  return Promise.all(
    owned.map(async (device) => ({ device, claims: await api.getClaims(device.address) })),
  );
}

export function OperatorDashboard({ onSelectDevice }: Props) {
  const { address } = useWallet();
  const state = useAsync(
    () => (address ? fetchOwnerDevices(address) : Promise.resolve([])),
    [address],
  );

  if (!address) {
    return <p className="state-msg">Connect your wallet above to see your devices.</p>;
  }

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>My devices</h2>
        <span className="muted">Owner: {truncateAddress(address, 8, 8)}</span>
      </div>

      {state.status === 'loading' && <LoadingMessage label="Fetching your devices…" />}
      {state.status === 'error' && <ErrorMessage message={state.error} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyMessage label="No devices are registered with this wallet as owner." />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <OperatorStatsView entries={state.data} onSelectDevice={onSelectDevice} />
      )}
    </section>
  );
}

function OperatorStatsView({
  entries,
  onSelectDevice,
}: {
  entries: DeviceWithClaims[];
  onSelectDevice: (address: string) => void;
}) {
  const stats = aggregateOperatorStats(entries);

  return (
    <>
      <div className="hero-stats glass-strong" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-value">{stats.deviceCount}</span>
          <span className="stat-label">devices owned</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value">{stats.activeCount}</span>
          <span className="stat-label">currently active</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value">{formatDmu(stats.totalClaimed)}</span>
          <span className="stat-label">claimed across {stats.claimCount} epochs</span>
        </div>
      </div>

      {entries.map(({ device, claims }) => {
        const deviceTotal = claims.reduce((sum, c) => sum + BigInt(c.payout), 0n);
        return (
          <div
            className="row"
            key={device.address}
            onClick={() => onSelectDevice(device.address)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectDevice(device.address)}
          >
            <span className="k">
              {truncateAddress(device.address, 8, 8)}
              <span className={`pill ${device.active ? 'pill-success' : 'pill-danger'}`} style={{ marginLeft: 8 }}>
                {device.active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span className="v">{formatDmu(deviceTotal)}</span>
          </div>
        );
      })}
    </>
  );
}
