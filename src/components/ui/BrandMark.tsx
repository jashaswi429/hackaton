/** Abstract QRYX mark: four nodes, a few edges — a tiny system diagram. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="QRYX"
    >
      <path
        d="M11 11 L21 13 M11 11 L14 21 M21 13 L22 21.5 M14 21 L22 21.5"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <circle cx="11" cy="11" r="2.6" fill="var(--accent)" />
      <circle cx="21" cy="13" r="2" fill="currentColor" />
      <circle cx="14" cy="21" r="2" fill="currentColor" />
      <circle cx="22" cy="21.5" r="1.7" fill="var(--accent)" />
    </svg>
  );
}
