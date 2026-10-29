import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletButton } from '../src/components/WalletButton';
import { connectWallet } from '../src/wallet/kit';
import { renderWithProviders as render } from './testUtils';

// Stubbed directly (not vi.importActual) so the real module never loads in
// tests — it pulls in the wallet kit's Freighter module, which has a CJS
// dependency that trips up Vitest's Node-based module loader. None of these
// tests need the real implementation since only connectWallet is exercised.
vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(connectWallet).mockReset();
});

describe('WalletButton', () => {
  it('shows "Connect wallet" when disconnected', () => {
    render(<WalletButton />);
    expect(screen.getByText('Connect wallet')).toBeInTheDocument();
  });

  it('shows the truncated address after a successful connect', async () => {
    vi.mocked(connectWallet).mockResolvedValue(
      'GCP747BSVGJ523PFRMTFW2DLWHHVFVALX3JNJL77TQZMEHV75IC7HTRT',
    );
    render(<WalletButton />);

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByText(/GCP7…HTRT ✓/)).toBeInTheDocument());
  });

  it('shows an error message if the connection is rejected', async () => {
    vi.mocked(connectWallet).mockRejectedValue(new Error('User declined access'));
    render(<WalletButton />);

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByText(/user declined access/i)).toBeInTheDocument());
  });

  it('returns to the disconnected state when "Disconnect" is clicked', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GCP747');
    render(<WalletButton />);

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByText(/GCP747 ✓/)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/GCP747 ✓/));
    expect(screen.getByText('Connect wallet')).toBeInTheDocument();
  });
});
