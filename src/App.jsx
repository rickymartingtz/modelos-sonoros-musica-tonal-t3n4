// App.jsx — composición principal de Modelos Sonoros: Música Tonal.

import { useEffect, useState } from "react";
import TopBar from "./components/TopBar";
import ChordCard from "./components/ChordCard";
import ScaleCard from "./components/ScaleCard";
import FormulaCard from "./components/FormulaCard";
import { SelectionChip } from "./components/UI";
import { CHORDS } from "./theory/chords";
import { SCALES, SCALE_FAMILIES } from "./theory/scales";
import {
  getFormulasByMode,
  TONIC_MODES,
} from "./theory/formulas";
import { loadInstrument, unlockAudio } from "./audio/AudioEngine";

export default function App() {
  const [activePillar, setActivePillar] = useState("tonica");
  const [rootMidi, setRootMidi] = useState(60); // C4
  const [level, setLevel] = useState(4);
  const [instrument, setInstrument] = useState("acoustic_grand_piano");
  const [tonicMode, setTonicMode] = useState("major");
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    if (!audioReady) return;
    loadInstrument(instrument).catch((err) => {
      console.warn("No se pudo cargar el instrumento", err);
    });
  }, [instrument, audioReady]);

  const handleUnlock = () => {
    unlockAudio();
    setAudioReady(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20" onClick={handleUnlock}>
      <TopBar
        activePillar={activePillar}
        onPillarChange={setActivePillar}
        rootMidi={rootMidi}
        onRootChange={setRootMidi}
        level={level}
        onLevelChange={setLevel}
        instrument={instrument}
        onInstrumentChange={setInstrument}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {!audioReady ? (
          <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Toca cualquier lugar para activar el audio. El soundfont se descarga la primera vez (≈4&nbsp;MB).
          </div>
        ) : null}

        {activePillar === "tonica" ? (
          <TonicaSection
            rootMidi={rootMidi}
            onRootChange={setRootMidi}
            tonicMode={tonicMode}
            onModeChange={setTonicMode}
          />
        ) : null}

        {activePillar === "fundamental" ? (
          <FundamentalSection rootMidi={rootMidi} onRootChange={setRootMidi} level={level} />
        ) : null}

        {activePillar === "escalas" ? (
          <EscalasSection rootMidi={rootMidi} onRootChange={setRootMidi} level={level} />
        ) : null}

        {activePillar === "arpegios" ? (
          <ArpegiosSection rootMidi={rootMidi} onRootChange={setRootMidi} level={level} />
        ) : null}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-6 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
        Método Aural · Modelos sonoros para música tonal
      </footer>
    </div>
  );
}

// ===== Fórmulas a la tónica =====
function TonicaSection({ rootMidi, onRootChange, tonicMode, onModeChange }) {
  const formulas = getFormulasByMode(tonicMode);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {Object.entries(TONIC_MODES).map(([k, v]) => (
          <SelectionChip key={k} active={tonicMode === k} onClick={() => onModeChange(k)}>
            {v.label}
          </SelectionChip>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {formulas.map((f) => (
          <FormulaCard
            key={f.id}
            formula={f}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
          />
        ))}
      </div>
    </section>
  );
}

// ===== Fórmulas a la fundamental =====
function FundamentalSection({ rootMidi, onRootChange, level }) {
  const chords = CHORDS.filter((c) => c.level <= level);
  return (
    <section>
      <div className="grid gap-3 md:grid-cols-2">
        {chords.map((chord) => (
          <ChordCard
            key={chord.id}
            chord={chord}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
            pillarMode="approach"
          />
        ))}
      </div>
    </section>
  );
}

// ===== Escalas =====
function EscalasSection({ rootMidi, onRootChange, level }) {
  const scales = SCALES.filter((s) => s.level <= level);

  const byFamily = {};
  scales.forEach((s) => {
    if (!byFamily[s.family]) byFamily[s.family] = [];
    byFamily[s.family].push(s);
  });

  const orderedFamilies = [
    "diatonic",
    "majorModes",
    "melodicMinorModes",
    "harmonicMinorModes",
    "pentatonic",
    "hexatonic",
    "octatonic",
    "messiaen",
    "synthetic",
    "worldApprox",
  ];

  return (
    <section>
      {orderedFamilies.map((fam) => {
        const items = byFamily[fam];
        if (!items?.length) return null;
        const family = SCALE_FAMILIES[fam];
        return (
          <div key={fam} className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
                {family.label}
              </h2>
              <span className="text-[10px] text-zinc-400">{items.length}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((scale) => (
                <ScaleCard
                  key={scale.id}
                  scale={scale}
                  rootMidi={rootMidi}
                  onRootChange={onRootChange}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ===== Arpegios =====
function ArpegiosSection({ rootMidi, onRootChange, level }) {
  const chords = CHORDS.filter((c) => c.level <= level);
  return (
    <section>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {chords.map((chord) => (
          <ChordCard
            key={chord.id}
            chord={chord}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
            pillarMode="arpeggio"
          />
        ))}
      </div>
    </section>
  );
}
