import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceMap } from '../src/components/DeviceMap';
import { api } from '../src/api/client';
import type { Device } from '../src/api/types';

vi.mock('../src/api/client', () => ({
  api: { listDevices: vi.fn() },
}));

// jsdom can't render real map tiles/canvas — react-leaflet and leaflet are
// stubbed so these tests verify *our* component's logic (which devices get
// plotted, onSelect wiring, the unlocated-device count), not Leaflet's own
// rendering, which is the library's responsibility, not ours.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    eventHandlers,
    position,
  }: {
    children: ReactNode;
    eventHandlers?: { click?: () => void };
    position: [number, number];
  }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn() }),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({})),
  },
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
    render(<DeviceMap onSelect={() => {}} />);

    await waitFor(() => expect(screen.getAllByTestId('marker')).toHaveLength(1));
    expect(screen.getByText(/1 device without a known location/i)).toBeInTheDocument();
  });

  it('plots a marker at the device\'s decoded lat/lon', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located]);
    render(<DeviceMap onSelect={() => {}} />);

    const marker = await screen.findByTestId('marker');
    expect(JSON.parse(marker.dataset.position!)).toEqual([40.45, -73.69]);
  });

  it('calls onSelect with the device address when a marker is clicked', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located]);
    const onSelect = vi.fn();
    render(<DeviceMap onSelect={onSelect} />);

    const marker = await screen.findByTestId('marker');
    fireEvent.click(marker);
    expect(onSelect).toHaveBeenCalledWith('GLOCATED');
  });

  it('includes device details in the popup', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([located]);
    render(<DeviceMap onSelect={() => {}} />);

    await waitFor(() => expect(screen.getByText('weather')).toBeInTheDocument());
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
