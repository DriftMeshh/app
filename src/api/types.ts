// Mirrors indexer/src/db/repository.ts's row shapes — kept as a plain,
// hand-written copy rather than a shared package, since the two repos
// are independently deployable and this is a small, stable surface.

export interface Device {
  address: string;
  owner: string | null;
  device_type: string;
  lat: number | null;
  lon: number | null;
  registered_at: number;
  active: number;
}

export interface Reading {
  id: number;
  device_address: string;
  device_type: string | null;
  region_code: number;
  epoch: number;
  value: number;
  accepted: number;
  ledger: number;
  closed_at: string;
  tx_hash: string;
}

export interface Claim {
  id: number;
  device_address: string;
  epoch: number;
  payout: string;
  ledger: number;
  closed_at: string;
  tx_hash: string;
}

export interface RegionAverage {
  regionCode: number;
  epoch: number;
  average: number | null;
}

export interface SubscriptionStatus {
  subscriber: string;
  active: boolean;
  expiry: number;
  periods_last_purchase?: number;
  updated_at_ledger?: number;
}
