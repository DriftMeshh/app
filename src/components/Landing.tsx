import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { WalletButton } from './WalletButton';

interface Props {
  onEnter: () => void;
}

const STEPS = [
  {
    title: 'Register',
    body: 'A sensor registers itself on-chain with its own keypair — owner, type, and a coarse location. No central gatekeeper.',
  },
  {
    title: 'Stream',
    body: 'Readings are signed and submitted continuously. A lightweight on-chain check rejects outliers before they count toward payout.',
  },
  {
    title: 'Earn',
    body: "Consumers subscribe to the feed, funding a pool devices claim from — paid per valid reading, not in a delayed batch.",
  },
];

export function Landing({ onEnter }: Props) {
  const devices = useAsync(() => api.listDevices(), []);
  const deviceCount = devices.status === 'success' ? devices.data.length : null;
  const activeCount =
    devices.status === 'success' ? devices.data.filter((d) => d.active).length : null;

  return (
    <div className="landing">
      <div className="backdrop">
        <span className="blob-3" />
        <span className="blob-4" />
      </div>

      <header className="glass topbar landing-topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          DriftMesh
        </div>
        <div className="topbar-right">
          <WalletButton />
          <button className="glass-button" onClick={onEnter}>
            Open dashboard →
          </button>
        </div>
      </header>

      <section className="hero">
        <span className="pill pill-neutral hero-kicker">Live on Stellar testnet</span>
        <h1>
          Real-time sensor data,
          <br />
          paid per reading.
        </h1>
        <p className="hero-sub">
          DriftMesh is a DePIN network of environmental sensors on Stellar. Devices stream
          signed readings and get paid instantly per valid submission — not in a delayed
          batch, because Stellar's sub-cent fees make that actually viable.
        </p>
        <div className="hero-actions">
          <button className="glass-button glass-button-primary" onClick={onEnter}>
            Explore the network
          </button>
          <a
            className="glass-button"
            href="https://github.com/DriftMeshh"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="hero-stats glass">
          <div className="stat">
            <span className="stat-value">{deviceCount ?? '—'}</span>
            <span className="stat-label">devices registered</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">{activeCount ?? '—'}</span>
            <span className="stat-label">currently active</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">Stellar</span>
            <span className="stat-label">Soroban smart contracts</span>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="glass step-card" key={step.title}>
              <span className="step-number">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="note landing-footer">
        DriftMesh · a DePIN sensor network on Stellar · four open contracts, an indexer, a
        device SDK, and this dashboard.
      </footer>
    </div>
  );
}
