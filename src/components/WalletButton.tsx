import { useWallet } from '../wallet/WalletContext';
import { truncateAddress } from '../format';

export function WalletButton() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button className="glass-button" onClick={disconnect} title="Disconnect this session">
        {truncateAddress(address, 4, 4)} ✓
      </button>
    );
  }

  return (
    <div className="wallet-button-wrap">
      <button className="glass-button" onClick={connect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect wallet'}
      </button>
      {error && <span className="wallet-error">{error}</span>}
    </div>
  );
}
