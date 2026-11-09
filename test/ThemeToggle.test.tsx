import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../src/components/ThemeToggle';

const STORAGE_KEY = 'driftmesh-theme';

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? prefersDark : !prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/**
 * A minimal in-memory Storage implementation, stubbed in for both
 * `localStorage` and `window.localStorage`. Needed because jsdom's real
 * one isn't reliably available in every CI environment — on this repo's
 * pinned Node 22, GitHub Actions' runner resolves `window.localStorage` to
 * `undefined` (Node 22+ ships its own experimental, unconfigured
 * localStorage global, which appears to shadow jsdom's depending on build/
 * environment specifics); this passed locally under both Node 22 and 24
 * before failing in CI, which is exactly the gap this stub closes — the
 * test no longer depends on the ambient implementation at all.
 */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
}

beforeEach(() => {
  const storage = createMemoryStorage();
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  delete document.documentElement.dataset.theme;
  mockMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeToggle', () => {
  it('defaults to the OS preference and leaves the DOM attribute unset', () => {
    mockMatchMedia(true); // prefers dark
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to light theme/i);
    // No stored preference yet, so the attribute should stay unset — the
    // CSS media query is what should be driving the actual theme.
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('clicking toggles the theme, sets the DOM attribute, and persists to localStorage', () => {
    mockMatchMedia(true); // starts out as dark
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button'));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to dark theme/i);

    fireEvent.click(screen.getByRole('button'));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('applies a previously-stored preference on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'light');
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to dark theme/i);
  });
});
