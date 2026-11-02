type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * The DriftMesh mark: a small sensor mesh (nodes + links) inside the
 * app's signature yellow badge.
 */
export function Logo({ size = 30, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="30" height="30" rx="6" fill="#fcd535" />
      <g stroke="#181a20" strokeOpacity="0.85" strokeWidth="1.1" strokeLinecap="round">
        <line x1="9" y1="10.5" x2="15.5" y2="15.5" />
        <line x1="15.5" y1="15.5" x2="22" y2="9.5" />
        <line x1="15.5" y1="15.5" x2="12.5" y2="21.5" />
        <line x1="15.5" y1="15.5" x2="21" y2="20" />
      </g>
      <g fill="#181a20">
        <circle cx="9" cy="10.5" r="2.1" fillOpacity="0.95" />
        <circle cx="22" cy="9.5" r="1.7" fillOpacity="0.8" />
        <circle cx="12.5" cy="21.5" r="1.7" fillOpacity="0.8" />
        <circle cx="21" cy="20" r="1.7" fillOpacity="0.8" />
        <circle cx="15.5" cy="15.5" r="2.6" />
      </g>
    </svg>
  );
}
