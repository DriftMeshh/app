import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConnectivityBanner } from '../src/components/ConnectivityBanner';
import { api } from '../src/api/client';

vi.mock('../src/api/client', () => ({ api: { checkHealth: vi.fn() } }));

beforeEach(() => {
  vi.mocked(api.checkHealth).mockReset();
});

describe('ConnectivityBanner', () => {
  it('renders nothing while the backend is reachable', async () => {
    vi.mocked(api.checkHealth).mockResolvedValue(true);
    const { container } = render(<ConnectivityBanner />);
    await waitFor(() => expect(api.checkHealth).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a banner when the backend is unreachable', async () => {
    vi.mocked(api.checkHealth).mockResolvedValue(false);
    render(<ConnectivityBanner />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the driftmesh backend/i);
  });

  it('rechecks and clears the banner when Retry succeeds', async () => {
    vi.mocked(api.checkHealth).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<ConnectivityBanner />);

    const banner = await screen.findByRole('alert');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => expect(banner).not.toBeInTheDocument());
    expect(api.checkHealth).toHaveBeenCalledTimes(2);
  });
});
