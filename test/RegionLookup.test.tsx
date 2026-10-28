import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegionLookup } from '../src/components/RegionLookup';
import { api } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  api: { getRegionAverage: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.getRegionAverage).mockReset();
});

describe('RegionLookup', () => {
  it('submits the form and renders the returned average', async () => {
    vi.mocked(api.getRegionAverage).mockResolvedValue({ regionCode: 42, epoch: 7, average: 2535 });
    render(<RegionLookup />);

    fireEvent.change(screen.getByLabelText(/region code/i), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText(/epoch/i), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => expect(screen.getByText('2535')).toBeInTheDocument());
    expect(api.getRegionAverage).toHaveBeenCalledWith(42, 7);
  });

  it('shows an error message when the lookup fails', async () => {
    vi.mocked(api.getRegionAverage).mockRejectedValue(new Error('epoch must be a number'));
    render(<RegionLookup />);

    fireEvent.change(screen.getByLabelText(/region code/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/epoch/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() =>
      expect(screen.getByText(/epoch must be a number/i)).toBeInTheDocument(),
    );
  });

  it('renders an em dash when the region has no accepted readings yet', async () => {
    vi.mocked(api.getRegionAverage).mockResolvedValue({ regionCode: 99, epoch: 1, average: null });
    render(<RegionLookup />);

    fireEvent.change(screen.getByLabelText(/region code/i), { target: { value: '99' } });
    fireEvent.change(screen.getByLabelText(/epoch/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  });
});
