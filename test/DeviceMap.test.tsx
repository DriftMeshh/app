import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceMap } from '../src/components/DeviceMap';
import { api } from '../src/api/client';
import type { Device } from '../src/api/types';

vi.mock('../src/api/client', () => ({
  api: { listDevices: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.listDevices).mockReset();
});

const located: Device = {
  address: 'GLOCATED',
  owner: null,
  device_type: 'weather',
  lat: 404500,
  lon: -736900,
  registered_at: 1,
  active: 1,
};

const unlocated: Device = {
  address: 'GUNLOCATED',
  owner: null,
  device_type: 'air_quality',
  lat: null,
  lon: null,
  registered_at: 2,
  active: 1,
};

describe('DeviceMap', () => {
  it('shows an empty state when no device has a known location', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([unlocated]);
    render(<DeviceMap onSelect={() => {}} />);
    await waitFor(() =>
      expect(screen.getByText(/no devices with known locations/i)).toBeInTheDocument(),
    );
  });

  it('plots only devices with a known location, and notes how many were skipped', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located, unlocated]);
    const { container } = render(<DeviceMap onSelect={() => {}} />);

    await waitFor(() => expect(container.querySelectorAll('.map-pin')).toHaveLength(1));
    expect(screen.getByText(/1 device without a known location/i)).toBeInTheDocument();
  });

  it('calls onSelect with the device address when a pin is clicked', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located]);
    const onSelect = vi.fn();
    const { container } = render(<DeviceMap onSelect={onSelect} />);

    await waitFor(() => expect(container.querySelector('.map-pin')).not.toBeNull());
    fireEvent.click(container.querySelector('.map-pin')!);
    expect(onSelect).toHaveBeenCalledWith('GLOCATED');
  });

  it('shows a tooltip with device details on hover', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located]);
    const { container } = render(<DeviceMap onSelect={() => {}} />);

    await waitFor(() => expect(container.querySelector('.map-pin')).not.toBeNull());
    fireEvent.mouseEnter(container.querySelector('.map-pin')!);

    expect(screen.getByText('weather')).toBeInTheDocument();
  });
});
