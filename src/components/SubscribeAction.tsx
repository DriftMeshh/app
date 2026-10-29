import { useState } from 'react';
import { useWallet } from '../wallet/WalletContext';
import { subscribe } from '../wallet/contracts';
import { formatUnixSeconds } from '../format';

export function SubscribeAction() {
  const { address } = useWallet();
  const [periods, setPeriods] = useState('1');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<bigint | null>(null);

  if (!address) {
    return (
      <p className="state-msg">Connect your wallet above to subscribe for feed access.</p>
    );
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setError(null);
    setExpiry(null);
    setPending(true);
    try {
      const newExpiry = await subscribe(address, Number(periods));
      setExpiry(newExpiry);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="lookup-form" onSubmit={handleSubscribe}>
      <div className="field">
        <label htmlFor="sub-periods">Periods</label>
        <input
          id="sub-periods"
          className="glass-input"
          type="number"
          min={1}
          required
          value={periods}
          onChange={(e) => setPeriods(e.target.value)}
        />
      </div>
      <button className="glass-button glass-button-primary" type="submit" disabled={pending}>
        {pending ? 'Confirm in wallet…' : 'Subscribe'}
      </button>

      {error && <p className="state-msg error" style={{ width: '100%' }}>{error}</p>}
      {expiry !== null && (
        <p className="state-msg" style={{ width: '100%', textAlign: 'left' }}>
          Subscribed — access now runs through {formatUnixSeconds(Number(expiry))}. It may take a
          few seconds for the indexer to reflect this above.
        </p>
      )}
    </form>
  );
}
