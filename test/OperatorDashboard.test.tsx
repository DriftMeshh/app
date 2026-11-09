import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { OperatorDashboard } from '../src/components/OperatorDashboard';
import { WalletButton } from '../src/components/WalletButton';
import { connectWallet } from '../src/wallet/kit';
import { api } from '../src/api/client';
import type { Device, Claim } from '../src/api/types';
import { renderWithProviders as render } from './testUtils';

vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  fetchCurrentAddress: vi.fn().mockResolvedValue(null),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));
vi.mock('../src/api/client', () => ({
  api: { listDevices: vi.fn(), getClaims: vi.fn() },
}));

const OWNER = 'GOWNER1';

function device(overrides: Partial<Device> = {}): Device {
  return {
    address: 'GDEVICE1',
    owner: OWNER,
    device_type: 'weather',
    lat: 0,
    lon: 0,
    registered_at: 1_800_000_000,
    active: 1,
    ...overrides,
  };
}

function claim(payout: string): Claim {
  return {
    id: 1,
    device_address: 'GDEVICE1',
    epoch: 1,
    payout,
    ledger: 100,
    closed_at: '2026-01-01T00:00:00Z',
    tx_hash: 'TX1',
  };
}

async function connectAs(addr: string) {
  vi.mocked(connectWallet).mockResolvedValue(addr);
  fireEvent.click(screen.getByText('Connect wallet'));
  await waitFor(() => expect(screen.getByText(new RegExp(`${addr.slice(0, 4)}.*✓`))).toBeInTheDocument());
}

beforeEach(() => {
  vi.mocked(connectWallet).mockReset();
  vi.mocked(api.listDevices).mockReset();
  vi.mocked(api.getClaims).mockReset();
});

describe('OperatorDashboard', () => {
  it('prompts to connect a wallet when none is connected', () => {
    render(<OperatorDashboard onSelectDevice={() => {}} />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it('shows an empty-state message when the wallet owns no devices', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([device({ owner: 'GSOMEONE_ELSE' })]);

    render(
      <>
        <WalletButton />
        <OperatorDashboard onSelectDevice={() => {}} />
      </>,
    );
    await connectAs(OWNER);

    expect(
      await screen.findByText(/no devices are registered with this wallet/i),
    ).toBeInTheDocument();
  });

  it('filters to only the connected wallet\'s devices and shows aggregated stats', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([
      device({ address: 'GDEVICE1', owner: OWNER, active: 1 }),
      device({ address: 'GDEVICE2', owner: OWNER, active: 0 }),
      device({ address: 'GDEVICE3', owner: 'GSOMEONE_ELSE' }),
    ]);
    vi.mocked(api.getClaims).mockImplementation(async (address: string) =>
      address === 'GDEVICE1' ? [claim('6000000000')] : [claim('4000000000')],
    );

    render(
      <>
        <WalletButton />
        <OperatorDashboard onSelectDevice={() => {}} />
      </>,
    );
    await connectAs(OWNER);

    expect(await screen.findByText('2')).toBeInTheDocument(); // devices owned
    expect(screen.getByText('1')).toBeInTheDocument(); // active
    expect(screen.getByText('1000 DMU')).toBeInTheDocument(); // total claimed
    expect(screen.getByText(/claimed across 2 epochs/i)).toBeInTheDocument();
    expect(api.getClaims).not.toHaveBeenCalledWith('GDEVICE3');
  });

  it('calls onSelectDevice when a device row is clicked', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([device({ address: 'GDEVICE1', owner: OWNER })]);
    vi.mocked(api.getClaims).mockResolvedValue([]);
    const onSelectDevice = vi.fn();

    render(
      <>
        <WalletButton />
        <OperatorDashboard onSelectDevice={onSelectDevice} />
      </>,
    );
    await connectAs(OWNER);

    const row = await screen.findByText(/GDEVICE1/i);
    fireEvent.click(row);
    expect(onSelectDevice).toHaveBeenCalledWith('GDEVICE1');
  });
});
