import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'driftmesh-theme';

function getStoredTheme(): Theme | null {
  try {
    // `window.localStorage`, not the bare global — Node 22+'s own
    // experimental localStorage global (unconfigured without a CLI flag,
    // and throwing on every call) can otherwise shadow jsdom's actual
    // implementation depending on the Node version running the test suite.
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

/** index.css's `:root[data-theme]` selectors do the actual theming — this
 * just sets/clears that attribute. No attribute means "follow the OS
 * preference", which is what a first-time visitor gets. */
function applyTheme(theme: Theme | null) {
  if (theme) {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

/** Dark/light toggle, persisted in localStorage. Defaults to the OS
 * preference until the user picks explicitly, after which that choice
 * sticks (it no longer tracks OS preference changes). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  // Apply whatever was actually stored (or nothing) on mount, rather than
  // the resolved `theme` state above — an unset preference should leave the
  // attribute unset too, so the CSS media query keeps tracking the OS.
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private window, blocked site data) — the
      // toggle still works for this page load via the DOM attribute below.
    }
    applyTheme(next);
  }

  return (
    <button
      type="button"
      className="glass-button theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
