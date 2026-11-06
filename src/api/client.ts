import type { Claim, Device, Reading, RegionAverage, SubscriptionStatus } from './types';

// Vite's dev proxy forwards /api/* to the indexer (see vite.config.ts),
// so this base path works in dev without CORS; a production build would
// set this to the indexer's real public URL.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

// The indexer always wraps GET /devices and GET /devices/:address/readings
// in this envelope (see indexer/src/db/repository.ts PaginatedResult) — even
// without a limit param, since it applies its own default limit.
interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listDevices: async (options?: { limit?: number; offset?: number }): Promise<Device[]> => {
    const params = new URLSearchParams();
    if (options?.limit !== undefined) params.set('limit', String(options.limit));
    if (options?.offset !== undefined) params.set('offset', String(options.offset));
    const qs = params.toString();
    const result = await get<PaginatedResult<Device>>(`/devices${qs ? `?${qs}` : ''}`);
    return result.data;
  },
  getDevice: (address: string) => get<Device>(`/devices/${address}`),
  getReadings: async (address: string, limit = 50, offset = 0): Promise<Reading[]> => {
    const result = await get<PaginatedResult<Reading>>(
      `/devices/${address}/readings?limit=${limit}&offset=${offset}`,
    );
    return result.data;
  },
  getClaims: (address: string) => get<Claim[]>(`/devices/${address}/claims`),
  getRegionAverage: (regionCode: number, epoch: number) =>
    get<RegionAverage>(`/regions/${regionCode}/average?epoch=${epoch}`),
  getSubscription: (address: string) => get<SubscriptionStatus>(`/subscriptions/${address}`),
};
