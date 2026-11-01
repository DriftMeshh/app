type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * The DriftMesh mark: a small sensor mesh (nodes + links) inside the
 * app's signature blue-purple-pink badge. Replaces the plain gradient
 * square that stood in for a logo everywhere this renders.
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
      <rect width="30" height="30" rx="10" fill="url(#driftmesh-logo-gradient)" />
      <g stroke="#fff" strokeOpacity="0.75" strokeWidth="1.1" strokeLinecap="round">
        <line x1="9" y1="10.5" x2="15.5" y2="15.5" />
        <line x1="15.5" y1="15.5" x2="22" y2="9.5" />
        <line x1="15.5" y1="15.5" x2="12.5" y2="21.5" />
        <line x1="15.5" y1="15.5" x2="21" y2="20" />
      </g>
      <g fill="#fff">
        <circle cx="9" cy="10.5" r="2.1" fillOpacity="0.95" />
        <circle cx="22" cy="9.5" r="1.7" fillOpacity="0.8" />
        <circle cx="12.5" cy="21.5" r="1.7" fillOpacity="0.8" />
        <circle cx="21" cy="20" r="1.7" fillOpacity="0.8" />
        <circle cx="15.5" cy="15.5" r="2.6" />
      </g>
      <defs>
        <linearGradient
          id="driftmesh-logo-gradient"
          x1="0"
          y1="0"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}
