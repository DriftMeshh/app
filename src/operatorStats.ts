import type { Claim, Device } from './api/types';

export interface DeviceWithClaims {
  device: Device;
  claims: Claim[];
}

export interface OperatorStats {
  deviceCount: number;
  activeCount: number;
  claimCount: number;
  /** Sum of every claim's payout, in stroops — a plain bigint since the
   * individual amounts already exceed Number.MAX_SAFE_INTEGER at this
   * project's token decimals, and summing several of them compounds that. */
  totalClaimed: bigint;
}

/**
 * Pure aggregation over an operator's devices and their claims — kept
 * separate from any fetching/rendering so the math has its own test
 * coverage without mocking the fetch chain for every case.
 */
export function aggregateOperatorStats(entries: DeviceWithClaims[]): OperatorStats {
  let activeCount = 0;
  let claimCount = 0;
  let totalClaimed = 0n;

  for (const { device, claims } of entries) {
    if (device.active) activeCount++;
    for (const claim of claims) {
      totalClaimed += BigInt(claim.payout);
      claimCount++;
    }
  }

  return { deviceCount: entries.length, activeCount, claimCount, totalClaimed };
}
