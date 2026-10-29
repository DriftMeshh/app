import { useState } from 'react';
import { useWallet } from '../wallet/WalletContext';
import { claim } from '../wallet/contracts';

interface Props {
  deviceAddress: string;
}

/**
 * Claiming requires the device's own signature (payment-streamer.claim
 * calls device.require_auth()) — so this only renders anything useful
 * when the connected wallet IS the device being viewed. A human
 * operating a real device from their own wallet is an unusual setup
 * (a real sensor's keys live on the device, not in a browser extension)
 * but this is exactly the case device-sdk's simulator stands in for, so
 * the same wallet can legitimately be "the device" for demo purposes.
 */
export function ClaimAction({ deviceAddress }: Props) {
  const { address } = useWallet();
  const [epoch, setEpoch] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payout, setPayout] = useState<bigint | null>(null);

  if (address !== deviceAddress) {
    return null;
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setError(null);
    setPayout(null);
    setPending(true);
    try {
      const amount = await claim(address, Number(epoch));
      setPayout(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="claim-box glass">
      <h3 className="subsection-title">Claim your payout</h3>
      <p className="muted" style={{ marginBottom: 12 }}>
        This wallet matches the device being viewed — you can claim its earnings for a
        specific epoch.
      </p>
      <form className="lookup-form" onSubmit={handleClaim}>
        <div className="field">
          <label htmlFor="claim-epoch">Epoch</label>
          <input
            id="claim-epoch"
            className="glass-input"
            type="number"
            required
            value={epoch}
            onChange={(e) => setEpoch(e.target.value)}
            placeholder="e.g. 7"
          />
        </div>
        <button className="glass-button glass-button-primary" type="submit" disabled={pending}>
          {pending ? 'Confirm in wallet…' : 'Claim'}
        </button>
      </form>
      {error && <p className="state-msg error">{error}</p>}
      {payout !== null && (
        <p className="state-msg">
          Claimed {payout.toString()} — it may take a few seconds for the indexer to reflect
          this.
        </p>
      )}
    </div>
  );
}
