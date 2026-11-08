import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { connectWallet, disconnectWallet, fetchCurrentAddress } from './kit';

// Conservative — this only needs to catch a manual account switch inside the
// wallet extension, not be a real-time feed.
const ADDRESS_POLL_INTERVAL_MS = 5_000;

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
    void disconnectWallet();
  }, []);

  // Catches the user switching accounts inside their wallet extension while
  // already connected — without this, the UI would keep showing the old
  // address until a manual disconnect/reconnect. Not event-driven: the kit
  // has no push notification for this, only a direct re-query.
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(async () => {
      const current = await fetchCurrentAddress();
      setAddress((prev) => {
        if (current === null) return null; // disconnected from inside the extension
        return current !== prev ? current : prev;
      });
    }, ADDRESS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [address]);

  return (
    <WalletContext.Provider value={{ address, connecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
