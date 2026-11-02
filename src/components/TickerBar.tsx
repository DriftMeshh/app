import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';

/** Binance-style live strip: network totals plus a ticking clock and a
 * pulsing "LIVE" indicator. Polls the indexer on its own interval so it
 * stays current regardless of which tab is open. */
export function TickerBar() {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const poll = setInterval(() => setTick((t) => t + 1), 15_000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const devices = useAsync(() => api.listDevices(), [tick]);

  const total = devices.status === 'success' ? devices.data.length : null;
  const active = devices.status === 'success' ? devices.data.filter((d) => d.active).length : null;
  const inactive = total !== null && active !== null ? total - active : null;
  const types =
    devices.status === 'success' ? new Set(devices.data.map((d) => d.device_type)).size : null;

  return (
    <div className="ticker-bar">
      <div className="ticker-item">
        <span className="ticker-label">Devices</span>
        <span className="ticker-value">{total ?? '—'}</span>
      </div>
      <div className="ticker-item">
        <span className="ticker-label">Active</span>
        <span className="ticker-value up">{active ?? '—'}</span>
      </div>
      <div className="ticker-item">
        <span className="ticker-label">Inactive</span>
        <span className="ticker-value down">{inactive ?? '—'}</span>
      </div>
      <div className="ticker-item">
        <span className="ticker-label">Types</span>
        <span className="ticker-value">{types ?? '—'}</span>
      </div>
      <div className="ticker-item">
        <span className="ticker-label">UTC</span>
        <span className="ticker-value">
          {now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' })}
        </span>
      </div>
      <div className="live-dot-wrap">
        <span className="live-dot" />
        LIVE
      </div>
    </div>
  );
}
