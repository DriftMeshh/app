import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const POLL_INTERVAL_MS = 15_000;

/**
 * Top-level banner shown when the configured indexer (VITE_API_BASE) is
 * unreachable. Without this, each view's `useAsync` call just shows its own
 * small error text individually — easy to miss, and gives no app-wide
 * signal that the backend, not just one request, is down.
 */
export function ConnectivityBanner() {
  const [down, setDown] = useState(false);
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    setChecking(true);
    const ok = await api.checkHealth();
    setDown(!ok);
    setChecking(false);
  }

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!down) return null;

  return (
    <div className="connectivity-banner" role="alert">
      <span>Can't reach the DriftMesh backend right now — data shown may be stale.</span>
      <button className="glass-button" onClick={check} disabled={checking}>
        {checking ? 'Checking…' : 'Retry'}
      </button>
    </div>
  );
}
