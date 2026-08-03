// SAP SE official logo mark — the trapezoid shape with white "SAP" wordmark.
// Colors: SAP Light Blue #00AEEF (brand mark), white text.
// Shape: left edge vertical, bottom/top horizontal, right edge diagonal (slants upper-right).
// Background is fully transparent.
export function SapLogo({ size = 32 }: { size?: number }) {
  // Maintain the aspect ratio of the actual SAP logo mark (~1.42 : 1)
  const h = size;
  const w = Math.round(size * 1.42);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 142 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAP"
      role="img"
    >
      {/*
        Trapezoid: bottom-left(0,100) → bottom-right(142,100) → top-right(142,28) → top-left(0,0)
        The right side slants: top-right corner is inset so the right edge is diagonal.
        Matches the SAP logo mark shape from the official brand guidelines.
      */}
      <polygon
        points="0,0 118,0 142,100 0,100"
        fill="#00AEEF"
      />
      {/* White SAP wordmark — bold, condensed, centred in the shape */}
      <text
        x="58"
        y="77"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="62"
        fill="#ffffff"
        letterSpacing="-1"
      >
        SAP
      </text>
    </svg>
  );
}
