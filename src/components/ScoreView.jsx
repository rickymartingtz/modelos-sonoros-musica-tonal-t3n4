// Componente de partitura con VexFlow 4.x.
// Notas como redondas por defecto, estilo compacto similar al de Intervalos.

import { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, Formatter, Accidental, Voice } from "vexflow";
import {
  NOTE_NAMES_SHARP,
  NOTE_NAMES_FLAT,
  preferFlatsFor,
} from "../theory/utils";

function midiToVexNote(midi, preferFlats) {
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  const octave = Math.floor(midi / 12) - 1;
  const raw = names[midi % 12];
  const letter = raw[0].toLowerCase();
  const acc = raw[1] || "";
  return { key: `${letter}${acc}/${octave}`, accidental: acc };
}

export default function ScoreView({
  midis,
  tonicName = "C",
  duration = "w",
  className = "",
  focused = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";
    if (!midis || midis.length === 0) return;

    const flats = preferFlatsFor(tonicName);

    const noteSpacing = 42;
    const clefReserve = 50;
    const finalReserve = 24;
    const startPadding = 16;
    const width = clefReserve + finalReserve + startPadding + midis.length * noteSpacing + 14;
    const h = 96;

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, h);
    const ctx = renderer.getContext();
    ctx.setFont("DM Sans", 10);

    const stave = new Stave(4, 22, width - 10);
    stave.addClef("treble");
    stave.setContext(ctx).draw();

    const accidentalState = new Map();
    const notes = midis.map((m) => {
      const { key, accidental } = midiToVexNote(m, flats);
      const note = new StaveNote({ keys: [key], duration });
      const stateKey = key.split("/")[0].replace(/[#b]/, "") + "/" + key.split("/")[1];
      const previous = accidentalState.get(stateKey) ?? "";
      if (accidental) {
        note.addModifier(new Accidental(accidental));
      } else if (previous) {
        note.addModifier(new Accidental("n"));
      }
      accidentalState.set(stateKey, accidental);
      return note;
    });

    const voice = new Voice({ num_beats: notes.length * 4, beat_value: 4 });
    voice.setStrict(false);
    voice.addTickables(notes);
    const formatWidth = Math.max(120, width - clefReserve - finalReserve);
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(ctx, stave);

    const svg = host.querySelector("svg");
    if (svg) {
      svg.setAttribute("style", "display:block; max-width:none; overflow:visible;");
    }
  }, [midis, tonicName, duration]);

  return (
    <div
      className={`relative overflow-x-auto rounded-lg border bg-white p-1 transition ${
        focused
          ? "border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
          : "border-zinc-200"
      } ${className}`}
    >
      <div ref={ref} className="score-host" />
    </div>
  );
}

// Render de un acorde armónico (todas las notas en una columna)
export function ScoreChord({ midis, tonicName = "C", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";
    if (!midis || midis.length === 0) return;

    const flats = preferFlatsFor(tonicName);
    const sorted = [...midis].sort((a, b) => a - b);

    const w = 110;
    const h = 96;
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(w, h);
    const ctx = renderer.getContext();
    ctx.setFont("DM Sans", 10);

    const stave = new Stave(4, 22, w - 8);
    stave.addClef("treble");
    stave.setContext(ctx).draw();

    const keys = sorted.map((m) => midiToVexNote(m, flats).key);
    const accs = sorted.map((m) => midiToVexNote(m, flats).accidental);
    const note = new StaveNote({ keys, duration: "w" });
    accs.forEach((a, i) => {
      if (a) note.addModifier(new Accidental(a), i);
    });

    const voice = new Voice({ num_beats: 1, beat_value: 1 });
    voice.setStrict(false);
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], w - 40);
    voice.draw(ctx, stave);
  }, [midis, tonicName]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 ${className}`}
    >
      <div ref={ref} className="score-host" />
    </div>
  );
}
