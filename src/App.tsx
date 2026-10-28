import { useState } from 'react';
import './App.css';
import { DeviceList } from './components/DeviceList';
import { DeviceDetail } from './components/DeviceDetail';
import { RegionLookup } from './components/RegionLookup';
import { SubscriptionCheck } from './components/SubscriptionCheck';

type Tab = 'devices' | 'region' | 'subscription';

function App() {
  const [tab, setTab] = useState<Tab>('devices');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  function selectTab(next: Tab) {
    setTab(next);
    setSelectedDevice(null);
  }

  return (
    <div className="shell">
      <div className="backdrop">
        <span className="blob-3" />
        <span className="blob-4" />
      </div>

      <header className="glass topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          DriftMesh
        </div>
        <nav className="glass nav-tabs">
          <button
            className="glass-button"
            aria-pressed={tab === 'devices'}
            onClick={() => selectTab('devices')}
          >
            Devices
          </button>
          <button
            className="glass-button"
            aria-pressed={tab === 'region'}
            onClick={() => selectTab('region')}
          >
            Region lookup
          </button>
          <button
            className="glass-button"
            aria-pressed={tab === 'subscription'}
            onClick={() => selectTab('subscription')}
          >
            Subscription
          </button>
        </nav>
      </header>

      <main className="page">
        {tab === 'devices' &&
          (selectedDevice ? (
            <DeviceDetail address={selectedDevice} onBack={() => setSelectedDevice(null)} />
          ) : (
            <DeviceList onSelect={setSelectedDevice} />
          ))}
        {tab === 'region' && <RegionLookup />}
        {tab === 'subscription' && <SubscriptionCheck />}
      </main>

      <footer className="note">
        DriftMesh · a DePIN sensor network on Stellar. Data served live by{' '}
        <code>indexer</code>.
      </footer>
    </div>
  );
}

export default App;
