type IconProps = {
  className?: string;
};

export function EggIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 58" fill="none" aria-hidden="true">
      <path d="M24 3C14 3 5 25 5 36c0 11 8.5 19 19 19s19-8 19-19C43 25 34 3 24 3Z" stroke="currentColor" strokeWidth="3.5" />
      <path d="M13 37c.8 5.2 4.3 9 9.2 10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m12 2.5 1.25 2.25 2.55-.1.7 2.45 2.25 1.25-1.25 2.25 1.25 2.25-2.25 1.25-.7 2.45-2.55-.1L12 18.7l-1.25-2.25-2.55.1-.7-2.45-2.25-1.25L6.5 10.6 5.25 8.35 7.5 7.1l.7-2.45 2.55.1L12 2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 5 5-2 8 3 5-2v15l-5 2-8-3-5 2V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 3v15m8-12v15" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
