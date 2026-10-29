import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ReadingsChart } from '../src/components/ReadingsChart';
import type { Reading } from '../src/api/types';

function reading(overrides: Partial<Reading>): Reading {
  return {
    id: 1,
    device_address: 'GDEVICE',
    device_type: 'weather',
    region_code: 1,
    epoch: 1,
    value: 2000,
    accepted: 1,
    ledger: 100,
    closed_at: '2026-01-01T00:00:00Z',
    tx_hash: 'TX',
    ...overrides,
  };
}

describe('ReadingsChart', () => {
  it('renders nothing with fewer than two readings', () => {
    const { container } = render(<ReadingsChart readings={[reading({ id: 1 })]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing with zero readings', () => {
    const { container } = render(<ReadingsChart readings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('plots one point per reading, flagging rejected readings separately', () => {
    const readings = [
      reading({ id: 1, value: 2000, accepted: 1 }),
      reading({ id: 2, value: 2500, accepted: 1 }),
      reading({ id: 3, value: 9999, accepted: 0 }),
    ];
    const { container } = render(<ReadingsChart readings={readings} />);

    expect(container.querySelectorAll('.chart-point')).toHaveLength(2);
    expect(container.querySelectorAll('.chart-point-rejected')).toHaveLength(1);
  });

  it('shows the min/max range of the plotted readings', () => {
    const readings = [
      reading({ id: 1, value: 1800 }),
      reading({ id: 2, value: 2200 }),
    ];
    const { getByText } = render(<ReadingsChart readings={readings} />);
    expect(getByText('1800')).toBeInTheDocument();
    expect(getByText('2200')).toBeInTheDocument();
  });
});
