import { useState } from 'react';
import './App.css';
import { Landing } from './components/Landing';
import { DeviceList } from './components/DeviceList';
import { DeviceDetail } from './components/DeviceDetail';
import { DeviceMap } from './components/DeviceMap';
import { Logo } from './components/Logo';
import { RegionLookup } from './components/RegionLookup';
import { SubscriptionCheck } from './components/SubscriptionCheck';
import { WalletButton } from './components/WalletButton';
import { TickerBar } from './components/TickerBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeToggle } from './components/ThemeToggle';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { OperatorDashboard } from './components/OperatorDashboard';

type Tab = 'devices' | 'map' | 'region' | 'subscription' | 'my-devices';
type View = 'landing' | 'app';

function App() {
  const [view, setView] = useState<View>('landing');
  const [tab, setTab] = useState<Tab>('devices');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  function selectTab(next: Tab) {
    setTab(next);
    setSelectedDevice(null);
  }

  if (view === 'landing') {
    return (
      <>
        <ConnectivityBanner />
        <ErrorBoundary label="the landing page">
          <Landing onEnter={() => setView('app')} />
        </ErrorBoundary>
      </>
    );
  }

  return (
    <div className="shell">
      <ConnectivityBanner />
      <div className="backdrop" />

      <header className="glass topbar">
        <div className="topbar-top-row">
          <div
            className="brand brand-clickable"
            onClick={() => setView('landing')}
            role="button"
            tabIndex={0}
            aria-label="Back to landing page"
          >
            <Logo />
            DriftMesh
          </div>
          <ThemeToggle />
          <WalletButton />
        </div>
        <ErrorBoundary fallback={null}>
          <TickerBar />
        </ErrorBoundary>
      </header>

      <div className="body-row">
        <nav className="nav-tabs">
          <button aria-pressed={tab === 'devices'} onClick={() => selectTab('devices')}>
            Devices
          </button>
          <button aria-pressed={tab === 'map'} onClick={() => selectTab('map')}>
            Map
          </button>
          <button aria-pressed={tab === 'region'} onClick={() => selectTab('region')}>
            Region lookup
          </button>
          <button aria-pressed={tab === 'subscription'} onClick={() => selectTab('subscription')}>
            Subscription
          </button>
          <button aria-pressed={tab === 'my-devices'} onClick={() => selectTab('my-devices')}>
            My devices
          </button>
        </nav>

        <main className="page">
          <ErrorBoundary label={`the ${tab} view`} key={tab}>
            {tab === 'devices' &&
              (selectedDevice ? (
                <DeviceDetail address={selectedDevice} onBack={() => setSelectedDevice(null)} />
              ) : (
                <DeviceList onSelect={setSelectedDevice} />
              ))}
            {tab === 'map' && (
              <DeviceMap
                onSelect={(address) => {
                  setTab('devices');
                  setSelectedDevice(address);
                }}
              />
            )}
            {tab === 'region' && <RegionLookup />}
            {tab === 'subscription' && <SubscriptionCheck />}
            {tab === 'my-devices' && (
              <OperatorDashboard
                onSelectDevice={(address) => {
                  setTab('devices');
                  setSelectedDevice(address);
                }}
              />
            )}
          </ErrorBoundary>

          <footer className="note">
            DriftMesh · a DePIN sensor network on Stellar. Data served live by{' '}
            <code>indexer</code>.
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
