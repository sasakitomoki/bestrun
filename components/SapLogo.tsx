// SAP SE official logo mark.
// Shape: rectangle with top-right corner diagonally cut off (pentagon).
// Colors: SAP Light Blue #00AEEF, white wordmark. Background fully transparent.
export function SapLogo({ size = 32 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 1.55);
  return (
    <svg
      width={w}
      height={h}
      viewBox="-4 0 158 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAP"
      role="img"
      overflow="visible"
    >
      {/*
        Pentagon: four-sided rectangle with top-right corner cut diagonally.
        (0,0)──(100,0)╲(142,38)
          |               |
        (0,100)────(142,100)
      */}
      <polygon
        points="0,0 100,0 142,38 142,100 0,100"
        fill="#00AEEF"
      />
      {/* White SAP wordmark — centred horizontally in the shape */}
      <text
        x="68"
        y="73"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="52"
        fill="#ffffff"
      >
        SAP
      </text>
    </svg>
  );
}
