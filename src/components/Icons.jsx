// Iconos SVG inline, replicando el sistema del App de Intervalos.

function IconBase({ children, className = "h-4 w-4", viewBox = "0 0 24 24" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6 4l14 8-14 8V4Z" />
    </IconBase>
  );
}

export function ChordIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h14" />
    </IconBase>
  );
}

export function DotIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3.5" />
    </IconBase>
  );
}

export function StopIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </IconBase>
  );
}

export function ArrowUpIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </IconBase>
  );
}

export function ArrowDownIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </IconBase>
  );
}

export function ResetIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 4v6h6" />
      <path d="M20 9A8 8 0 0 0 6.3 5.7L4 8" />
      <path d="M4 15a8 8 0 0 0 13.7 3.3L20 16" />
    </IconBase>
  );
}

// Combinado: armonía + fórmula (un play sobre tres líneas)
export function StackIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M8 18l8-3-8-3v6Z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
