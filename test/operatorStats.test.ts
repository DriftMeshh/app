import { describe, expect, it } from 'vitest';
import { aggregateOperatorStats, type DeviceWithClaims } from '../src/operatorStats';
import type { Claim, Device } from '../src/api/types';

function device(overrides: Partial<Device> = {}): Device {
  return {
    address: 'GDEVICE',
    owner: 'GOWNER',
    device_type: 'weather',
    lat: 0,
    lon: 0,
    registered_at: 1_800_000_000,
    active: 1,
    ...overrides,
  };
}

function claim(payout: string, overrides: Partial<Claim> = {}): Claim {
  return {
    id: 1,
    device_address: 'GDEVICE',
    epoch: 1,
    payout,
    ledger: 100,
    closed_at: '2026-01-01T00:00:00Z',
    tx_hash: 'TX1',
    ...overrides,
  };
}

describe('aggregateOperatorStats', () => {
  it('returns all zeros for no devices', () => {
    expect(aggregateOperatorStats([])).toEqual({
      deviceCount: 0,
      activeCount: 0,
      claimCount: 0,
      totalClaimed: 0n,
    });
  });

  it('counts devices and active devices separately', () => {
    const entries: DeviceWithClaims[] = [
      { device: device({ active: 1 }), claims: [] },
      { device: device({ active: 0 }), claims: [] },
      { device: device({ active: 1 }), claims: [] },
    ];
    const stats = aggregateOperatorStats(entries);
    expect(stats.deviceCount).toBe(3);
    expect(stats.activeCount).toBe(2);
  });

  it('sums claim payouts across multiple devices as a bigint', () => {
    const entries: DeviceWithClaims[] = [
      { device: device(), claims: [claim('6000000000'), claim('500')] },
      { device: device({ address: 'GDEVICE2' }), claims: [claim('4000000000')] },
    ];
    const stats = aggregateOperatorStats(entries);
    expect(stats.claimCount).toBe(3);
    expect(stats.totalClaimed).toBe(10_000_000_500n);
  });

  it('handles payouts that exceed Number.MAX_SAFE_INTEGER without losing precision', () => {
    const huge = '9007199254740993'; // MAX_SAFE_INTEGER + 2
    const entries: DeviceWithClaims[] = [{ device: device(), claims: [claim(huge), claim(huge)] }];
    const stats = aggregateOperatorStats(entries);
    expect(stats.totalClaimed).toBe(BigInt(huge) * 2n);
  });

  it('devices with no claims contribute zero without affecting the count', () => {
    const entries: DeviceWithClaims[] = [
      { device: device(), claims: [] },
      { device: device({ address: 'GDEVICE2' }), claims: [claim('100')] },
    ];
    const stats = aggregateOperatorStats(entries);
    expect(stats.deviceCount).toBe(2);
    expect(stats.claimCount).toBe(1);
    expect(stats.totalClaimed).toBe(100n);
  });
});
