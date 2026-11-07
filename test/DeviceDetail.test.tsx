import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DeviceDetail } from '../src/components/DeviceDetail';
import { api } from '../src/api/client';
import { getRejectedStatus } from '../src/wallet/contracts';
import type { Device } from '../src/api/types';
import { renderWithProviders as render } from './testUtils';

vi.mock('../src/api/client', () => ({
  api: {
    getDevice: vi.fn(),
    getReadings: vi.fn(),
    getClaims: vi.fn(),
  },
}));

// ClaimAction (rendered inside DeviceDetail) pulls from wallet/kit + wallet/contracts
// too — stub the whole module rather than importActual, same as ClaimAction.test.tsx.
vi.mock('../src/wallet/kit', () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn(),
}));
vi.mock('../src/wallet/contracts', () => ({
  claim: vi.fn(),
  getRejectedStatus: vi.fn(),
}));

const mockDevice: Device = {
  address: 'GDEVICE1',
  owner: 'GOWNER',
  device_type: 'weather',
  lat: 404500,
  lon: -736900,
  registered_at: 1_800_000_000,
  active: 1,
};

beforeEach(() => {
  vi.mocked(api.getDevice).mockReset().mockResolvedValue(mockDevice);
  vi.mocked(api.getReadings).mockReset().mockResolvedValue([]);
  vi.mocked(api.getClaims).mockReset().mockResolvedValue([]);
  vi.mocked(getRejectedStatus).mockReset();
});

describe('DeviceDetail', () => {
  it('shows the rejected/threshold ratio, flagged as danger once at or past the threshold', async () => {
    vi.mocked(getRejectedStatus).mockResolvedValue({ rejectedCount: 3, threshold: 3 });

    render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

    const value = await screen.findByText('3 / 3');
    expect(value).toHaveClass('pill-danger');
  });

  it('shows a neutral pill when comfortably under the threshold', async () => {
    vi.mocked(getRejectedStatus).mockResolvedValue({ rejectedCount: 1, threshold: 5 });

    render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

    const value = await screen.findByText('1 / 5');
    expect(value).toHaveClass('pill-neutral');
  });

  it('shows the raw count with no ratio when auto-slash is disabled (threshold 0)', async () => {
    vi.mocked(getRejectedStatus).mockResolvedValue({ rejectedCount: 4, threshold: 0 });

    render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

    expect(await screen.findByText(/4 \(auto-slash disabled\)/)).toBeInTheDocument();
  });

  it('omits the rejected-readings row entirely if that read fails', async () => {
    vi.mocked(getRejectedStatus).mockRejectedValue(new Error('RPC down'));

    render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    expect(screen.queryByText(/rejected readings/i)).not.toBeInTheDocument();
  });
});
