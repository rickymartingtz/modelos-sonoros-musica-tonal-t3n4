// UI compartido — estilo del App de Intervalos.

import {
  ArrowUpIcon,
  ArrowDownIcon,
  ResetIcon,
} from "./Icons";

// Botón pildora estándar (acción secundaria, blanco)
export function ActionButton({ children, onClick, disabled, title, active }) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50";
  const cls = active
    ? `${base} aural-active`
    : `${base} border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      title={title}
      className={cls}
    >
      {children}
    </button>
  );
}

// Pill primaria negra (raro: solo para acción principal global)
export function PrimaryButton({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// Chip de selección (para modo, dirección, etc.)
export function SelectionChip({ active, onClick, children, disabled, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "aural-active"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// Badge tipo "raíz Do"
export function RootBadge({ children }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {children}
    </span>
  );
}

// Botones circulares pequeños para transposición
export function CircleButton({ children, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// Botón octava (8↑ / 8↓)
export function OctaveButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={title}
      className="inline-flex h-7 items-center justify-center rounded-full border border-zinc-300 bg-white px-2 text-[10px] font-bold text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

// Grupo de transposición completo
export function TranspositionControls({
  onUp,
  onDown,
  onOctaveUp,
  onOctaveDown,
  onReset,
}) {
  return (
    <div className="flex items-center gap-1">
      <CircleButton onClick={onUp} title="Subir ½ tono">
        <ArrowUpIcon className="h-3.5 w-3.5" />
      </CircleButton>
      <CircleButton onClick={onDown} title="Bajar ½ tono">
        <ArrowDownIcon className="h-3.5 w-3.5" />
      </CircleButton>
      <OctaveButton onClick={onOctaveUp} title="Subir una octava">
        8↑
      </OctaveButton>
      <OctaveButton onClick={onOctaveDown} title="Bajar una octava">
        8↓
      </OctaveButton>
      <CircleButton onClick={onReset} title="Volver al centro">
        <ResetIcon className="h-3.5 w-3.5" />
      </CircleButton>
    </div>
  );
}
