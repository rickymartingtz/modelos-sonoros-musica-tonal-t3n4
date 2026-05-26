// TopBar — encabezado con marca, pestañas de pilares y filtros globales.

import { NOTE_ES, NOTE_NAMES_SHARP, midiToName } from "../theory/utils";

const PILLARS = [
  { id: "tonica", label: "Fórmulas a la tónica" },
  { id: "fundamental", label: "Fórmulas a la fundamental" },
  { id: "escalas", label: "Escalas" },
  { id: "arpegios", label: "Arpegios" },
];

const INSTRUMENTS = [
  { id: "acoustic_grand_piano", label: "Piano de cola" },
  { id: "electric_piano_1", label: "Piano eléctrico" },
  { id: "string_ensemble_1", label: "Cuerdas" },
  { id: "choir_aahs", label: "Coro" },
  { id: "flute", label: "Flauta" },
  { id: "violin", label: "Violín" },
];

export default function TopBar({
  activePillar,
  onPillarChange,
  rootMidi,
  onRootChange,
  level,
  onLevelChange,
  instrument,
  onInstrumentChange,
}) {
  const rootName = midiToName(rootMidi).replace(/-?\d+$/, "");

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Método Aural"
              className="h-9 w-9 rounded-lg border border-zinc-200"
            />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Método Aural · Modelos sonoros
              </p>
              <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
                Música tonal
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                Tónica
              </span>
              <select
                value={rootName}
                onChange={(e) => {
                  const idx = NOTE_NAMES_SHARP.indexOf(e.target.value);
                  if (idx >= 0) onRootChange(60 + idx);
                }}
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs"
              >
                {NOTE_NAMES_SHARP.map((n) => (
                  <option key={n} value={n}>
                    {NOTE_ES[n] || n}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                Nivel
              </span>
              <select
                value={level}
                onChange={(e) => onLevelChange(parseInt(e.target.value, 10))}
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Hasta {romanize(n)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                Sonido
              </span>
              <select
                value={instrument}
                onChange={(e) => onInstrumentChange(e.target.value)}
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <nav className="mt-3 flex flex-wrap gap-1.5">
          {PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPillarChange(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activePillar === p.id
                  ? "aural-black-button"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function romanize(n) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] || String(n);
}
