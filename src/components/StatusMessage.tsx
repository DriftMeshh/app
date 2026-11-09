export function LoadingMessage({ label = 'Loading…' }: { label?: string }) {
  return <p className="state-msg">{label}</p>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <p className="state-msg error">Couldn't load this: {message}</p>;
}

export function EmptyMessage({ label }: { label: string }) {
  return <p className="state-msg">{label}</p>;
}

/** A handful of key/value row placeholders, matching DeviceDetail's `.row`
 * layout and OperatorDashboard's summary rows — generic enough for any
 * panel that's mostly a short list of labeled values. */
export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton" role="status" aria-label="Loading" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="row" key={i}>
          <span className="skeleton-block skeleton-k" />
          <span className="skeleton-block skeleton-v" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder table rows matching DeviceList's real `<table>` shape —
 * four columns, a handful of rows, so the loading state doesn't visually
 * jump once the real data replaces it. */
export function DeviceTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="device-table-wrap skeleton" role="status" aria-label="Loading" aria-busy="true">
      <table className="device-table">
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td>
                <span className="skeleton-block" style={{ width: '70%' }} />
              </td>
              <td>
                <span className="skeleton-block" style={{ width: '50%' }} />
              </td>
              <td>
                <span className="skeleton-block skeleton-pill" />
              </td>
              <td>
                <span className="skeleton-block" style={{ width: '60%' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
