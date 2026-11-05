export function truncateAddress(address: string, lead = 6, tail = 6): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders a relative timestamp (e.g. "2m ago", "3h ago") for recent dates,
 * falling back to the absolute {@link formatTimestamp} format once the
 * difference exceeds 24 hours. "47 days ago" is less useful than a real date.
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);

  // Future timestamps fall back to the absolute format.
  if (diffSeconds < 0) return formatTimestamp(iso);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return formatTimestamp(iso);
}

export function formatUnixSeconds(seconds: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
