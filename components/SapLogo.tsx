// SAP SE official logo: white "SAP" wordmark on the corporate blue (#0070F2) rounded rectangle.
export function SapLogo({ size = 32 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 1.6);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAP"
      role="img"
    >
      <rect width="80" height="50" rx="6" fill="#0070F2" />
      <text
        x="40"
        y="36"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="bold"
        fontSize="28"
        fill="#ffffff"
        letterSpacing="1"
      >
        SAP
      </text>
    </svg>
  );
}
