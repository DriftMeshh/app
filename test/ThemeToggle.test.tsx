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

beforeEach(() => {
  localStorage.clear();
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
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to dark theme/i);

    fireEvent.click(screen.getByRole('button'));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('applies a previously-stored preference on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to dark theme/i);
  });
});
