import { describe, expect, it } from 'vitest';
import { truncateAddress, formatUnixSeconds } from '../src/format';

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
