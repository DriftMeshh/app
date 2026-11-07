import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { truncateAddress, formatUnixSeconds } from '../format';
import { LoadingMessage, ErrorMessage, EmptyMessage } from './StatusMessage';
import type { Device } from '../api/types';

interface Props {
  onSelect: (address: string) => void;
}

type SortKey = 'address' | 'device_type' | 'active' | 'registered_at';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'address', label: 'Device' },
  { key: 'device_type', label: 'Type' },
  { key: 'active', label: 'Status' },
  { key: 'registered_at', label: 'Registered' },
];

const PAGE_SIZE = 10;
// The server's own max page size (see indexer's MAX_LIMIT) — requesting this
// up front means "everything" in practice for any realistic fleet size,
// while still being honest via `total` if a fleet ever actually exceeds it.
const FETCH_LIMIT = 500;

function compare(a: Device, b: Device, key: SortKey): number {
  if (key === 'active') return a.active - b.active;
  if (key === 'registered_at') return a.registered_at - b.registered_at;
  return String(a[key]).localeCompare(String(b[key]));
}

export function DeviceList({ onSelect }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('registered_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const state = useAsync(() => api.listDevicesPage({ limit: FETCH_LIMIT }), [refreshKey]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  const filteredSorted = useMemo(() => {
    if (state.status !== 'success') return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? state.data.data.filter(
          (d) => d.address.toLowerCase().includes(q) || d.device_type.toLowerCase().includes(q),
        )
      : state.data.data;
    const sorted = [...filtered].sort((a, b) => compare(a, b, sortKey));
    return sortDir === 'asc' ? sorted : sorted.reverse();
  }, [state, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  // Search/sort/refresh can shrink the result set out from under the
  // current page (e.g. typing a narrower search while on page 3) — clamp
  // rather than show a confusing empty page.
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filteredSorted.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Registered devices</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted">Live from the indexer</span>
          <button
            className="glass-button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              setPage(0);
            }}
            disabled={state.status === 'loading'}
            aria-label="Refresh device list"
            style={{ padding: '4px 12px', fontSize: 13 }}
          >
            {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {state.status === 'success' && state.data.data.length > 0 && (
        <div className="table-toolbar">
          <input
            className="glass-input"
            placeholder="Search by address or type…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            aria-label="Search devices"
          />
          <span className="muted">
            {filteredSorted.length} of {state.data.total}
            {state.data.data.length < state.data.total &&
              ` (showing first ${state.data.data.length})`}
          </span>
        </div>
      )}

      {state.status === 'loading' && <LoadingMessage label="Fetching devices…" />}
      {state.status === 'error' && <ErrorMessage message={state.error} />}
      {state.status === 'success' && state.data.data.length === 0 && (
        <EmptyMessage label="No devices indexed yet. Register one with device-sdk and it'll show up here." />
      )}
      {state.status === 'success' && state.data.data.length > 0 && filteredSorted.length === 0 && (
        <EmptyMessage label="No devices match that search." />
      )}
      {state.status === 'success' && filteredSorted.length > 0 && (
        <>
          <div className="device-table-wrap">
            <table className="device-table">
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}>
                      {col.label}
                      {sortKey === col.key && (
                        <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((device) => (
                  <tr
                    key={device.address}
                    onClick={() => onSelect(device.address)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View device ${device.address}`}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect(device.address)}
                  >
                    <td className="addr">{truncateAddress(device.address, 8, 8)}</td>
                    <td className="type">{device.device_type}</td>
                    <td>
                      <span className={`pill ${device.active ? 'pill-success' : 'pill-danger'}`}>
                        {device.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="mono">{formatUnixSeconds(device.registered_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="pagination">
              <button
                className="glass-button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className="muted">
                Page {currentPage + 1} of {pageCount}
              </span>
              <button
                className="glass-button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
