// FormulaCard — tarjeta de fórmula a la tónica.
// Estructura compacta inspirada en el ModelCard del App de Intervalos.

import { useMemo, useState } from "react";
import { applyIntervals, midiToName, NOTE_ES, clampToSinging } from "../theory/utils";
import ScoreView from "./ScoreView";
import { ActionButton, RootBadge, TranspositionControls } from "./UI";
import { DotIcon, PlayIcon, ChordIcon, StopIcon, StackIcon } from "./Icons";
import {
  playMelodic,
  playHarmonyOnly,
  playMelodyWithHarmony,
  playNote,
  stopAll,
} from "../audio/AudioEngine";
import { useIsPlaying } from "../hooks/useIsPlaying";

// Duraciones por nota: todas redondas, ~1.4s. Para fórmulas largas, las
// notas intermedias podrían ser un poco más cortas; pero como el PDF muestra
// redondas con ligaduras (slurs), usamos redondas uniformes.
const NOTE_DURATION = 1.4;

export default function FormulaCard({ formula, rootMidi, onRootChange }) {
  const tonicName = midiToName(rootMidi).replace(/-?\d+$/, "");
  const tonicEs = NOTE_ES[tonicName] || tonicName;
  const isPlaying = useIsPlaying();
  const [focused, setFocused] = useState(false);

  // Notas absolutas en MIDI
  const melodyMidis = useMemo(
    () => applyIntervals(rootMidi, formula.melody),
    [formula, rootMidi]
  );

  // Acordes absolutos
  const harmonyMidis = useMemo(
    () => formula.harmony.map((chord) => chord.map((semi) => rootMidi + semi)),
    [formula, rootMidi]
  );

  // Para playMelodic: convertir a {midi, duration}
  const melodyNotes = useMemo(
    () => melodyMidis.map((midi) => ({ midi, duration: NOTE_DURATION })),
    [melodyMidis]
  );

  const handleFormula = () => playMelodic(melodyNotes);
  const handleHarmony = () =>
    playHarmonyOnly(
      harmonyMidis,
      harmonyMidis.map(() => NOTE_DURATION)
    );
  const handleBoth = () => playMelodyWithHarmony(melodyNotes, harmonyMidis);
  const handleFirstNote = () => playNote(clampToSinging(melodyMidis[0]), 3.0);

  const transpose = (n) => onRootChange(rootMidi + n);

  return (
    <div
      className={`model-card flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm transition ${
        focused ? "focused" : "border-zinc-200"
      }`}
      onClick={() => setFocused(true)}
    >
      {/* Header: grados + raíz + transposición */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">
            {formula.degrees}
          </span>
          <RootBadge>raíz {tonicEs}</RootBadge>
        </div>
        <TranspositionControls
          onUp={() => transpose(1)}
          onDown={() => transpose(-1)}
          onOctaveUp={() => transpose(12)}
          onOctaveDown={() => transpose(-12)}
          onReset={() => onRootChange(60)}
        />
      </div>

      {/* Partitura */}
      <ScoreView
        midis={melodyMidis}
        tonicName={tonicName}
        duration="w"
        focused={focused}
      />

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        <ActionButton onClick={handleFormula} title="Tocar la fórmula sola">
          <PlayIcon className="h-3 w-3" /> Fórmula
        </ActionButton>
        <ActionButton onClick={handleHarmony} title="Tocar la armonía sola">
          <ChordIcon className="h-3 w-3" /> Armonía
        </ActionButton>
        <ActionButton onClick={handleBoth} title="Fórmula y armonía en simultáneo">
          <StackIcon className="h-3 w-3" /> Fórmula + armonía
        </ActionButton>
        {isPlaying ? (
          <ActionButton onClick={stopAll} title="Detener">
            <StopIcon className="h-3 w-3" /> Detener
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}
