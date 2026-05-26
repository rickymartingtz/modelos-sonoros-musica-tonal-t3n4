// ScaleCard — tarjeta de escala compacta, estilo App de Intervalos.

import { useMemo, useState } from "react";
import { applyIntervals, midiToName, NOTE_ES, clampToSinging } from "../theory/utils";
import ScoreView from "./ScoreView";
import { ActionButton, RootBadge, SelectionChip, TranspositionControls } from "./UI";
import { DotIcon, PlayIcon, StopIcon } from "./Icons";
import { playMelodic, playNote, stopAll } from "../audio/AudioEngine";
import { useIsPlaying } from "../hooks/useIsPlaying";

const NOTE_DURATION = 0.5;

export default function ScaleCard({ scale, rootMidi, onRootChange }) {
  const tonicName = midiToName(rootMidi).replace(/-?\d+$/, "");
  const tonicEs = NOTE_ES[tonicName] || tonicName;
  const isPlaying = useIsPlaying();
  const [focused, setFocused] = useState(false);

  const [direction, setDirection] = useState("asc");

  const scaleMidis = useMemo(() => {
    const seq = applyIntervals(rootMidi, [...scale.intervals, 12]);
    if (direction === "desc") return [...seq].reverse();
    if (direction === "both") return [...seq, ...[...seq].slice(0, -1).reverse()];
    return seq;
  }, [scale, rootMidi, direction]);

  const handleFirstNote = () => playNote(clampToSinging(rootMidi), 3.0);
  const handlePlay = () =>
    playMelodic(scaleMidis.map((midi) => ({ midi, duration: NOTE_DURATION })));

  const transpose = (n) => onRootChange(rootMidi + n);

  return (
    <div
      className={`model-card flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm transition ${
        focused ? "focused" : "border-zinc-200"
      }`}
      onClick={() => setFocused(true)}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">{scale.name}</span>
          <RootBadge>raíz {tonicEs}</RootBadge>
          <span className="font-mono text-[10px] text-zinc-500">{scale.formula}</span>
        </div>
        <TranspositionControls
          onUp={() => transpose(1)}
          onDown={() => transpose(-1)}
          onOctaveUp={() => transpose(12)}
          onOctaveDown={() => transpose(-12)}
          onReset={() => onRootChange(60)}
        />
      </div>

      {/* Selector de dirección */}
      <div className="flex flex-wrap gap-1">
        <SelectionChip active={direction === "asc"} onClick={() => setDirection("asc")}>
          ↗ Ascendente
        </SelectionChip>
        <SelectionChip active={direction === "desc"} onClick={() => setDirection("desc")}>
          ↘ Descendente
        </SelectionChip>
        <SelectionChip active={direction === "both"} onClick={() => setDirection("both")}>
          ↗↘ Ambas
        </SelectionChip>
      </div>

      {/* Partitura */}
      <ScoreView midis={scaleMidis} tonicName={tonicName} duration="w" focused={focused} />

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        <ActionButton onClick={handlePlay} title="Tocar la escala">
          <PlayIcon className="h-3 w-3" /> Melódico
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
