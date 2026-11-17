export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={"courvix-logo " + className} aria-label="Courvix">
      <svg viewBox="0 0 678 678" aria-hidden="true">
        <circle
          cx="339"
          cy="339"
          r="320"
          fill="none"
          stroke="currentColor"
          strokeWidth="38"
        />
        <path
          d="M25 339H653M89 142Q151 220 279 257Q296 339 279 420Q151 456 89 535M589 142Q527 220 399 257Q382 339 399 420Q527 456 589 535"
          fill="none"
          stroke="currentColor"
          strokeWidth="38"
        />
      </svg>
      {!compact && <span>COURVIX</span>}
    </span>
  );
}
