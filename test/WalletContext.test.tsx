import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { WalletProvider, useWallet } from '../src/wallet/WalletContext';
import { connectWallet, fetchCurrentAddress } from '../src/wallet/kit';

vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  fetchCurrentAddress: vi.fn(),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));

function AddressProbe() {
  const { address, connect } = useWallet();
  return (
    <div>
      <span data-testid="address">{address ?? 'none'}</span>
      <button onClick={connect}>connect</button>
    </div>
  );
}

beforeEach(() => {
  vi.mocked(connectWallet).mockReset();
  vi.mocked(fetchCurrentAddress).mockReset().mockResolvedValue(null);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function connectAs(addr: string) {
  vi.mocked(connectWallet).mockResolvedValue(addr);
  await act(async () => {
    screen.getByText('connect').click();
  });
  await vi.waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent(addr));
}

describe('WalletContext — account switch detection', () => {
  it('updates the address once the extension reports a different one', async () => {
    render(
      <WalletProvider>
        <AddressProbe />
      </WalletProvider>,
    );
    await connectAs('GFIRST');

    vi.mocked(fetchCurrentAddress).mockResolvedValue('GSECOND');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(screen.getByTestId('address')).toHaveTextContent('GSECOND');
  });

  it('clears the address if the extension reports none (disconnected externally)', async () => {
    render(
      <WalletProvider>
        <AddressProbe />
      </WalletProvider>,
    );
    await connectAs('GFIRST');

    vi.mocked(fetchCurrentAddress).mockResolvedValue(null);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(screen.getByTestId('address')).toHaveTextContent('none');
  });

  it('does not poll at all before a wallet is connected', async () => {
    render(
      <WalletProvider>
        <AddressProbe />
      </WalletProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(fetchCurrentAddress).not.toHaveBeenCalled();
  });

  it('leaves the address unchanged when the extension still reports the same one', async () => {
    render(
      <WalletProvider>
        <AddressProbe />
      </WalletProvider>,
    );
    await connectAs('GFIRST');

    vi.mocked(fetchCurrentAddress).mockResolvedValue('GFIRST');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(screen.getByTestId('address')).toHaveTextContent('GFIRST');
  });
});
