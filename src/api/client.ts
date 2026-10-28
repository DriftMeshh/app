import type { Claim, Device, Reading, RegionAverage, SubscriptionStatus } from './types';

// Vite's dev proxy forwards /api/* to the indexer (see vite.config.ts),
// so this base path works in dev without CORS; a production build would
// set this to the indexer's real public URL.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listDevices: () => get<Device[]>('/devices'),
  getDevice: (address: string) => get<Device>(`/devices/${address}`),
  getReadings: (address: string, limit = 50) =>
    get<Reading[]>(`/devices/${address}/readings?limit=${limit}`),
  getClaims: (address: string) => get<Claim[]>(`/devices/${address}/claims`),
  getRegionAverage: (regionCode: number, epoch: number) =>
    get<RegionAverage>(`/regions/${regionCode}/average?epoch=${epoch}`),
  getSubscription: (address: string) => get<SubscriptionStatus>(`/subscriptions/${address}`),
};
