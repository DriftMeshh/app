export function LoadingMessage({ label = 'Loading…' }: { label?: string }) {
  return <p className="state-msg">{label}</p>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <p className="state-msg error">Couldn't load this: {message}</p>;
}

export function EmptyMessage({ label }: { label: string }) {
  return <p className="state-msg">{label}</p>;
}
