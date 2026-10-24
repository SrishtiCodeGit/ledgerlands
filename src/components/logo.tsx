// The Ledgerlands mark: an island tile with three rising ledger bars and a flag.
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.07)} viewBox="0 0 64 66" aria-hidden="true">
      <path d="M32 37 L58 50 L32 63 L6 50 Z" fill="#0a2219" stroke="#f5c542" strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="15.5" y="40" width="7" height="10" rx="1" fill="#2ee6a6" />
      <rect x="28.5" y="31" width="7" height="19" rx="1" fill="#e9f7f0" />
      <rect x="41.5" y="20" width="7" height="30" rx="1" fill="#f5c542" />
      <path d="M45 20 V8" stroke="#f5c542" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 8 L55 11 L45 14 Z" fill="#f5c542" />
    </svg>
  );
}
