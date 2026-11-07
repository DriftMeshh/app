import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscribeAction } from '../src/components/SubscribeAction';
import { WalletButton } from '../src/components/WalletButton';
import { connectWallet } from '../src/wallet/kit';
import { subscribe, getSubscriptionPrice } from '../src/wallet/contracts';
import { renderWithProviders as render } from './testUtils';

// Stubbed directly, not vi.importActual — see WalletButton.test.tsx for why.
vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));
vi.mock('../src/wallet/contracts', () => ({
  subscribe: vi.fn(),
  claim: vi.fn(),
  getSubscriptionPrice: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(connectWallet).mockReset();
  vi.mocked(subscribe).mockReset();
  vi.mocked(getSubscriptionPrice).mockReset();
  vi.mocked(getSubscriptionPrice).mockResolvedValue(5_000_000_000n);
});

describe('SubscribeAction', () => {
  it('prompts to connect a wallet when none is connected', () => {
    render(<SubscribeAction />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it('submits a subscribe call once connected, and shows the new expiry', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GCONSUMER');
    vi.mocked(subscribe).mockResolvedValue(1_800_003_600n);

    render(
      <>
        <WalletButton />
        <SubscribeAction />
      </>,
    );

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByLabelText(/periods/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/per period/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/periods/i), { target: { value: '3' } });
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => expect(subscribe).toHaveBeenCalledWith('GCONSUMER', 3));
    expect(await screen.findByText(/subscribed —/i)).toBeInTheDocument();
  });

  it('shows an error if the subscribe transaction fails', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GCONSUMER');
    vi.mocked(subscribe).mockRejectedValue(new Error('insufficient balance'));

    render(
      <>
        <WalletButton />
        <SubscribeAction />
      </>,
    );

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByLabelText(/periods/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/per period/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument());
  });

  it('shows the live per-period price and the total for the chosen number of periods', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GCONSUMER');
    vi.mocked(getSubscriptionPrice).mockResolvedValue(5_000_000_000n); // 500 DMU

    render(
      <>
        <WalletButton />
        <SubscribeAction />
      </>,
    );

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByLabelText(/periods/i)).toBeInTheDocument());

    expect(await screen.findByText(/500 DMU per period — 500 DMU total/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/periods/i), { target: { value: '3' } });
    expect(await screen.findByText(/500 DMU per period — 1500 DMU total/i)).toBeInTheDocument();
  });

  it('disables Subscribe and shows an error if the price fails to load', async () => {
    vi.mocked(connectWallet).mockResolvedValue('GCONSUMER');
    vi.mocked(getSubscriptionPrice).mockRejectedValue(new Error('RPC down'));

    render(
      <>
        <WalletButton />
        <SubscribeAction />
      </>,
    );

    fireEvent.click(screen.getByText('Connect wallet'));
    await waitFor(() => expect(screen.getByLabelText(/periods/i)).toBeInTheDocument());

    expect(await screen.findByText(/couldn't load the current price/i)).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeDisabled();
  });
});
