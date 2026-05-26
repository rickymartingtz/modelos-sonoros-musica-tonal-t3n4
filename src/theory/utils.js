// Helpers de notas y MIDI

export const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Nombres en español de las tonalidades
export const NOTE_ES = {
  C: "Do",
  "C#": "Do#",
  Db: "Reb",
  D: "Re",
  "D#": "Re#",
  Eb: "Mib",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  Gb: "Solb",
  G: "Sol",
  "G#": "Sol#",
  Ab: "Lab",
  A: "La",
  "A#": "La#",
  Bb: "Sib",
  B: "Si",
};

// Convierte MIDI a nombre tipo "C4", "F#5", etc.
export function midiToName(midi, preferFlats = false) {
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  const octave = Math.floor(midi / 12) - 1;
  const name = names[midi % 12];
  return `${name}${octave}`;
}

// Convierte nombre a MIDI (acepta C4, C#4, Db4)
export function nameToMidi(name) {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(name);
  if (!match) return null;
  const [, letter, accidental, octave] = match;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
  const acc = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  return (parseInt(octave, 10) + 1) * 12 + base + acc;
}

// Aplica una serie de intervalos (en semitonos) desde una nota raíz MIDI
export function applyIntervals(rootMidi, intervals) {
  return intervals.map((i) => rootMidi + i);
}

// Devuelve la representación VexFlow tipo "c/4" o "f#/5" desde MIDI.
// Para la ortografía correcta dentro de una escala, ver scaleSpelling().
export function midiToVexKey(midi, preferFlats = false) {
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  const octave = Math.floor(midi / 12) - 1;
  const name = names[midi % 12].toLowerCase();
  return `${name}/${octave}`;
}

// Decide ortografía (con #/b) según el contexto. Para escalas, conviene
// seguir el ciclo de quintas: si la tónica favorece sostenidos (G, D, A, E, B, F#, C#),
// usamos sostenidos; si favorece bemoles (F, Bb, Eb, Ab, Db, Gb, Cb), usamos bemoles.
const SHARP_KEYS = ["G", "D", "A", "E", "B", "F#", "C#"];
const FLAT_KEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];

export function preferFlatsFor(rootName) {
  // rootName puede venir con número de octava: lo quitamos
  const root = rootName.replace(/-?\d+$/, "");
  if (FLAT_KEYS.includes(root)) return true;
  if (SHARP_KEYS.includes(root)) return false;
  return false; // C, default sostenidos (aunque no hay alteraciones)
}

// Acepta un objeto con root (MIDI) e intervals; devuelve nombres y MIDI
export function buildSequence({ rootMidi, intervals, preferFlats }) {
  return intervals.map((semi) => {
    const midi = rootMidi + semi;
    return {
      midi,
      name: midiToName(midi, preferFlats),
      vex: midiToVexKey(midi, preferFlats),
    };
  });
}

// Genera una cadencia I-IV-V-I en una tonalidad dada (modo mayor por defecto)
export function cadenceIvVI(rootMidi, mode = "major") {
  // Estructura: I (root, 3, 5), IV (root+5, +9, +12), V (root+7, +11, +14), I (root, 3, 5)
  // En modo menor: i (root, b3, 5), iv (root+5, +8, +12), V (root+7, +11, +14), i
  const isMajor = mode === "major";
  const I = [0, isMajor ? 4 : 3, 7];
  const IV = [5, isMajor ? 9 : 8, 12];
  const V = [7, 11, 14]; // V siempre mayor (dominante)
  return [I, IV, V, I].map((chord) => chord.map((semi) => rootMidi + semi));
}

// Limita un MIDI a un rango cantable razonable (C2 = 36 a C6 = 84)
export function clampToSinging(midi) {
  while (midi < 48) midi += 12;
  while (midi > 76) midi -= 12;
  return midi;
}
