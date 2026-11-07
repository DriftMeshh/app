import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

function Bomb(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all fine')).toBeInTheDocument();
  });

  it('catches a render error and shows the fallback instead of crashing the tree', () => {
    // React logs the error to console.error during the throw — expected, suppress the noise.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary label="the test section">
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong loading the test section/i)).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('a crash in one boundary does not affect a sibling tree', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <>
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>
        <ErrorBoundary>
          <p>still here</p>
        </ErrorBoundary>
      </>,
    );

    expect(screen.getByText('still here')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('renders a custom fallback when given one, instead of the default card', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary fallback={null}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Reload')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('reloads the page when Reload is clicked', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Reload'));
    expect(reload).toHaveBeenCalled();

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    consoleError.mockRestore();
  });
});
