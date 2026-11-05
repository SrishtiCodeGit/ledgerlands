// The Ledgerlands mark, "The Keep": three rising towers that read as a growing chart and a castle wall.
// Dark green in Daylight, gold in Midnight (the --logo token in globals.css).
export const KEEP_PATH = "M14 86 V52 H22 V60 H30 V52 H38 V34 H46 V42 H54 V34 H62 V14 H70 V22 H78 V14 H86 V86 Z";

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="14 14 72 72" aria-hidden="true">
      <path d={KEEP_PATH} fill="var(--logo)" />
    </svg>
  );
}
