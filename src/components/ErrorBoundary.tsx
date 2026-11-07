import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown in the fallback heading, e.g. "the device list" — defaults to "this page". */
  label?: string;
  /** Overrides the default card fallback — e.g. for a small widget where a full-page card would look broken. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render error in its subtree and shows a fallback instead of
 * letting React unmount the whole tree above it. A real crash reached
 * production once with no boundary anywhere — a stale backend response
 * shape threw during Landing's render and blanked the entire page with
 * no visible error at all.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div className="glass error-boundary">
          <p className="error-boundary-title">
            Something went wrong{this.props.label ? ` loading ${this.props.label}` : ''}.
          </p>
          <p className="state-msg error-boundary-message">{this.state.error.message}</p>
          <button
            className="glass-button glass-button-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
