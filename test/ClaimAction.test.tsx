import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ClaimAction } from '../src/components/ClaimAction';
import { WalletButton } from '../src/components/WalletButton';
import { connectWallet } from '../src/wallet/kit';
import { claim } from '../src/wallet/contracts';
import { renderWithProviders as render } from './testUtils';

// Stubbed directly, not vi.importActual — see WalletButton.test.tsx for why.
vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));
vi.mock('../src/wallet/contracts', () => ({ subscribe: vi.fn(), claim: vi.fn() }));

beforeEach(() => {
  vi.mocked(connectWallet).mockReset();
  vi.mocked(claim).mockReset();
});

describe('ClaimAction', () => {
  it('renders nothing when no wallet is connected', () => {
    const { container } = render(<ClaimAction deviceAddress="GDEVICE1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the connected wallet isn't the device being viewed", async () => {
    vi.mocked(connectWallet).mockResolvedValue('GSOMEONE_ELSE');
    const { container } = render(
      <>
        <WalletButton />
        <ClaimAction deviceAddress="GDEVICE1" />
      </>,
    );
    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByText(/GSOM…ELSE ✓/)).toBeInTheDocument());

    expect(screen.queryByText(/claim your payout/i)).not.toBeInTheDocument();
  });

  it('shows the claim form when the connected wallet matches the device, and submits it', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GDEVICE1');
    vi.mocked(claim).mockResolvedValue(75n);

    render(
      <>
        <WalletButton />
        <ClaimAction deviceAddress="GDEVICE1" />
      </>,
    );

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByText(/claim your payout/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/epoch/i), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Claim'));

    await waitFor(() => expect(claim).toHaveBeenCalledWith('GDEVICE1', 7));
    expect(await screen.findByText(/claimed 75/i)).toBeInTheDocument();
  });
});
