// Motor de audio basado en soundfont-player.
// Provee tracking global de isPlaying (con subscripción para hooks).

import Soundfont from "soundfont-player";

let audioContext = null;
let instrument = null;
let currentInstrumentName = null;
let loading = null;
let activeStops = [];

// ===== Tracking de isPlaying =====
let isPlayingState = false;
const listeners = new Set();
let stopTimer = null;

function setIsPlaying(value) {
  if (isPlayingState !== value) {
    isPlayingState = value;
    listeners.forEach((l) => {
      try {
        l(value);
      } catch {
        // ignore
      }
    });
  }
}

export function subscribeIsPlaying(fn) {
  listeners.add(fn);
  fn(isPlayingState);
  return () => listeners.delete(fn);
}

export function getIsPlaying() {
  return isPlayingState;
}

function scheduleEndOfPlayback(totalSeconds) {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    stopTimer = null;
    setIsPlaying(false);
  }, totalSeconds * 1000 + 250);
}

// ===== Contexto y carga de instrumento =====
function ensureContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export async function loadInstrument(name = "acoustic_grand_piano") {
  const ctx = ensureContext();
  if (instrument && currentInstrumentName === name) return instrument;
  if (loading) {
    try {
      await loading;
    } catch {
      // ignore
    }
  }
  loading = Soundfont.instrument(ctx, name, { soundfont: "MusyngKite" });
  try {
    instrument = await loading;
    currentInstrumentName = name;
  } finally {
    loading = null;
  }
  return instrument;
}

async function getOrLoadInstrument() {
  if (instrument) return instrument;
  if (loading) {
    try {
      await loading;
    } catch {
      // ignore
    }
    if (instrument) return instrument;
  }
  return loadInstrument();
}

export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
}

// ===== Control =====
export function stopAll() {
  activeStops.forEach((stop) => {
    try {
      stop();
    } catch {
      // ignore
    }
  });
  activeStops = [];
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (instrument && instrument.stop) instrument.stop();
  setIsPlaying(false);
}

// ===== Reproducción =====

// Una nota con duración (seg)
export async function playNote(midi, durationSec = 3.0, velocity = 0.85) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  const player = inst.play(midi, ctx.currentTime, {
    duration: durationSec,
    gain: velocity,
  });
  const stop = () => player.stop && player.stop();
  activeStops.push(stop);
  scheduleEndOfPlayback(durationSec);
}

// Secuencia melódica: notes = [{midi, duration}]
export async function playMelodic(notes, { gap = 0.05, velocity = 0.85 } = {}) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  let t = ctx.currentTime;
  const players = [];
  let total = 0;
  for (const n of notes) {
    const dur = n.duration ?? 0.6;
    const p = inst.play(n.midi, t, { duration: dur, gain: velocity });
    players.push(p);
    t += dur + gap;
    total += dur + gap;
  }
  const stop = () => players.forEach((p) => p.stop && p.stop());
  activeStops.push(stop);
  scheduleEndOfPlayback(total);
}

// Acorde simultáneo (todas las notas al mismo tiempo)
export async function playHarmonic(midis, { duration = 2.2, velocity = 0.7 } = {}) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  const t = ctx.currentTime;
  const players = midis.map((m) =>
    inst.play(m, t, { duration, gain: velocity })
  );
  const stop = () => players.forEach((p) => p.stop && p.stop());
  activeStops.push(stop);
  scheduleEndOfPlayback(duration);
}

// Progresión de acordes (cadencia) — uno tras otro
export async function playChordProgression(
  chords,
  { perChord = 0.9, velocity = 0.6 } = {}
) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  let t = ctx.currentTime;
  const players = [];
  let total = 0;
  for (const chord of chords) {
    chord.forEach((m) => {
      const p = inst.play(m, t, { duration: perChord, gain: velocity });
      players.push(p);
    });
    t += perChord;
    total += perChord;
  }
  const stop = () => players.forEach((p) => p.stop && p.stop());
  activeStops.push(stop);
  scheduleEndOfPlayback(total);
}

// Melodía + armonía simultáneos: la melodía se toca en orden, y para cada nota
// suena el acorde armónico correspondiente AL MISMO TIEMPO (no antes).
//
// notes:    [{midi, duration}]  — la melodía
// chords:   [[midi, midi, ...], ...]  — un acorde por nota de la melodía
//                                       (mismo tamaño que notes)
export async function playMelodyWithHarmony(
  notes,
  chords,
  { gap = 0.05, melodyVelocity = 0.85, harmonyVelocity = 0.42 } = {}
) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  let t = ctx.currentTime;
  const players = [];
  let total = 0;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const chord = chords[i] || [];
    const dur = n.duration ?? 0.6;
    // Melodía
    const mp = inst.play(n.midi, t, { duration: dur, gain: melodyVelocity });
    players.push(mp);
    // Armonía simultánea
    chord.forEach((m) => {
      const cp = inst.play(m, t, { duration: dur, gain: harmonyVelocity });
      players.push(cp);
    });
    t += dur + gap;
    total += dur + gap;
  }
  const stop = () => players.forEach((p) => p.stop && p.stop());
  activeStops.push(stop);
  scheduleEndOfPlayback(total);
}

// Solo la armonía (acordes en sucesión, sin melodía)
export async function playHarmonyOnly(
  chords,
  durations,
  { gap = 0.05, velocity = 0.55 } = {}
) {
  unlockAudio();
  setIsPlaying(true);
  const inst = await getOrLoadInstrument();
  const ctx = ensureContext();
  let t = ctx.currentTime;
  const players = [];
  let total = 0;
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    const dur = durations[i] ?? 0.6;
    chord.forEach((m) => {
      const p = inst.play(m, t, { duration: dur, gain: velocity });
      players.push(p);
    });
    t += dur + gap;
    total += dur + gap;
  }
  const stop = () => players.forEach((p) => p.stop && p.stop());
  activeStops.push(stop);
  scheduleEndOfPlayback(total);
}

// Combo: primero cadencia, luego algo
export async function playCadenceThen(
  cadence,
  thenFn,
  { perChord = 0.65 } = {}
) {
  unlockAudio();
  await playChordProgression(cadence, { perChord });
  const cadenceMs = cadence.length * perChord * 1000 + 150;
  setTimeout(() => {
    thenFn();
  }, cadenceMs);
}
