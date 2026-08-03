// SAP SE official logo mark.
// Shape: rectangle with top-right corner diagonally cut off.
// Colors: SAP Light Blue #00AEEF, white wordmark.
// Background is fully transparent.
export function SapLogo({ size = 32 }: { size?: number }) {
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
        Pentagon with top-right corner cut diagonally:
        top-left(0,0) → cut-start(100,0) → top-right-cut(142,38) → bottom-right(142,100) → bottom-left(0,100)
      */}
      <polygon
        points="0,0 100,0 142,38 142,100 0,100"
        fill="#00AEEF"
      />
      {/* White SAP wordmark */}
      <text
        x="62"
        y="78"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="64"
        fill="#ffffff"
        letterSpacing="-1"
      >
        SAP
      </text>
    </svg>
  );
}
