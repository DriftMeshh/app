import { useState } from 'react';
import { api } from '../api/client';
import type { SubscriptionStatus } from '../api/types';
import { formatUnixSeconds } from '../format';
import { SubscribeAction } from './SubscribeAction';
import { useWallet } from '../wallet/WalletContext';

export function SubscriptionCheck() {
  const { address: walletAddress } = useWallet();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<SubscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await api.getSubscription(address.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass panel">
      <div className="panel-header">
        <h2>Subscription status</h2>
        <span className="muted">Check whether an address has active feed access</span>
      </div>

      <form className="lookup-form" onSubmit={handleSubmit}>
        <div className="field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="sub-address">Stellar address</label>
          <input
            id="sub-address"
            className="glass-input"
            style={{ width: '100%' }}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="G… or C…"
          />
        </div>
        {walletAddress && (
          <button
            type="button"
            className="glass-button"
            onClick={() => setAddress(walletAddress)}
          >
            Use my wallet
          </button>
        )}
        <button className="glass-button" type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && <p className="state-msg error">{error}</p>}

      {result && (
        <div style={{ marginTop: 18 }}>
          <div className="row">
            <span className="k">Status</span>
            <span className={`pill ${result.active ? 'pill-success' : 'pill-neutral'}`}>
              {result.active ? 'Active' : 'Not subscribed'}
            </span>
          </div>
          <div className="row">
            <span className="k">Expires</span>
            <span className="v">{formatUnixSeconds(result.expiry)}</span>
          </div>
        </div>
      )}

      <div className="divider" />
      <h3 className="subsection-title">Subscribe</h3>
      <SubscribeAction />
    </section>
  );
}
