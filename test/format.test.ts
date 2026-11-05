import { describe, expect, it, vi, afterEach } from 'vitest';
import { truncateAddress, formatUnixSeconds, formatRelativeTime, formatTimestamp } from '../src/format';

describe('truncateAddress', () => {
  it('shortens a long address with an ellipsis', () => {
    const addr = 'GCP747BSVGJ523PFRMTFW2DLWHHVFVALX3JNJL77TQZMEHV75IC7HTRT';
    expect(truncateAddress(addr, 6, 6)).toBe('GCP747…C7HTRT');
  });

  it('returns a short address unchanged', () => {
    expect(truncateAddress('SHORT', 6, 6)).toBe('SHORT');
  });
});

describe('formatUnixSeconds', () => {
  it('renders a placeholder for zero/unset expiry', () => {
    expect(formatUnixSeconds(0)).toBe('—');
  });

  it('renders a real date for a non-zero timestamp', () => {
    const formatted = formatUnixSeconds(1_800_000_000);
    expect(formatted).not.toBe('—');
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeTime', () => {
  // Fixed "now" so relative assertions are deterministic.
  const NOW = new Date('2026-11-05T12:00:00Z').getTime();

  afterEach(() => {
    vi.useRealTimers();
  });

  function iso(offsetSeconds: number): string {
    return new Date(NOW - offsetSeconds * 1000).toISOString();
  }

  it('returns the raw input for an invalid date string', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date');
  });

  it('renders "just now" for timestamps under a minute old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(iso(0))).toBe('just now');
    expect(formatRelativeTime(iso(30))).toBe('just now');
    expect(formatRelativeTime(iso(59))).toBe('just now');
  });

  it('renders "Nm ago" for timestamps minutes old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(iso(60))).toBe('1m ago');
    expect(formatRelativeTime(iso(120))).toBe('2m ago');
    expect(formatRelativeTime(iso(59 * 60))).toBe('59m ago');
  });

  it('renders "Nh ago" for timestamps hours old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(iso(60 * 60))).toBe('1h ago');
    expect(formatRelativeTime(iso(3 * 60 * 60))).toBe('3h ago');
    expect(formatRelativeTime(iso(23 * 60 * 60))).toBe('23h ago');
  });

  it('falls back to absolute format at the 24h boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const justOver = formatRelativeTime(iso(24 * 60 * 60 + 1));
    const absolute = formatTimestamp(new Date(NOW - (24 * 60 * 60 + 1) * 1000).toISOString());
    expect(justOver).toBe(absolute);
  });

  it('falls back to absolute format for timestamps well beyond 24h', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const formatted = formatRelativeTime(iso(47 * 24 * 60 * 60));
    // Absolute format always contains a comma between day and time.
    expect(formatted).toMatch(/,/);
    expect(formatted).not.toMatch(/ago/);
  });

  it('falls back to absolute format for future timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const futureIso = new Date(NOW + 60_000).toISOString();
    expect(formatRelativeTime(futureIso)).not.toMatch(/ago|just now/);
  });
});
