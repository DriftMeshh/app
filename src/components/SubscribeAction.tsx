import { useEffect, useState } from 'react';
import { useWallet } from '../wallet/WalletContext';
import { subscribe, getSubscriptionPrice } from '../wallet/contracts';
import { formatUnixSeconds } from '../format';

/** Stellar/Soroban assets use 7 decimal places (1 unit = 10,000,000 stroops). */
const STROOPS_PER_UNIT = 10_000_000n;

function formatPrice(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_UNIT;
  const frac = stroops % STROOPS_PER_UNIT;
  if (frac === 0n) return `${whole} DMU`;
  const fracStr = frac.toString().padStart(7, '0').replace(/0+$/, '');
  return `${whole}.${fracStr} DMU`;
}

export function SubscribeAction() {
  const { address } = useWallet();
  const [periods, setPeriods] = useState('1');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<bigint | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    getSubscriptionPrice().then(
      (p) => {
        if (!cancelled) setPrice(p);
      },
      () => {
        if (!cancelled) setPriceError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [address]);

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

  const periodsNum = Number(periods) || 0;

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

      <p className="state-msg" style={{ width: '100%', textAlign: 'left' }} data-testid="sub-price">
        {priceError
          ? "Couldn't load the current price — try again shortly."
          : price === null
            ? 'Loading current price…'
            : `${formatPrice(price)} per period — ${formatPrice(price * BigInt(periodsNum))} total`}
      </p>

      <button
        className="glass-button glass-button-primary"
        type="submit"
        disabled={pending || price === null}
      >
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
