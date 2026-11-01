import { useState } from 'react';
import { api } from '../api/client';
import type { RegionAverage } from '../api/types';

export function RegionLookup() {
  const [regionCode, setRegionCode] = useState('');
  const [epoch, setEpoch] = useState('');
  const [result, setResult] = useState<RegionAverage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchAverage(rc: string, ep: string) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await api.getRegionAverage(Number(rc), Number(ep));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetchAverage(regionCode, epoch);
  }

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Region average</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted">Computed live from accepted readings</span>
          {result && (
            <button
              className="glass-button"
              onClick={() => fetchAverage(regionCode, epoch)}
              disabled={loading}
              aria-label="Refresh region average"
              style={{ padding: '4px 12px', fontSize: 13 }}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      <form className="lookup-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="region-code">Region code</label>
          <input
            id="region-code"
            className="glass-input"
            type="number"
            required
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            placeholder="e.g. 42"
          />
        </div>
        <div className="field">
          <label htmlFor="region-epoch">Epoch</label>
          <input
            id="region-epoch"
            className="glass-input"
            type="number"
            required
            value={epoch}
            onChange={(e) => setEpoch(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>
        <button className="glass-button" type="submit" disabled={loading}>
          {loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      {error && <p className="state-msg error">{error}</p>}

      {result && (
        <div className="result-figure">
          <span className="value">{result.average ?? '—'}</span>
          <span className="unit">
            average reading, region {result.regionCode}, epoch {result.epoch}
          </span>
        </div>
      )}
    </section>
  );
}
