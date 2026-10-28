import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceList } from '../src/components/DeviceList';
import { api } from '../src/api/client';
import type { Device } from '../src/api/types';

vi.mock('../src/api/client', () => ({
  api: { listDevices: vi.fn() },
}));

const mockDevice: Device = {
  address: 'GCP747BSVGJ523PFRMTFW2DLWHHVFVALX3JNJL77TQZMEHV75IC7HTRT',
  owner: 'GOWNER',
  device_type: 'weather',
  lat: 404500,
  lon: -736900,
  registered_at: 1_800_000_000,
  active: 1,
};

beforeEach(() => {
  vi.mocked(api.listDevices).mockReset();
});

describe('DeviceList', () => {
  it('shows a loading state, then renders devices', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([mockDevice]);
    render(<DeviceList onSelect={() => {}} />);

    expect(screen.getByText(/fetching devices/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no devices', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([]);
    render(<DeviceList onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByText(/no devices indexed yet/i)).toBeInTheDocument());
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(api.listDevices).mockRejectedValue(new Error('network down'));
    render(<DeviceList onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
  });

  it('calls onSelect with the device address when a card is clicked', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([mockDevice]);
    const onSelect = vi.fn();
    render(<DeviceList onSelect={onSelect} />);

    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    fireEvent.click(screen.getByText('weather'));
    expect(onSelect).toHaveBeenCalledWith(mockDevice.address);
  });
});
