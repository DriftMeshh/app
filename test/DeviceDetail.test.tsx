import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
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
  fetchCurrentAddress: vi.fn().mockResolvedValue(null),
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

  describe('readings pagination', () => {
    function reading(id: number) {
      return {
        id,
        device_address: 'GDEVICE1',
        device_type: 'weather',
        region_code: 1,
        epoch: id,
        value: 2500,
        accepted: 1,
        ledger: 100 + id,
        closed_at: '2026-01-01T00:00:00Z',
        tx_hash: `TX${id}`,
      };
    }

    beforeEach(() => {
      vi.mocked(getRejectedStatus).mockResolvedValue({ rejectedCount: 0, threshold: 0 });
    });

    it('shows no Load more button when the first page is already partial', async () => {
      vi.mocked(api.getReadings).mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => reading(i)),
      );

      render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

      await waitFor(() => expect(screen.getByText(/epoch 0 · region/)).toBeInTheDocument());
      expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    });

    it('shows Load more when the first page is full, and appends the next page on click', async () => {
      const firstPage = Array.from({ length: 20 }, (_, i) => reading(i));
      const secondPage = Array.from({ length: 5 }, (_, i) => reading(20 + i));
      vi.mocked(api.getReadings).mockImplementation(async (_address, _limit, offset = 0) =>
        offset === 0 ? firstPage : secondPage,
      );

      render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);

      await waitFor(() => expect(screen.getByText('Load more')).toBeInTheDocument());
      expect(screen.queryByText(/epoch 20 · region/)).not.toBeInTheDocument();

      screen.getByText('Load more').click();

      await waitFor(() => expect(screen.getByText(/epoch 20 · region/)).toBeInTheDocument());
      expect(api.getReadings).toHaveBeenCalledWith('GDEVICE1', 20, 20);
      // The second page was partial (5 < 20), so there's nothing further to load.
      expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    });

    it('resets accumulated pages on a manual refresh', async () => {
      const firstPage = Array.from({ length: 20 }, (_, i) => reading(i));
      const secondPage = Array.from({ length: 20 }, (_, i) => reading(20 + i));
      vi.mocked(api.getReadings).mockImplementation(async (_address, _limit, offset = 0) =>
        offset === 0 ? firstPage : secondPage,
      );

      render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);
      await waitFor(() => expect(screen.getByText('Load more')).toBeInTheDocument());

      screen.getByText('Load more').click();
      await waitFor(() => expect(screen.getByText(/epoch 20 · region/)).toBeInTheDocument());

      screen.getByLabelText(/refresh device details/i).click();
      await waitFor(() => expect(screen.queryByText(/epoch 20 · region/)).not.toBeInTheDocument());
      expect(screen.getByText('Load more')).toBeInTheDocument();
    });
  });

  describe('auto-refresh', () => {
    const originalVisibilityState = Object.getOwnPropertyDescriptor(
      document,
      'visibilityState',
    );

    function setVisibility(state: 'visible' | 'hidden') {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
      });
    }

    beforeEach(() => {
      vi.mocked(getRejectedStatus).mockResolvedValue({ rejectedCount: 0, threshold: 0 });
      setVisibility('visible');
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      if (originalVisibilityState) {
        Object.defineProperty(document, 'visibilityState', originalVisibilityState);
      }
    });

    it('refetches after the poll interval while the tab is visible', async () => {
      render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);
      // Wait for the initial fetch to actually resolve (not just be called) —
      // isRefreshingRef only flips to false once status reaches 'success'.
      await vi.waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
      expect(api.getDevice).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(12_000);
      });

      expect(api.getDevice).toHaveBeenCalledTimes(2);
    });

    it('does not refetch while the tab is hidden', async () => {
      render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);
      await vi.waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
      expect(api.getDevice).toHaveBeenCalledTimes(1);

      setVisibility('hidden');
      await act(async () => { await vi.advanceTimersByTimeAsync(12_000); });

      expect(api.getDevice).toHaveBeenCalledTimes(1);
    });

    it('stops polling once the component unmounts', async () => {
      const { unmount } = render(<DeviceDetail address="GDEVICE1" onBack={() => {}} />);
      await vi.waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
      expect(api.getDevice).toHaveBeenCalledTimes(1);

      unmount();
      await act(async () => { await vi.advanceTimersByTimeAsync(24_000); });

      expect(api.getDevice).toHaveBeenCalledTimes(1);
    });
  });
});
