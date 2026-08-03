// SAP SE official logo mark.
// Shape: trapezoid — top edge wide, bottom edge narrow, left edge vertical, right edge diagonal.
//   top-left(0,0) ──────────── top-right(155,0)
//       |                              ╲
//       |                           bottom-right(110,100)
//   bottom-left(0,100) ──────────────╯
// Colors: SAP Light Blue #00AEEF, white wordmark. Background fully transparent.
export function SapLogo({ size = 32 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 1.6);
  return (
    <svg
      width={w}
      height={h}
      // viewBox wider than the shape so text never gets clipped
      viewBox="-8 -4 225 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAP"
      role="img"
      style={{ overflow: "visible" }}
    >
      <polygon
        points="0,0 192,0 130,100 0,100"
        fill="#00AEEF"
      />
      {/* White SAP wordmark centred in the shape */}
      <text
        x="78"
        y="78"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="68"
        fill="#ffffff"
      >
        SAP
      </text>
    </svg>
  );
}
