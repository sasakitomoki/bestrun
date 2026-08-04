// SAP Fiori inspired palette — distinct enough to tell users apart.
const PALETTE = [
  "#0070F2", // SAP Blue
  "#E76500", // Orange
  "#D20A0A", // Red
  "#6A1B9A", // Purple
  "#0E7C59", // Teal
  "#C87400", // Amber
  "#1565C0", // Dark Blue
  "#2E7D32", // Green
  "#AD1457", // Pink
  "#00838F", // Cyan
];

// Deterministic color from name so the same user always gets the same color.
function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// Returns a Base64-encoded SVG data URL with the user's initial on a colored circle.
export function generateAvatarDataUrl(name: string): string {
  const initial = [...name][0] ?? "?"; // handle multi-byte chars correctly
  const bg = colorForName(name);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">`,
    `<circle cx="64" cy="64" r="64" fill="${bg}"/>`,
    `<text x="64" y="64" dy="0.35em" text-anchor="middle"`,
    ` font-family="72,Arial,Helvetica,sans-serif"`,
    ` font-weight="bold" font-size="60" fill="#ffffff">${initial}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
