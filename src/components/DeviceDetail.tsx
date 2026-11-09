import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { formatRelativeTime, truncateAddress } from '../format';
import { ErrorMessage, EmptyMessage, PanelSkeleton } from './StatusMessage';
import { ClaimAction } from './ClaimAction';
import { ReadingsChart } from './ReadingsChart';
import { getRejectedStatus } from '../wallet/contracts';
import type { Reading } from '../api/types';

interface Props {
  address: string;
  onBack: () => void;
}

// Freshness, not a live feed — the indexer has no push/websocket support (see
// indexer's README "Known limitations"), so this is a plain polling refetch.
const AUTO_REFRESH_INTERVAL_MS = 12_000;
const READINGS_PAGE_SIZE = 20;

export function DeviceDetail({ address, onBack }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const device = useAsync(() => api.getDevice(address), [address, refreshKey]);
  const readings = useAsync(() => api.getReadings(address, READINGS_PAGE_SIZE), [address, refreshKey]);
  const claims = useAsync(() => api.getClaims(address), [address, refreshKey]);
  const rejectedStatus = useAsync(() => getRejectedStatus(address), [address, refreshKey]);

  // Readings pagination: the first page comes through `readings` above (via
  // useAsync, so it participates in refresh/auto-refresh normally); "Load
  // more" appends subsequent pages on top of it. A fresh first page (new
  // address, manual/auto refresh) resets this back to empty.
  //
  // `moreAvailable` is derived during render, not tracked as its own piece
  // of state kept in sync via an effect — a full page suggests another page
  // might exist, and that's knowable directly from whichever page loaded
  // last (`lastExtraBatchSize` once "Load more" has been used at least
  // once, otherwise `readings` itself) without a second render ever
  // observing a stale answer in between.
  const [moreReadings, setMoreReadings] = useState<Reading[]>([]);
  const [lastExtraBatchSize, setLastExtraBatchSize] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setMoreReadings([]);
    setLastExtraBatchSize(null);
  }, [address, refreshKey]);

  const moreAvailable =
    readings.status === 'success' &&
    (lastExtraBatchSize === null
      ? readings.data.length === READINGS_PAGE_SIZE
      : lastExtraBatchSize === READINGS_PAGE_SIZE);

  async function loadMoreReadings() {
    if (readings.status !== 'success') return;
    setLoadingMore(true);
    try {
      const offset = READINGS_PAGE_SIZE + moreReadings.length;
      const batch = await api.getReadings(address, READINGS_PAGE_SIZE, offset);
      setMoreReadings((prev) => [...prev, ...batch]);
      setLastExtraBatchSize(batch.length);
    } finally {
      setLoadingMore(false);
    }
  }

  const allReadings = readings.status === 'success' ? [...readings.data, ...moreReadings] : [];

  const isRefreshing =
    device.status === 'loading' || readings.status === 'loading' || claims.status === 'loading';
  // Read via a ref inside the interval below so the interval itself doesn't
  // need recreating (and its 12s cadence restarting) every time a fetch
  // starts or finishes.
  const isRefreshingRef = useRef(isRefreshing);
  isRefreshingRef.current = isRefreshing;

  // Auto-refresh while this view is open, but only while the tab is actually
  // visible — a backgrounded tab shouldn't keep hitting the indexer. Skips a
  // tick if a fetch triggered by something else (manual refresh, a prior
  // tick) is still in flight, rather than stacking overlapping requests.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isRefreshingRef.current) {
        setRefreshKey((k) => k + 1);
      }
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [address]);

  return (
    <div className="page">
      <span className="back-link" onClick={onBack} role="button" tabIndex={0}>
        ← All devices
      </span>

      <section className="glass panel">
        <div className="panel-header">
          <h2>{truncateAddress(address, 10, 10)}</h2>
          <button
            className="glass-button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isRefreshing}
            aria-label="Refresh device details"
            style={{ padding: '4px 12px', fontSize: 13 }}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {device.status === 'loading' && <PanelSkeleton rows={4} />}
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
            {rejectedStatus.status === 'success' && (
              <div className="row">
                <span className="k">Rejected readings</span>
                {rejectedStatus.data.threshold > 0 ? (
                  <span
                    className={`pill ${
                      rejectedStatus.data.rejectedCount >= rejectedStatus.data.threshold
                        ? 'pill-danger'
                        : 'pill-neutral'
                    }`}
                  >
                    {rejectedStatus.data.rejectedCount} / {rejectedStatus.data.threshold}
                  </span>
                ) : (
                  <span className="v">{rejectedStatus.data.rejectedCount} (auto-slash disabled)</span>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <div className="two-col">
        <section className="glass panel">
          <div className="panel-header">
            <h2>Recent readings</h2>
          </div>
          {readings.status === 'loading' && <PanelSkeleton rows={3} />}
          {readings.status === 'error' && <ErrorMessage message={readings.error} />}
          {readings.status === 'success' && allReadings.length === 0 && (
            <EmptyMessage label="No readings yet." />
          )}
          {readings.status === 'success' && <ReadingsChart readings={allReadings} />}
          {readings.status === 'success' &&
            allReadings.map((reading) => (
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
          {readings.status === 'success' && moreAvailable && (
            <button
              className="glass-button"
              onClick={loadMoreReadings}
              disabled={loadingMore}
              style={{ width: '100%', marginTop: 10 }}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </section>

        <section className="glass panel">
          <div className="panel-header">
            <h2>Claims</h2>
          </div>
          {claims.status === 'loading' && <PanelSkeleton rows={3} />}
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
                    {formatRelativeTime(claim.closed_at)}
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
