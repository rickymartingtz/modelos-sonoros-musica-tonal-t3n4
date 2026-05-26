// ChordCard — tarjeta para Arpegios y Fórmulas a la fundamental.
// Estructura compacta inspirada en el ModelCard del App de Intervalos.

import { useMemo, useState } from "react";
import { applyIntervals, midiToName, NOTE_ES, clampToSinging } from "../theory/utils";
import ScoreView from "./ScoreView";
import { ActionButton, RootBadge, SelectionChip, TranspositionControls } from "./UI";
import { DotIcon, PlayIcon, ChordIcon, StopIcon, StackIcon } from "./Icons";
import {
  playMelodic,
  playHarmonic,
  playMelodyWithHarmony,
  playNote,
  stopAll,
} from "../audio/AudioEngine";
import { useIsPlaying } from "../hooks/useIsPlaying";

const NOTE_DURATION = 0.6;

export default function ChordCard({ chord, rootMidi, onRootChange, pillarMode = "arpeggio" }) {
  const tonicName = midiToName(rootMidi).replace(/-?\d+$/, "");
  const tonicEs = NOTE_ES[tonicName] || tonicName;
  const isPlaying = useIsPlaying();
  const [focused, setFocused] = useState(false);

  const [inversionIdx, setInversionIdx] = useState(0);
  const [formulaIdx, setFormulaIdx] = useState(0);

  const inversion = chord.arpeggioInversions[inversionIdx];
  const formula = chord.approachFormulas[formulaIdx];

  const chordMidis = useMemo(
    () => applyIntervals(rootMidi, chord.intervals),
    [chord, rootMidi]
  );

  const arpeggioMidis = useMemo(() => {
    if (!inversion) return [];
    return inversion.intervals.map((i) => rootMidi + i);
  }, [inversion, rootMidi]);

  const approachMidis = useMemo(() => {
    if (!formula) return [];
    return applyIntervals(rootMidi, formula.intervals);
  }, [formula, rootMidi]);

  // Botones
  const handleFirstNote = () => {
    const first = pillarMode === "approach" ? approachMidis[0] : arpeggioMidis[0];
    if (first != null) playNote(clampToSinging(first), 3.0);
  };

  const handlePlayArpeggio = () =>
    playMelodic(arpeggioMidis.map((midi) => ({ midi, duration: NOTE_DURATION })));

  const handlePlayChord = () => playHarmonic(chordMidis);

  const handlePlayApproach = () =>
    playMelodic(approachMidis.map((midi) => ({ midi, duration: NOTE_DURATION })));

  // Para approach con armonía: el acorde armónico acompaña cada nota.
  const handlePlayApproachWithChord = () => {
    const notes = approachMidis.map((midi) => ({ midi, duration: NOTE_DURATION }));
    // Acorde sostenido (mismo en todas las notas)
    const chords = approachMidis.map(() => chordMidis);
    playMelodyWithHarmony(notes, chords);
  };

  const transpose = (n) => onRootChange(rootMidi + n);

  const displayMidis = pillarMode === "approach" ? approachMidis : arpeggioMidis;

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
          <span className="text-sm font-bold text-zinc-900">
            {chord.name}
            <span className="ml-1 font-mono text-xs text-zinc-500">{chord.symbol}</span>
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

      {/* Selector de inversión / fórmula (chips) */}
      {pillarMode === "arpeggio" && chord.arpeggioInversions.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {chord.arpeggioInversions.map((inv, i) => (
            <SelectionChip
              key={i}
              active={inversionIdx === i}
              onClick={() => setInversionIdx(i)}
            >
              {inv.label}
            </SelectionChip>
          ))}
        </div>
      ) : null}

      {pillarMode === "approach" ? (
        <div className="flex flex-wrap gap-1">
          {chord.approachFormulas.map((f, i) => (
            <SelectionChip
              key={i}
              active={formulaIdx === i}
              onClick={() => setFormulaIdx(i)}
            >
              {f.label}
            </SelectionChip>
          ))}
        </div>
      ) : null}

      {/* Partitura */}
      <ScoreView midis={displayMidis} tonicName={tonicName} duration="w" focused={focused} />

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        {pillarMode === "arpeggio" ? (
          <>
            <ActionButton onClick={handlePlayArpeggio} title="Tocar el arpegio melódico">
              <PlayIcon className="h-3 w-3" /> Melódico
            </ActionButton>
            <ActionButton onClick={handlePlayChord} title="Tocar el acorde en bloque">
              <ChordIcon className="h-3 w-3" /> Armónico
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton onClick={handlePlayApproach} title="Tocar la fórmula sola">
              <PlayIcon className="h-3 w-3" /> Fórmula
            </ActionButton>
            <ActionButton onClick={handlePlayChord} title="Tocar el acorde en bloque">
              <ChordIcon className="h-3 w-3" /> Armonía
            </ActionButton>
            <ActionButton onClick={handlePlayApproachWithChord} title="Fórmula y armonía en simultáneo">
              <StackIcon className="h-3 w-3" /> Fórmula + armonía
            </ActionButton>
          </>
        )}
        {isPlaying ? (
          <ActionButton onClick={stopAll} title="Detener">
            <StopIcon className="h-3 w-3" /> Detener
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}
