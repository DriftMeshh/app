import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Landing } from '../src/components/Landing';
import { api } from '../src/api/client';
import type { Device } from '../src/api/types';

vi.mock('../src/api/client', () => ({
  api: { listDevices: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.listDevices).mockReset();
});

const devices: Device[] = [
  {
    address: 'GDEVICE1',
    owner: null,
    device_type: 'weather',
    lat: null,
    lon: null,
    registered_at: 1,
    active: 1,
  },
  {
    address: 'GDEVICE2',
    owner: null,
    device_type: 'air_quality',
    lat: null,
    lon: null,
    registered_at: 2,
    active: 0,
  },
];

describe('Landing', () => {
  it('renders the hero and how-it-works content', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([]);
    render(<Landing onEnter={() => {}} />);

    expect(screen.getByText(/real-time sensor data/i)).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Stream')).toBeInTheDocument();
    expect(screen.getByText('Earn')).toBeInTheDocument();
    await waitFor(() => expect(api.listDevices).toHaveBeenCalled());
  });

  it('shows a placeholder stat before devices load, then the real counts', async () => {
    vi.mocked(api.listDevices).mockResolvedValue(devices);
    const { container } = render(<Landing onEnter={() => {}} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    await waitFor(() => {
      const values = Array.from(container.querySelectorAll('.stat-value')).map(
        (el) => el.textContent,
      );
      expect(values).toEqual(['2', '1', 'Stellar']); // total, active, chain label
    });
  });

  it('calls onEnter when a CTA button is clicked', async () => {
    vi.mocked(api.listDevices).mockResolvedValue([]);
    const onEnter = vi.fn();
    render(<Landing onEnter={onEnter} />);
    await waitFor(() => expect(api.listDevices).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/explore the network/i));
    expect(onEnter).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/open dashboard/i));
    expect(onEnter).toHaveBeenCalledTimes(2);
  });
});
