import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceList } from '../src/components/DeviceList';
import { api, type DevicesPage } from '../src/api/client';
import type { Device } from '../src/api/types';

vi.mock('../src/api/client', () => ({
  api: { listDevicesPage: vi.fn() },
}));

function page(data: Device[], total = data.length): DevicesPage {
  return { data, total };
}

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
  vi.mocked(api.listDevicesPage).mockReset();
});

describe('DeviceList', () => {
  it('shows a loading state, then renders devices', async () => {
    vi.mocked(api.listDevicesPage).mockResolvedValue(page([mockDevice]));
    render(<DeviceList onSelect={() => {}} />);

    expect(screen.getByText(/fetching devices/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no devices', async () => {
    vi.mocked(api.listDevicesPage).mockResolvedValue(page([]));
    render(<DeviceList onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByText(/no devices indexed yet/i)).toBeInTheDocument());
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(api.listDevicesPage).mockRejectedValue(new Error('network down'));
    render(<DeviceList onSelect={() => {}} />);
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
  });

  it('paginates when there are more devices than one page', async () => {
    const devices: Device[] = Array.from({ length: 25 }, (_, i) => ({
      ...mockDevice,
      address: `GDEVICE${i.toString().padStart(2, '0')}`,
      registered_at: 1_800_000_000 + i,
    }));
    vi.mocked(api.listDevicesPage).mockResolvedValue(page(devices));
    render(<DeviceList onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/previous page/i)).toBeDisabled();
    expect(screen.getByLabelText(/next page/i)).not.toBeDisabled();

    fireEvent.click(screen.getByLabelText(/next page/i));
    await waitFor(() => expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/next page/i));
    await waitFor(() => expect(screen.getByText(/page 3 of 3/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/next page/i)).toBeDisabled();
  });

  it('resets to page 1 when a search narrows the results', async () => {
    const devices: Device[] = Array.from({ length: 25 }, (_, i) => ({
      ...mockDevice,
      address: `GDEVICE${i.toString().padStart(2, '0')}`,
      device_type: i === 0 ? 'air_quality' : 'weather',
      registered_at: 1_800_000_000 + i,
    }));
    vi.mocked(api.listDevicesPage).mockResolvedValue(page(devices));
    render(<DeviceList onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/next page/i));
    await waitFor(() => expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/search devices/i), {
      target: { value: 'air_quality' },
    });
    await waitFor(() => expect(screen.getByText('1 of 25')).toBeInTheDocument());
    expect(screen.queryByText(/page \d of \d/i)).not.toBeInTheDocument();
  });

  it('calls onSelect with the device address when a card is clicked', async () => {
    vi.mocked(api.listDevicesPage).mockResolvedValue(page([mockDevice]));
    const onSelect = vi.fn();
    render(<DeviceList onSelect={onSelect} />);

    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    fireEvent.click(screen.getByText('weather'));
    expect(onSelect).toHaveBeenCalledWith(mockDevice.address);
  });

  it('shows the real server total, flagging when the fetched set is truncated', async () => {
    // Server reports far more devices exist than the 500-device fetch limit
    // returned — this is exactly the case api.listDevices() used to hide.
    vi.mocked(api.listDevicesPage).mockResolvedValue(page([mockDevice], 1200));
    render(<DeviceList onSelect={() => {}} />);

    expect(await screen.findByText(/1 of 1200/)).toBeInTheDocument();
    expect(screen.getByText(/showing first 1/i)).toBeInTheDocument();
  });

  it('does not show a truncation note when the fetched set is the whole total', async () => {
    vi.mocked(api.listDevicesPage).mockResolvedValue(page([mockDevice]));
    render(<DeviceList onSelect={() => {}} />);

    expect(await screen.findByText('1 of 1')).toBeInTheDocument();
    expect(screen.queryByText(/showing first/i)).not.toBeInTheDocument();
  });
});
