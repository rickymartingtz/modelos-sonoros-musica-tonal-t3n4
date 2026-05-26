import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";
import * as VF from "vexflow";

// =============================================================================
// AUDIO CONTEXT HELPERS
// =============================================================================
let sharedAudioContext = null;

function getSharedAudioContext() {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext?.state === "closed") sharedAudioContext = null;
  if (!sharedAudioContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      sharedAudioContext = new AC({ latencyHint: "interactive" });
    } catch {
      sharedAudioContext = new AC();
    }
  }
  return sharedAudioContext;
}

function fireSilentUnlockPulse(ctx) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = Math.max(ctx.currentTime, 0);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {
    // ignore
  }
}

// =============================================================================
// ICONS
// =============================================================================
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
function PlayIcon({ className }) { return (<IconBase className={className}><path d="M6 4l14 8-14 8V4Z" /></IconBase>); }
function ChordIcon({ className }) { return (<IconBase className={className}><path d="M5 6h14" /><path d="M5 12h14" /><path d="M5 18h14" /></IconBase>); }
function DotIcon({ className }) { return (<IconBase className={className}><circle cx="12" cy="12" r="3.5" /></IconBase>); }
function StopIcon({ className }) { return (<IconBase className={className}><rect x="6" y="6" width="12" height="12" rx="1.5" /></IconBase>); }
function ArrowUpIcon({ className }) { return (<IconBase className={className}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></IconBase>); }
function ArrowDownIcon({ className }) { return (<IconBase className={className}><path d="M12 5v14" /><path d="M5 12l7 7 7-7" /></IconBase>); }
function ResetIcon({ className }) { return (<IconBase className={className}><path d="M4 4v6h6" /><path d="M20 9A8 8 0 0 0 6.3 5.7L4 8" /><path d="M4 15a8 8 0 0 0 13.7 3.3L20 16" /></IconBase>); }
function PlusIcon({ className }) { return (<IconBase className={className}><path d="M12 5v14" /><path d="M5 12h14" /></IconBase>); }
function MinusIcon({ className }) { return (<IconBase className={className}><path d="M5 12h14" /></IconBase>); }

// =============================================================================
// THEME STYLES
// =============================================================================
function AppThemeStyles() {
  return (
    <style>{`
      :root {
        --aural-active-bg: #e7f8ef;
        --aural-active-border: #86efac;
        --aural-active-text: #166534;
        --aural-active-hover: #dcfce7;
        --aural-ring: rgba(34, 197, 94, 0.18);
      }
      .aural-active, .aural-primary {
        background-color: var(--aural-active-bg) !important;
        border-color: var(--aural-active-border) !important;
        color: var(--aural-active-text) !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 0 0 1px var(--aural-ring) !important;
      }
      .aural-active:hover, .aural-primary:hover {
        background-color: var(--aural-active-hover) !important;
        border-color: var(--aural-active-border) !important;
      }
      .aural-black-button {
        background-color: #18181b !important;
        border-color: #18181b !important;
        color: #ffffff !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
      }
      .aural-black-button:hover {
        background-color: #27272a !important;
        border-color: #27272a !important;
      }
      .model-card.focused {
        border-color: #34d399 !important;
        box-shadow: 0 0 0 1px rgba(16,185,129,0.25), 0 4px 12px rgba(0,0,0,0.04);
      }
      .font-display { font-family: "Cormorant Garamond", Georgia, serif; }
    `}</style>
  );
}

// =============================================================================
// MIDI / NOTATION HELPERS
// =============================================================================
const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NOTE_ES = {
  C: "Do", "C#": "Do♯", Db: "Re♭", D: "Re", "D#": "Re♯", Eb: "Mi♭",
  E: "Mi", F: "Fa", "F#": "Fa♯", Gb: "Sol♭", G: "Sol", "G#": "Sol♯",
  Ab: "La♭", A: "La", "A#": "La♯", Bb: "Si♭", B: "Si",
};
const LETTERS = ["c", "d", "e", "f", "g", "a", "b"];
const ACCIDENTAL_ASCII = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };

const SHARP_KEYS = ["G", "D", "A", "E", "B", "F#", "C#"];
const FLAT_KEYS  = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];

function preferFlatsFor(rootName) {
  const root = String(rootName).replace(/-?\d+$/, "");
  if (FLAT_KEYS.includes(root)) return true;
  if (SHARP_KEYS.includes(root)) return false;
  return false;
}

function midiToSpelledNote(midi, preferFlats = false) {
  const semitone = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const sharpLetters = ["c", "c", "d", "d", "e", "f", "f", "g", "g", "a", "a", "b"];
  const sharpAccs    = [ 0,   1,   0,   1,   0,   0,   1,   0,   1,   0,   1,   0];
  const flatLetters  = ["c", "d", "d", "e", "e", "f", "g", "g", "a", "a", "b", "b"];
  const flatAccs     = [ 0,  -1,   0,  -1,   0,   0,  -1,   0,  -1,   0,  -1,   0];
  const letter = preferFlats ? flatLetters[semitone] : sharpLetters[semitone];
  const accidental = preferFlats ? flatAccs[semitone] : sharpAccs[semitone];
  const labelMap = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return { midi, letter, accidental, octave, label: `${labelMap[semitone]}${octave}` };
}

function applyIntervals(rootMidi, intervals) {
  return intervals.map((i) => rootMidi + i);
}

function clampToSinging(midi) {
  let m = midi;
  while (m < 48) m += 12;
  while (m > 76) m -= 12;
  return m;
}

function romanize(n) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] || String(n);
}

function degreeOrdinal(n) {
  return ["1°", "2°", "3°", "4°", "5°", "6°", "7°"][n - 1] || `${n}°`;
}

function tonicEsLabel(midi) {
  const sharpName = NOTE_NAMES_SHARP[((midi % 12) + 12) % 12];
  const flatName = NOTE_NAMES_FLAT[((midi % 12) + 12) % 12];
  const sharpRoots = new Set(["C#", "D#", "F#", "G#", "A#"]);
  const chosen = sharpRoots.has(sharpName) ? flatName : sharpName;
  return NOTE_ES[chosen] || chosen;
}

// =============================================================================
// CATÁLOGO DE FÓRMULAS A LA TÓNICA (extraído verbatim del PDF de Método Aural)
// =============================================================================
// Convención: las melody son intervalos en semitonos desde la tónica.
// La tónica está en root MIDI (típicamente 60 = C4).
// soundDurations: duración por nota en segundos (negras + blanca final).
// harmony: array de acordes (cada acorde = array de semitonos relativos a la tónica).
//          mismo tamaño que melody — cada acorde acompaña su nota.
// harmonyLabels: nombres romanos para mostrar abajo del pentagrama.

// Voicings con bajo abajo de la tónica para no chocar con la melodía
const I_MAJ      = [-12, -8, -5, 0];        // Do2 Mi2 Sol2 Do3   (I en C mayor)
const IV_MAJ     = [-19, -3, 0, 5];         // Fa1 La2 Do3 Fa3  → IV
const V_MAJ      = [-17, -1, 2, 7];         // Sol1 Si2 Re3 Sol3 → V
const i_min      = [-12, -9, -5, 0];        // Do2 Mib2 Sol2 Do3 → i
const iv_min     = [-19, -4, 0, 5];         // Fa1 Lab2 Do3 Fa3 → iv
const V_in_min   = [-17, -1, 2, 7];         // V mayor en menor (con sensible)
const ii_maj     = [-22, -3, 2, 5];         // Re1 La2 Re3 Fa3 → ii (Re-Fa-La)
const ii_dim     = [-22, -4, 2, 5];         // Re1 Lab2 Re3 Fa3 → ii° (Re-Fa-Lab)
const v6_in_min  = [-14, -5, -2, 2];        // Sib2 Sol2 Sib2 Re3 → v6 (Sib en bajo)
const iv6_in_min = [-16, -4, 0, 5];         // Lab2 Do3 Fa3 → iv6 (Lab en bajo)

// Duraciones musicales (segundos)
const D_QUARTER = 0.55;
const D_HALF    = 1.1;
const D_WHOLE   = 1.7;

const TONIC_FORMULAS = {
  major: [
    {
      id: "maj-1", degree: 1, label: "1° grado", formula: "1",
      melody: [0], soundDurations: [D_WHOLE],
      harmony: [I_MAJ], harmonyLabels: ["I"],
      info: "El grado tónico en estado de reposo. Establece el centro de gravedad sin desplazamiento.",
      level: 1,
    },
    {
      id: "maj-2", degree: 2, label: "2° grado", formula: "2 – 1",
      melody: [2, 0], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_MAJ, I_MAJ], harmonyLabels: ["V", "I"],
      info: "Segunda mayor descendente. El 2° grado tiene una tendencia natural a resolver al 1°. La armonía V → I confirma el movimiento.",
      level: 2,
    },
    {
      id: "maj-3", degree: 3, label: "3° grado", formula: "3 – 2 – 1",
      melody: [4, 2, 0], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [I_MAJ, V_MAJ, I_MAJ], harmonyLabels: ["I", "V", "I"],
      info: "Descenso por segundas conjuntas. El 3° pertenece a la tríada de tónica; pasa por el 2° (predominante implícito) hasta la 1.",
      level: 2,
    },
    {
      id: "maj-4", degree: 4, label: "4° grado", formula: "4 – 3 – 2 – 1",
      melody: [5, 4, 2, 0], soundDurations: [D_QUARTER, D_QUARTER, D_QUARTER, D_HALF],
      harmony: [IV_MAJ, I_MAJ, V_MAJ, I_MAJ], harmonyLabels: ["IV", "I", "V", "I"],
      info: "Subdominante descendiendo gradualmente. La armonización IV → I → V → I es la forma canónica de armonizar el descenso completo del tetracordo.",
      level: 3,
    },
    {
      id: "maj-5", degree: 5, label: "5° grado", formula: "5 – 1",
      melody: [7, 0], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_MAJ, I_MAJ], harmonyLabels: ["V", "I"],
      info: "Salto descendente de quinta justa: el gesto cadencial más estable del sistema tonal. V → I.",
      level: 1,
    },
    {
      id: "maj-6", degree: 6, label: "6° grado", formula: "6 – 5 – 1",
      melody: [9, 7, 0], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [IV_MAJ, V_MAJ, I_MAJ], harmonyLabels: ["IV", "V", "I"],
      info: "Descenso de segunda hacia el 5°, luego salto de quinta a la tónica. IV → V → I es la cadencia auténtica completa.",
      level: 3,
    },
    {
      id: "maj-7", degree: 7, label: "7° grado", formula: "7 – 1",
      melody: [11, 12], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_MAJ, I_MAJ], harmonyLabels: ["V", "I"],
      info: "Sensible ascendiendo por semitono. La nota más direccional del sistema mayor: tracciona inevitablemente a la tónica.",
      level: 2,
    },
  ],
  harmonicMinor: [
    {
      id: "hm-1", degree: 1, label: "1° grado", formula: "1",
      melody: [0], soundDurations: [D_WHOLE],
      harmony: [i_min], harmonyLabels: ["i"],
      info: "Tónica del modo menor armónico. Misma función de reposo que en mayor.",
      level: 1,
    },
    {
      id: "hm-2", degree: 2, label: "2° grado", formula: "2 – 1",
      melody: [2, 0], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_in_min, i_min], harmonyLabels: ["V", "i"],
      info: "El 2° del menor mantiene la misma altura que en mayor (segunda mayor). Resuelve por segunda descendente a la tónica.",
      level: 4,
    },
    {
      id: "hm-3", degree: 3, label: "3° grado", formula: "♭3 – 2 – 1",
      melody: [3, 2, 0], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [i_min, V_in_min, i_min], harmonyLabels: ["i", "V", "i"],
      info: "La tercera menor sustituye a la mayor del modo paralelo. Resuelve a la tónica por segundas descendentes.",
      level: 4,
    },
    {
      id: "hm-4", degree: 4, label: "4° grado", formula: "4 – ♭3 – 2 – 1",
      melody: [5, 3, 2, 0], soundDurations: [D_QUARTER, D_QUARTER, D_QUARTER, D_HALF],
      harmony: [iv_min, i_min, V_in_min, i_min], harmonyLabels: ["iv", "i", "V", "i"],
      info: "Descenso completo del tetracordo menor. iv (subdominante menor) → i → V → i.",
      level: 5,
    },
    {
      id: "hm-5", degree: 5, label: "5° grado", formula: "5 – 1",
      melody: [7, 0], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_in_min, i_min], harmonyLabels: ["V", "i"],
      info: "Quinta descendente al menor: equivalente del V → I del modo mayor, con el V manteniendo la sensible alzada.",
      level: 4,
    },
    {
      id: "hm-6", degree: 6, label: "6° grado", formula: "♭6 – 5 – 1",
      melody: [8, 7, 0], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [iv_min, V_in_min, i_min], harmonyLabels: ["iv", "V", "i"],
      info: "La sexta menor del menor armónico desciende por semitono al 5°, luego salto a la tónica. Cadencia perfecta menor.",
      level: 5,
    },
    {
      id: "hm-7", degree: 7, label: "7° grado", formula: "7 – 1",
      melody: [11, 12], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_in_min, i_min], harmonyLabels: ["V", "i"],
      info: "Sensible del menor armónico (la séptima alzada que da nombre a la escala). Idéntica direccionalidad que en el modo mayor.",
      level: 4,
    },
  ],
  melodicMinorAsc: [
    {
      id: "mma-6", degree: 6, label: "6° grado (alzado)", formula: "6 – 7 – 1",
      melody: [9, 11, 12], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [ii_maj, V_in_min, i_min], harmonyLabels: ["ii", "V", "i"],
      info: "El menor melódico ascendente alza el 6° y 7° grados para evitar la segunda aumentada del armónico. Ascenso fluido 6 → 7 → 8va.",
      level: 6,
    },
    {
      id: "mma-7", degree: 7, label: "7° grado (alzado)", formula: "7 – 1",
      melody: [11, 12], soundDurations: [D_QUARTER, D_HALF],
      harmony: [V_in_min, i_min], harmonyLabels: ["V", "i"],
      info: "Sensible alzada del menor melódico: idéntica al armónico, sirve para la cadencia perfecta.",
      level: 6,
    },
  ],
  naturalMinor: [
    {
      id: "nm-6", degree: 6, label: "♭6° grado (descenso)", formula: "♭6 – 5 – 1",
      melody: [8, 7, 0], soundDurations: [D_QUARTER, D_QUARTER, D_HALF],
      harmony: [ii_dim, V_in_min, i_min], harmonyLabels: ["ii°", "V", "i"],
      info: "El descenso natural mantiene la sexta menor sin alterar. Aquí la armonía ii° → V → i marca el contraste con el menor armónico.",
      level: 7,
    },
    {
      id: "nm-7", degree: 7, label: "♭7° grado (descenso)", formula: "♭7 – ♭6 – 5 – 1",
      melody: [10, 8, 7, 0], soundDurations: [D_QUARTER, D_QUARTER, D_QUARTER, D_HALF],
      harmony: [v6_in_min, iv6_in_min, V_in_min, i_min], harmonyLabels: ["v⁶", "iv⁶", "V", "i"],
      info: "El descenso completo del tetracordo natural usa armonías de inversión (v⁶ y iv⁶) para mantener la conducción fluida del bajo.",
      level: 7,
    },
  ],
};

const TONIC_MODES = {
  major: { label: "Mayor" },
  harmonicMinor: { label: "Menor armónica" },
  melodicMinorAsc: { label: "Menor melódica asc." },
  naturalMinor: { label: "Menor natural / desc." },
};

// =============================================================================
// CATÁLOGO DE ACORDES (para Fundamental y Arpegios)
// =============================================================================
const CHORDS = [
  {
    id: "M",  name: "Mayor",   symbol: "M",   level: 1, intervals: [0, 4, 7],
    inversions: [
      { label: "Fundamental",  intervals: [0, 4, 7, 12] },
      { label: "1ª inversión", intervals: [4, 7, 12, 16] },
      { label: "2ª inversión", intervals: [7, 12, 16, 19] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 4, 7, 12] },
      { label: "Desde 3",  intervals: [4, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
    ],
    info: "Tríada mayor (1-3-5). Acorde fundamental de la armonía tonal occidental.",
  },
  {
    id: "m",  name: "Menor",   symbol: "m",   level: 1, intervals: [0, 3, 7],
    inversions: [
      { label: "Fundamental",  intervals: [0, 3, 7, 12] },
      { label: "1ª inversión", intervals: [3, 7, 12, 15] },
      { label: "2ª inversión", intervals: [7, 12, 15, 19] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 3, 7, 12] },
      { label: "Desde ♭3", intervals: [3, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
    ],
    info: "Tríada menor (1-♭3-5). Núcleo del modo menor.",
  },
  {
    id: "dim", name: "Disminuido", symbol: "dim", level: 2, intervals: [0, 3, 6],
    inversions: [
      { label: "Fundamental",  intervals: [0, 3, 6, 12] },
      { label: "1ª inversión", intervals: [3, 6, 12, 15] },
      { label: "2ª inversión", intervals: [6, 12, 15, 18] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 3, 6, 12] },
      { label: "Desde ♭3", intervals: [3, 6, 12] },
      { label: "Desde ♭5", intervals: [6, 12] },
    ],
    info: "Tríada disminuida (1-♭3-♭5). Función dominante en menor (vii°), o paso cromático.",
  },
  {
    id: "aum", name: "Aumentado", symbol: "aum", level: 2, intervals: [0, 4, 8],
    inversions: [
      { label: "Posición fundamental", intervals: [0, 4, 8, 12] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 4, 8, 12] },
      { label: "Desde 3",  intervals: [4, 8, 12] },
      { label: "Desde #5", intervals: [8, 12] },
    ],
    info: "Tríada aumentada (1-3-#5). Simétrica: ninguna nota establece tónica perceptible por sí sola.",
  },
  {
    id: "dom7", name: "Dominante 7", symbol: "7", level: 3, intervals: [0, 4, 7, 10],
    inversions: [
      { label: "Fundamental",  intervals: [0, 4, 7, 10, 12] },
      { label: "1ª inversión", intervals: [4, 7, 10, 12, 16] },
      { label: "2ª inversión", intervals: [7, 10, 12, 16, 19] },
      { label: "3ª inversión", intervals: [10, 12, 16, 19, 22] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 4, 7, 12] },
      { label: "Desde 3",  intervals: [4, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
      { label: "Desde ♭7", intervals: [10, 12] },
    ],
    info: "Tríada mayor + séptima menor (1-3-5-♭7). El motor de la cadencia tonal.",
  },
  {
    id: "m7", name: "Menor 7", symbol: "m7", level: 3, intervals: [0, 3, 7, 10],
    inversions: [
      { label: "Fundamental",  intervals: [0, 3, 7, 10, 12] },
      { label: "1ª inversión", intervals: [3, 7, 10, 12, 15] },
      { label: "2ª inversión", intervals: [7, 10, 12, 15, 19] },
      { label: "3ª inversión", intervals: [10, 12, 15, 19, 22] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 3, 7, 12] },
      { label: "Desde ♭3", intervals: [3, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
      { label: "Desde ♭7", intervals: [10, 12] },
    ],
    info: "Tríada menor + séptima menor (1-♭3-5-♭7). ii7 en mayor, función predominante.",
  },
  {
    id: "Maj7", name: "Mayor 7", symbol: "Maj7", level: 4, intervals: [0, 4, 7, 11],
    inversions: [
      { label: "Fundamental",  intervals: [0, 4, 7, 11, 12] },
      { label: "1ª inversión", intervals: [4, 7, 11, 12, 16] },
      { label: "2ª inversión", intervals: [7, 11, 12, 16, 19] },
      { label: "3ª inversión", intervals: [11, 12, 16, 19, 23] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 4, 7, 12] },
      { label: "Desde 3",  intervals: [4, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
      { label: "Desde 7",  intervals: [11, 12] },
    ],
    info: "Tríada mayor + séptima mayor (1-3-5-7). Tónica estable y luminosa (I7 o IV7 sobre lidio).",
  },
  {
    id: "m7b5", name: "Semidisminuido", symbol: "ø7", level: 5, intervals: [0, 3, 6, 10],
    inversions: [
      { label: "Fundamental",  intervals: [0, 3, 6, 10, 12] },
      { label: "1ª inversión", intervals: [3, 6, 10, 12, 15] },
      { label: "2ª inversión", intervals: [6, 10, 12, 15, 18] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 3, 6, 12] },
      { label: "Desde ♭3", intervals: [3, 6, 12] },
      { label: "Desde ♭5", intervals: [6, 12] },
      { label: "Desde ♭7", intervals: [10, 12] },
    ],
    info: "1-♭3-♭5-♭7. ii⁷ del modo menor; resuelve a V7 en cadencia ii-V-i menor.",
  },
  {
    id: "dim7", name: "Disminuido 7", symbol: "dim7", level: 6, intervals: [0, 3, 6, 9],
    inversions: [
      { label: "Fundamental",        intervals: [0, 3, 6, 9, 12] },
      { label: "1ª inversión",       intervals: [3, 6, 9, 12, 15] },
    ],
    approach: [
      { label: "Desde 1",   intervals: [0, 3, 6, 9, 12] },
    ],
    info: "1-♭3-♭5-♭♭7. Acorde simétrico (cuatro terceras menores). Función de dominante o pivote modulante.",
  },
  {
    id: "mMaj7", name: "Menor Mayor 7", symbol: "mMaj7", level: 6, intervals: [0, 3, 7, 11],
    inversions: [
      { label: "Fundamental",  intervals: [0, 3, 7, 11, 12] },
      { label: "1ª inversión", intervals: [3, 7, 11, 12, 15] },
    ],
    approach: [
      { label: "Desde 1",  intervals: [0, 3, 7, 12] },
      { label: "Desde ♭3", intervals: [3, 7, 12] },
      { label: "Desde 5",  intervals: [7, 12] },
      { label: "Desde 7",  intervals: [11, 12] },
    ],
    info: "1-♭3-5-7. Acorde-tónica del menor melódico ascendente. Carácter sofisticado / James Bond.",
  },
];

// =============================================================================
// CATÁLOGO DE ESCALAS
// =============================================================================
const SCALE_FAMILIES = {
  diatonic:           { label: "Diatónicas y menores" },
  majorModes:         { label: "Modos del mayor" },
  melodicMinorModes:  { label: "Modos del menor melódico" },
  harmonicMinorModes: { label: "Modos del menor armónico" },
  pentatonic:         { label: "Pentatónicas" },
  hexatonic:          { label: "Hexáfonas" },
  octatonic:          { label: "Octatónicas y bebop" },
  messiaen:           { label: "Modos de Messiaen" },
  synthetic:          { label: "Sintéticas y exóticas" },
  worldApprox:        { label: "Aproximaciones no-occidentales" },
};

const SCALES = [
  { id: "major",        name: "Mayor",                   family: "diatonic",          intervals: [0, 2, 4, 5, 7, 9, 11],     formula: "1 - 2 - 3 - 4 - 5 - 6 - 7",          level: 1, aliases: ["Jónico"], info: "Escala diatónica mayor. Base de la armonía tonal occidental." },
  { id: "naturalMinor", name: "Menor natural",           family: "diatonic",          intervals: [0, 2, 3, 5, 7, 8, 10],     formula: "1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7",       level: 1, aliases: ["Eólico"], info: "Forma descendente del menor melódico. Equivalente al modo eólico." },
  { id: "harmonicMinor",name: "Menor armónica",          family: "diatonic",          intervals: [0, 2, 3, 5, 7, 8, 11],     formula: "1 - 2 - ♭3 - 4 - 5 - ♭6 - 7",        level: 1, aliases: [], info: "Menor con sensible. Segunda aumentada entre ♭6 y 7. Base del flamenco y el klezmer." },
  { id: "melMinAsc",    name: "Menor melódica asc.",     family: "diatonic",          intervals: [0, 2, 3, 5, 7, 9, 11],     formula: "1 - 2 - ♭3 - 4 - 5 - 6 - 7",         level: 1, aliases: [], info: "Sólo la 3ª es menor; el resto coincide con la mayor. En jazz se usa como escala completa." },
  { id: "dorian",       name: "Dórico",                  family: "majorModes",        intervals: [0, 2, 3, 5, 7, 9, 10],     formula: "1 - 2 - ♭3 - 4 - 5 - 6 - ♭7",        level: 2, aliases: ["Modo II del mayor"], info: "Menor con 6ª mayor. Central en jazz modal." },
  { id: "phrygian",     name: "Frigio",                  family: "majorModes",        intervals: [0, 1, 3, 5, 7, 8, 10],     formula: "1 - ♭2 - ♭3 - 4 - 5 - ♭6 - ♭7",      level: 2, aliases: ["Modo III del mayor"], info: "Menor con ♭2 característica. Modo medieval." },
  { id: "lydian",       name: "Lidio",                   family: "majorModes",        intervals: [0, 2, 4, 6, 7, 9, 11],     formula: "1 - 2 - 3 - ♯4 - 5 - 6 - 7",         level: 3, aliases: ["Modo IV del mayor"], info: "Mayor con #4. Sonoridad suspendida y luminosa." },
  { id: "mixolydian",   name: "Mixolidio",               family: "majorModes",        intervals: [0, 2, 4, 5, 7, 9, 10],     formula: "1 - 2 - 3 - 4 - 5 - 6 - ♭7",         level: 2, aliases: ["Modo V del mayor"], info: "Mayor con ♭7. Sobre acorde dominante; central en blues y rock." },
  { id: "locrian",      name: "Locrio",                  family: "majorModes",        intervals: [0, 1, 3, 5, 6, 8, 10],     formula: "1 - ♭2 - ♭3 - 4 - ♭5 - ♭6 - ♭7",     level: 4, aliases: ["Modo VII del mayor"], info: "Modo más oscuro. Tónica disminuida; rara vez se usa como reposo." },
  { id: "lydianDom",    name: "Lidio dominante",         family: "melodicMinorModes", intervals: [0, 2, 4, 6, 7, 9, 10],     formula: "1 - 2 - 3 - ♯4 - 5 - 6 - ♭7",        level: 6, aliases: ["Bartók", "Modo IV del menor melódico"], info: "Mixolidio con #11. Escala acústica de Bartók; sobre dominantes alterados." },
  { id: "altered",      name: "Alterada",                family: "melodicMinorModes", intervals: [0, 1, 3, 4, 6, 8, 10],     formula: "1 - ♭2 - ♭3 - 3 - ♭5 - ♯5 - ♭7",     level: 6, aliases: ["Súper locrio", "Modo VII del menor melódico"], info: "Todas las tensiones alteradas del dominante. Escala estándar para V7alt en jazz." },
  { id: "phrygianDom",  name: "Frigio dominante",        family: "harmonicMinorModes",intervals: [0, 1, 4, 5, 7, 8, 10],     formula: "1 - ♭2 - 3 - 4 - 5 - ♭6 - ♭7",       level: 5, aliases: ["Andaluz", "Hijaz-Nahawand", "Freygish", "Modo V del menor armónico"], info: "Frigio con 3ª mayor. Sonoridad universal: flamenco, klezmer, raga Bhairav." },
  { id: "dorianS4",     name: "Dórico #4",               family: "harmonicMinorModes",intervals: [0, 2, 3, 6, 7, 9, 10],     formula: "1 - 2 - ♭3 - ♯4 - 5 - 6 - ♭7",       level: 7, aliases: ["Ucraniano", "Mi Sheberach"], info: "Modo IV del menor armónico. Klezmer, folk rumano y ucraniano." },
  { id: "majPent",      name: "Pentatónica mayor",       family: "pentatonic",        intervals: [0, 2, 4, 7, 9],            formula: "1 - 2 - 3 - 5 - 6",                  level: 2, aliases: [], info: "Mayor sin 4ª ni 7ª. Universal en folklores de todos los continentes." },
  { id: "minPent",      name: "Pentatónica menor",       family: "pentatonic",        intervals: [0, 3, 5, 7, 10],           formula: "1 - ♭3 - 4 - 5 - ♭7",                level: 2, aliases: [], info: "Subconjunto del menor natural. Base universal del blues y rock." },
  { id: "bluesMin",     name: "Blues menor",             family: "pentatonic",        intervals: [0, 3, 5, 6, 7, 10],        formula: "1 - ♭3 - 4 - ♭5 - 5 - ♭7",           level: 3, aliases: [], info: "Pentatónica menor con blue note (♭5)." },
  { id: "hirajoshi",    name: "Hirajoshi",               family: "pentatonic",        intervals: [0, 2, 3, 7, 8],            formula: "1 - 2 - ♭3 - 5 - ♭6",                level: 4, aliases: ["Pentatónica japonesa"], info: "Pentatónica con ♭6 característica. Música tradicional japonesa." },
  { id: "wholeTone",    name: "Tonos enteros",           family: "hexatonic",         intervals: [0, 2, 4, 6, 8, 10],        formula: "1 - 2 - 3 - ♯4 - ♯5 - ♭7",           level: 4, aliases: ["MTL I de Messiaen"], info: "Seis tonos consecutivos. Simetría total. Debussy, Messiaen." },
  { id: "dimWH",        name: "Disminuida (W-H)",        family: "octatonic",         intervals: [0, 2, 3, 5, 6, 8, 9, 11],  formula: "1 - 2 - ♭3 - 4 - ♭5 - ♭6 - 6 - 7",   level: 5, aliases: ["Octatónica tono-semitono"], info: "Tono-semitono alternados. Stravinsky, jazz moderno. MTL II de Messiaen." },
  { id: "dimHW",        name: "Disminuida (H-W)",        family: "octatonic",         intervals: [0, 1, 3, 4, 6, 7, 9, 10],  formula: "1 - ♭2 - ♭3 - 3 - ♭5 - 5 - 6 - ♭7",  level: 5, aliases: ["Octatónica semitono-tono"], info: "Escala del dominante en jazz moderno (sobre acordes dim7 y dominantes alterados)." },
  { id: "bebopDom",     name: "Bebop dominante",         family: "octatonic",         intervals: [0, 2, 4, 5, 7, 9, 10, 11], formula: "1 - 2 - 3 - 4 - 5 - 6 - ♭7 - 7",     level: 3, aliases: [], info: "Mixolidio con séptima mayor de paso. Charlie Parker, Dizzy Gillespie." },
  { id: "doubleHarm",   name: "Doble armónica",          family: "synthetic",         intervals: [0, 1, 4, 5, 7, 8, 11],     formula: "1 - ♭2 - 3 - 4 - 5 - ♭6 - 7",        level: 6, aliases: ["Bizantina", "Húngara mayor"], info: "Dos segundas aumentadas. Tradición bizantina, folklore húngaro." },
  { id: "hungarianMin", name: "Húngara menor",           family: "synthetic",         intervals: [0, 2, 3, 6, 7, 8, 11],     formula: "1 - 2 - ♭3 - ♯4 - 5 - ♭6 - 7",       level: 6, aliases: ["Doble armónica menor", "Gitana menor"], info: "Menor con #4 y 7 mayor. Folklore húngaro y romaní; Liszt, Brahms." },
  { id: "hijaz",        name: "Hijaz",                   family: "worldApprox",       intervals: [0, 1, 4, 5, 7, 8, 10],     formula: "1 - ♭2 - 3 - 4 - 5 - ♭6 - ♭7",       level: 5, aliases: ["Maqam Hijaz (aprox.)"], info: "Aproximación temperada del maqam Hijaz árabe (su 3ª real es neutral)." },
  { id: "yaman",        name: "Yaman (raga)",            family: "worldApprox",       intervals: [0, 2, 4, 6, 7, 9, 11],     formula: "1 - 2 - 3 - ♯4 - 5 - 6 - 7",         level: 4, aliases: ["Kalyan"], info: "Raga vespertino fundamental de la música clásica hindostaní." },
];

// =============================================================================
// SMALLSCORE: PARTITURA CON REDONDAS Y CLICK EN NOTAS
// =============================================================================
// Adaptado del componente SmallScore de Modelos Sonoros de Intervalos.
// - Renderiza redondas por defecto.
// - Alinea verticalmente el pentagrama (STAFF_VERTICAL_OFFSET).
// - Soporta click en cada nota para reproducirla individualmente.

function SmallScore({ sequence, focused = false, compact = false, onNoteClick = null }) {
  const containerRef = useRef(null);
  const [noteClickRegions, setNoteClickRegions] = useState([]);
  const [scoreSize, setScoreSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current || !sequence?.length) {
      setNoteClickRegions([]);
      setScoreSize({ width: 0, height: 0 });
      return;
    }
    containerRef.current.innerHTML = "";
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;
      const noteCount = sequence.length;
      const noteSpacing = compact ? 42 : 50;
      const clefReserve = 50;
      const finalReserve = 24;
      const startPadding = 16;
      const width = clefReserve + finalReserve + startPadding + noteCount * noteSpacing + 14;

      const STEP_PX = 5;
      const STAVE_PX = 40;
      const PADDING = compact ? 22 : 26;
      const middleLineDiatonic = 34; // tre­ble: B4 = 7*4 + 6

      const stepsFromMiddle = sequence.map((n) => (7 * n.octave + LETTERS.indexOf(n.letter)) - middleLineDiatonic);
      const maxAbove = Math.max(0, ...stepsFromMiddle);
      const maxBelow = Math.max(0, ...stepsFromMiddle.map((s) => -s));

      const clefExtAbove = 1;
      const clefExtBelow = 3;
      const staveAboveSteps = 4 + clefExtAbove;
      const staveBelowSteps = 4 + clefExtBelow;
      const NOTEHEAD = 0.6;

      const topExtent = Math.max(maxAbove, staveAboveSteps) + NOTEHEAD;
      const bottomExtent = Math.max(maxBelow, staveBelowSteps) + NOTEHEAD;
      const topPx = topExtent * STEP_PX;
      const bottomPx = bottomExtent * STEP_PX;
      const height = Math.ceil(topPx + bottomPx + 2 * PADDING);

      const STAFF_VERTICAL_OFFSET = -35;
      const middleLineY = Math.round(PADDING + topPx + STAFF_VERTICAL_OFFSET);
      const staveY = middleLineY - STAVE_PX / 2;
      const staveX = 4;
      const staveWidth = width - staveX - 6;

      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      const stave = new Stave(staveX, staveY, staveWidth);
      stave.addClef("treble");
      if (VF.Barline?.type?.END && typeof stave.setEndBarType === "function") {
        stave.setEndBarType(VF.Barline.type.END);
      }
      stave.setContext(context).draw();

      const accidentalState = new Map();
      const staveNotes = sequence.map((note) => {
        const sn = new StaveNote({ clef: "treble", keys: [`${note.letter}${ACCIDENTAL_ASCII[String(note.accidental)] === "n" ? "" : (ACCIDENTAL_ASCII[String(note.accidental)] || "")}/${note.octave}`], duration: "w" });
        const stateKey = `${note.letter}${note.octave}`;
        const previousAcc = accidentalState.get(stateKey) ?? 0;
        if (note.accidental !== 0) {
          sn.addModifier(new Accidental(ACCIDENTAL_ASCII[String(note.accidental)]), 0);
        } else if (previousAcc !== 0) {
          sn.addModifier(new Accidental("n"), 0);
        }
        accidentalState.set(stateKey, note.accidental);
        return sn;
      });

      const voice = new Voice({ num_beats: noteCount * 4, beat_value: 4 });
      if (typeof voice.setMode === "function" && Voice.Mode) voice.setMode(Voice.Mode.SOFT);
      if (typeof voice.setStrict === "function") voice.setStrict(false);
      voice.addTickables(staveNotes);
      const formatWidth = Math.max(120, staveWidth - clefReserve - finalReserve);
      new Formatter().joinVoices([voice]).format([voice], formatWidth);
      voice.draw(context, stave);

      const svg = containerRef.current.querySelector("svg");
      if (svg) {
        svg.setAttribute("style", "display:block; max-width:none; overflow:visible;");
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(height));
      }

      if (onNoteClick) {
        const regions = staveNotes.map((sn, idx) => {
          let x = clefReserve + startPadding + idx * noteSpacing + noteSpacing / 2;
          try {
            if (typeof sn.getAbsoluteX === "function") x = sn.getAbsoluteX();
            else if (typeof sn.getX === "function") x = sn.getX();
          } catch {
            // ignore
          }
          return { idx, x: Math.round(x), width: compact ? 34 : 40 };
        });
        setNoteClickRegions(regions);
        setScoreSize({ width, height });
      } else {
        setNoteClickRegions([]);
        setScoreSize({ width, height });
      }
    } catch (error) {
      containerRef.current.innerHTML = `<div class="text-xs text-rose-600 p-2">Error al dibujar partitura</div>`;
      setNoteClickRegions([]);
      setScoreSize({ width: 0, height: 0 });
      console.error("VexFlow error:", error);
    }
  }, [sequence, compact, Boolean(onNoteClick)]);

  return (
    <div className={`relative overflow-x-auto rounded-lg border bg-white p-1 transition ${focused ? "border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]" : "border-zinc-200"}`}>
      <div ref={containerRef} />
      {onNoteClick && noteClickRegions.length ? (
        <div className="pointer-events-none absolute left-1 top-1" style={{ width: scoreSize.width, height: scoreSize.height }}>
          {noteClickRegions.map((region) => {
            const note = sequence?.[region.idx];
            return (
              <button
                key={region.idx}
                type="button"
                tabIndex={-1}
                aria-label={note ? `Escuchar ${note.label}` : "Escuchar nota"}
                title={note ? `Escuchar ${note.label}` : "Escuchar nota"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); onNoteClick?.(note, region.idx); }}
                className="pointer-events-auto absolute top-0 rounded-md bg-transparent focus:outline-none"
                style={{ left: Math.max(0, region.x - region.width / 2), width: region.width, height: Math.max(28, scoreSize.height) }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// =============================================================================
// AUDIO ENGINE HOOK
// =============================================================================
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite";

function useAudioEngine({ instrumentName = "acoustic_grand_piano" } = {}) {
  const ctxRef = useRef(null);
  const instrumentRef = useRef(null);
  const instrumentNameRef = useRef(null);
  const loadingRef = useRef(null);
  const activePlayersRef = useRef([]);
  const stopTimerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureCtx = useCallback(async () => {
    const ctx = getSharedAudioContext();
    if (!ctx) throw new Error("Web Audio API no disponible");
    ctxRef.current = ctx;
    if (ctx.state !== "running") await ctx.resume();
    if (ctx.state === "running") fireSilentUnlockPulse(ctx);
    return ctx;
  }, []);

  const ensureInstrument = useCallback(async (name) => {
    const ctx = await ensureCtx();
    if (instrumentRef.current && instrumentNameRef.current === name) return instrumentRef.current;
    if (loadingRef.current) {
      try { await loadingRef.current; } catch { /* ignore */ }
      if (instrumentRef.current && instrumentNameRef.current === name) return instrumentRef.current;
    }
    loadingRef.current = Soundfont.instrument(ctx, name, {
      soundfont: "MusyngKite",
      format: "mp3",
      nameToUrl: (n, sf, fmt) => `${SOUNDFONT_BASE_URL}/${n}-${fmt}.js`,
    });
    try {
      instrumentRef.current = await loadingRef.current;
      instrumentNameRef.current = name;
    } finally {
      loadingRef.current = null;
    }
    return instrumentRef.current;
  }, [ensureCtx]);

  useEffect(() => {
    ensureInstrument(instrumentName).catch((err) => console.warn("Instrumento no se cargó:", err));
  }, [instrumentName, ensureInstrument]);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const scheduleStop = (totalSec) => {
    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      stopTimerRef.current = null;
      setIsPlaying(false);
    }, totalSec * 1000 + 250);
  };

  const stop = useCallback(() => {
    activePlayersRef.current.forEach((p) => { try { p.stop?.(); } catch {} });
    activePlayersRef.current = [];
    clearStopTimer();
    setIsPlaying(false);
  }, []);

  const playNote = useCallback(async (midi, duration = 3.0, velocity = 0.8) => {
    stop();
    const inst = await ensureInstrument(instrumentName);
    const ctx = ctxRef.current;
    setIsPlaying(true);
    const player = inst.play(midi, ctx.currentTime, { duration, gain: velocity });
    activePlayersRef.current.push(player);
    scheduleStop(duration);
  }, [ensureInstrument, instrumentName, stop]);

  // notes = [{midi, duration}]
  const playMelodic = useCallback(async (notes, { gap = 0.04, velocity = 0.8 } = {}) => {
    stop();
    const inst = await ensureInstrument(instrumentName);
    const ctx = ctxRef.current;
    setIsPlaying(true);
    let t = ctx.currentTime + 0.05;
    let total = 0.05;
    notes.forEach((n) => {
      const d = n.duration ?? 0.55;
      const p = inst.play(n.midi, t, { duration: d, gain: velocity });
      activePlayersRef.current.push(p);
      t += d + gap;
      total += d + gap;
    });
    scheduleStop(total);
  }, [ensureInstrument, instrumentName, stop]);

  const playHarmonic = useCallback(async (midis, { duration = 2.2, velocity = 0.65 } = {}) => {
    stop();
    const inst = await ensureInstrument(instrumentName);
    const ctx = ctxRef.current;
    setIsPlaying(true);
    const t = ctx.currentTime + 0.05;
    midis.forEach((m) => {
      const p = inst.play(m, t, { duration, gain: velocity });
      activePlayersRef.current.push(p);
    });
    scheduleStop(duration);
  }, [ensureInstrument, instrumentName, stop]);

  // notes = [{midi, duration}], chords = [[midi,...], ...] mismo tamaño que notes
  const playMelodyWithHarmony = useCallback(async (notes, chords, { gap = 0.04, melodyVel = 0.85, harmonyVel = 0.4 } = {}) => {
    stop();
    const inst = await ensureInstrument(instrumentName);
    const ctx = ctxRef.current;
    setIsPlaying(true);
    let t = ctx.currentTime + 0.05;
    let total = 0.05;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const chord = chords[i] || [];
      const d = n.duration ?? 0.55;
      const mp = inst.play(n.midi, t, { duration: d, gain: melodyVel });
      activePlayersRef.current.push(mp);
      chord.forEach((m) => {
        const cp = inst.play(m, t, { duration: d, gain: harmonyVel });
        activePlayersRef.current.push(cp);
      });
      t += d + gap;
      total += d + gap;
    }
    scheduleStop(total);
  }, [ensureInstrument, instrumentName, stop]);

  // chords = [[midi,...], ...], durations = [sec, ...] mismo tamaño
  const playHarmonyOnly = useCallback(async (chords, durations, { gap = 0.04, velocity = 0.55 } = {}) => {
    stop();
    const inst = await ensureInstrument(instrumentName);
    const ctx = ctxRef.current;
    setIsPlaying(true);
    let t = ctx.currentTime + 0.05;
    let total = 0.05;
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];
      const d = durations[i] ?? 0.55;
      chord.forEach((m) => {
        const p = inst.play(m, t, { duration: d, gain: velocity });
        activePlayersRef.current.push(p);
      });
      t += d + gap;
      total += d + gap;
    }
    scheduleStop(total);
  }, [ensureInstrument, instrumentName, stop]);

  useEffect(() => () => {
    activePlayersRef.current.forEach((p) => { try { p.stop?.(); } catch {} });
    activePlayersRef.current = [];
    clearStopTimer();
  }, []);

  return { isPlaying, playNote, playMelodic, playHarmonic, playMelodyWithHarmony, playHarmonyOnly, stop };
}

// =============================================================================
// COMPONENTES UI COMPARTIDOS
// =============================================================================
function ActionButton({ children, onClick, disabled, title, active }) {
  const base = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50";
  const cls = active
    ? `${base} aural-active`
    : `${base} border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50`;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick?.(); }} disabled={disabled} title={title} className={cls}>
      {children}
    </button>
  );
}

function SelectionChip({ active, onClick, children, disabled, title }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      disabled={disabled}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "aural-active" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {children}
    </span>
  );
}

function CircleButton({ children, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      disabled={disabled}
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function OctaveButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      title={title}
      className="inline-flex h-7 items-center justify-center rounded-full border border-zinc-300 bg-white px-2 text-[10px] font-bold text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

function TransposeControls({ onUp, onDown, onOctaveUp, onOctaveDown, onReset }) {
  return (
    <div className="flex items-center gap-1">
      <CircleButton onClick={onUp} title="Subir ½ tono"><ArrowUpIcon className="h-3.5 w-3.5" /></CircleButton>
      <CircleButton onClick={onDown} title="Bajar ½ tono"><ArrowDownIcon className="h-3.5 w-3.5" /></CircleButton>
      <OctaveButton onClick={onOctaveUp} title="Subir una octava">8↑</OctaveButton>
      <OctaveButton onClick={onOctaveDown} title="Bajar una octava">8↓</OctaveButton>
      <CircleButton onClick={onReset} title="Volver al centro"><ResetIcon className="h-3.5 w-3.5" /></CircleButton>
    </div>
  );
}

// Botón redondo "+" / "-" para abrir/cerrar info teórica
function InfoToggleButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      title={open ? "Ocultar información" : "Más información"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50"
    >
      {open ? <MinusIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

function InfoPanel({ children }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-[11px] leading-relaxed text-zinc-700">
      {children}
    </div>
  );
}

// Botón ascendente/descendente toggleable, igual que en intervalos
function DirectionToggle({ reversed, onToggle }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
      title={reversed ? "Cambiar a ascendente" : "Cambiar a descendente"}
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold transition ${reversed ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"}`}
    >
      {reversed ? "↘ Descendente" : "↗ Ascendente"}
    </button>
  );
}

// =============================================================================
// FORMULA CARD (Fórmulas a la tónica)
// =============================================================================
function FormulaCard({ formula, rootMidi, onRootChange, audio, focused, onFocus }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const tonicEs = tonicEsLabel(rootMidi);

  // Notas absolutas
  const melodyMidis = useMemo(() => applyIntervals(rootMidi, formula.melody), [formula, rootMidi]);
  const harmonyMidis = useMemo(
    () => formula.harmony.map((chord) => chord.map((semi) => rootMidi + semi)),
    [formula, rootMidi]
  );

  // Para el render: secuencia VexFlow
  const tonicName = NOTE_NAMES_SHARP[((rootMidi % 12) + 12) % 12];
  const sequence = useMemo(() => {
    const flats = preferFlatsFor(tonicName);
    return melodyMidis.map((m) => midiToSpelledNote(m, flats));
  }, [melodyMidis, tonicName]);

  // Para reproducción: notes con duración
  const melodyNotes = useMemo(
    () => melodyMidis.map((midi, i) => ({ midi, duration: formula.soundDurations[i] ?? 0.55 })),
    [melodyMidis, formula]
  );

  const transpose = (n) => { onRootChange(rootMidi + n); onFocus?.(); };

  const handleFirstNote = () => { onFocus?.(); audio.playNote(clampToSinging(melodyMidis[0]), 3.0); };
  const handleFormula = () => { onFocus?.(); audio.playMelodic(melodyNotes); };
  const handleHarmony = () => {
    onFocus?.();
    audio.playHarmonyOnly(harmonyMidis, formula.soundDurations);
  };
  const handleBoth = () => { onFocus?.(); audio.playMelodyWithHarmony(melodyNotes, harmonyMidis); };
  const handleNoteClick = (note) => { onFocus?.(); audio.playNote(clampToSinging(note.midi), 3.0); };

  return (
    <div
      className={`model-card flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm transition ${focused ? "focused" : "border-zinc-200"}`}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">{formula.label}</span>
          <Badge>raíz {tonicEs}</Badge>
          <Badge>{formula.formula}</Badge>
          <InfoToggleButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />
        </div>
        <TransposeControls
          onUp={() => transpose(1)}
          onDown={() => transpose(-1)}
          onOctaveUp={() => transpose(12)}
          onOctaveDown={() => transpose(-12)}
          onReset={() => onRootChange(60)}
        />
      </div>

      {/* Partitura */}
      <SmallScore sequence={sequence} focused={focused} compact onNoteClick={handleNoteClick} />

      {/* Línea de armonía (etiquetas romanas debajo del pentagrama) */}
      <div className="flex justify-around px-3 -mt-1 text-[11px] font-semibold tracking-wider text-zinc-500">
        {formula.harmonyLabels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>

      {/* Botones */}
      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        <ActionButton onClick={handleFormula} title="Tocar la fórmula"><PlayIcon className="h-3 w-3" /> Fórmula</ActionButton>
        <ActionButton onClick={handleHarmony} title="Tocar la armonía"><ChordIcon className="h-3 w-3" /> Armonía</ActionButton>
        <ActionButton onClick={handleBoth} title="Fórmula y armonía en simultáneo"><PlayIcon className="h-3 w-3" /> Ambas</ActionButton>
        {audio.isPlaying ? (
          <ActionButton onClick={audio.stop} title="Detener"><StopIcon className="h-3 w-3" /> Detener</ActionButton>
        ) : null}
      </div>

      {/* Info teórica */}
      {infoOpen ? <InfoPanel>{formula.info}</InfoPanel> : null}
    </div>
  );
}

// =============================================================================
// CHORD CARD (Fórmulas a la fundamental + Arpegios)
// =============================================================================
function ChordCard({ chord, rootMidi, onRootChange, audio, focused, onFocus, pillarMode = "arpeggio" }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [inversionIdx, setInversionIdx] = useState(0);
  const [approachIdx, setApproachIdx] = useState(0);
  const [reversed, setReversed] = useState(false);
  const tonicEs = tonicEsLabel(rootMidi);
  const tonicName = NOTE_NAMES_SHARP[((rootMidi % 12) + 12) % 12];

  const chordMidis = useMemo(() => applyIntervals(rootMidi, chord.intervals), [chord, rootMidi]);

  // Para arpegios: secuencia según inversión + dirección
  const arpeggioMidis = useMemo(() => {
    const inv = chord.inversions[inversionIdx] ?? chord.inversions[0];
    let seq = inv.intervals.map((i) => rootMidi + i);
    if (reversed) seq = [...seq].reverse();
    return seq;
  }, [chord, rootMidi, inversionIdx, reversed]);

  // Para fórmulas a la fundamental
  const approachMidis = useMemo(() => {
    const ap = chord.approach[approachIdx] ?? chord.approach[0];
    return ap.intervals.map((i) => rootMidi + i);
  }, [chord, rootMidi, approachIdx]);

  const displayMidis = pillarMode === "approach" ? approachMidis : arpeggioMidis;

  const sequence = useMemo(() => {
    const flats = preferFlatsFor(tonicName);
    return displayMidis.map((m) => midiToSpelledNote(m, flats));
  }, [displayMidis, tonicName]);

  const transpose = (n) => { onRootChange(rootMidi + n); onFocus?.(); };

  const handleFirstNote = () => { onFocus?.(); audio.playNote(clampToSinging(displayMidis[0]), 3.0); };
  const handleMelodic = () => {
    onFocus?.();
    const notes = displayMidis.map((midi) => ({ midi, duration: 0.55 }));
    audio.playMelodic(notes);
  };
  const handleHarmonic = () => { onFocus?.(); audio.playHarmonic(chordMidis); };
  const handleApproachWithChord = () => {
    onFocus?.();
    const notes = approachMidis.map((midi) => ({ midi, duration: 0.55 }));
    const chords = approachMidis.map(() => chordMidis);
    audio.playMelodyWithHarmony(notes, chords);
  };
  const handleNoteClick = (note) => { onFocus?.(); audio.playNote(clampToSinging(note.midi), 3.0); };

  return (
    <div
      className={`model-card flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm transition ${focused ? "focused" : "border-zinc-200"}`}
      onClick={onFocus}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">
            {chord.name}<span className="ml-1 font-mono text-[11px] text-zinc-500">{chord.symbol}</span>
          </span>
          <Badge>raíz {tonicEs}</Badge>
          <InfoToggleButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />
        </div>
        <div className="flex items-center gap-1">
          {pillarMode === "arpeggio" && chord.inversions.length > 1 ? (
            <DirectionToggle reversed={reversed} onToggle={() => setReversed((r) => !r)} />
          ) : null}
          <TransposeControls
            onUp={() => transpose(1)}
            onDown={() => transpose(-1)}
            onOctaveUp={() => transpose(12)}
            onOctaveDown={() => transpose(-12)}
            onReset={() => onRootChange(60)}
          />
        </div>
      </div>

      {/* Selector de inversión / aproximación */}
      {pillarMode === "arpeggio" && chord.inversions.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {chord.inversions.map((inv, i) => (
            <SelectionChip key={i} active={inversionIdx === i} onClick={() => setInversionIdx(i)}>
              {inv.label}
            </SelectionChip>
          ))}
        </div>
      ) : null}
      {pillarMode === "approach" ? (
        <div className="flex flex-wrap gap-1">
          {chord.approach.map((a, i) => (
            <SelectionChip key={i} active={approachIdx === i} onClick={() => setApproachIdx(i)}>
              {a.label}
            </SelectionChip>
          ))}
        </div>
      ) : null}

      <SmallScore sequence={sequence} focused={focused} compact onNoteClick={handleNoteClick} />

      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        {pillarMode === "arpeggio" ? (
          <>
            <ActionButton onClick={handleMelodic} title="Arpegio melódico"><PlayIcon className="h-3 w-3" /> Melódico</ActionButton>
            <ActionButton onClick={handleHarmonic} title="Acorde en bloque"><ChordIcon className="h-3 w-3" /> Armónico</ActionButton>
          </>
        ) : (
          <>
            <ActionButton onClick={handleMelodic} title="Tocar la fórmula"><PlayIcon className="h-3 w-3" /> Fórmula</ActionButton>
            <ActionButton onClick={handleHarmonic} title="Tocar el acorde en bloque"><ChordIcon className="h-3 w-3" /> Armonía</ActionButton>
            <ActionButton onClick={handleApproachWithChord} title="Fórmula y armonía en simultáneo"><PlayIcon className="h-3 w-3" /> Ambas</ActionButton>
          </>
        )}
        {audio.isPlaying ? (
          <ActionButton onClick={audio.stop} title="Detener"><StopIcon className="h-3 w-3" /> Detener</ActionButton>
        ) : null}
      </div>

      {infoOpen ? <InfoPanel>{chord.info}</InfoPanel> : null}
    </div>
  );
}

// =============================================================================
// SCALE CARD (Escalas)
// =============================================================================
function ScaleCard({ scale, rootMidi, onRootChange, audio, focused, onFocus }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [reversed, setReversed] = useState(false);
  const tonicEs = tonicEsLabel(rootMidi);
  const tonicName = NOTE_NAMES_SHARP[((rootMidi % 12) + 12) % 12];

  const scaleMidis = useMemo(() => {
    let seq = applyIntervals(rootMidi, [...scale.intervals, 12]);
    if (reversed) seq = [...seq].reverse();
    return seq;
  }, [scale, rootMidi, reversed]);

  const sequence = useMemo(() => {
    const flats = preferFlatsFor(tonicName);
    return scaleMidis.map((m) => midiToSpelledNote(m, flats));
  }, [scaleMidis, tonicName]);

  const transpose = (n) => { onRootChange(rootMidi + n); onFocus?.(); };

  const handleFirstNote = () => { onFocus?.(); audio.playNote(clampToSinging(scaleMidis[0]), 3.0); };
  const handleMelodic = () => {
    onFocus?.();
    audio.playMelodic(scaleMidis.map((midi) => ({ midi, duration: 0.45 })));
  };
  const handleHarmonic = () => { onFocus?.(); audio.playHarmonic(scaleMidis); };
  const handleNoteClick = (note) => { onFocus?.(); audio.playNote(clampToSinging(note.midi), 3.0); };

  return (
    <div
      className={`model-card flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm transition ${focused ? "focused" : "border-zinc-200"}`}
      onClick={onFocus}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">{scale.name}</span>
          <Badge>raíz {tonicEs}</Badge>
          <InfoToggleButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />
        </div>
        <div className="flex items-center gap-1">
          <DirectionToggle reversed={reversed} onToggle={() => setReversed((r) => !r)} />
          <TransposeControls
            onUp={() => transpose(1)}
            onDown={() => transpose(-1)}
            onOctaveUp={() => transpose(12)}
            onOctaveDown={() => transpose(-12)}
            onReset={() => onRootChange(60)}
          />
        </div>
      </div>

      <SmallScore sequence={sequence} focused={focused} compact onNoteClick={handleNoteClick} />

      <div className="flex flex-wrap gap-1.5">
        <ActionButton onClick={handleFirstNote} title="Reproducir la primera nota">
          <DotIcon className="h-3 w-3" /> 1ª nota
        </ActionButton>
        <ActionButton onClick={handleMelodic} title="Tocar la escala"><PlayIcon className="h-3 w-3" /> Melódico</ActionButton>
        <ActionButton onClick={handleHarmonic} title="Acorde en bloque"><ChordIcon className="h-3 w-3" /> Armónico</ActionButton>
        {audio.isPlaying ? (
          <ActionButton onClick={audio.stop} title="Detener"><StopIcon className="h-3 w-3" /> Detener</ActionButton>
        ) : null}
      </div>

      {infoOpen ? (
        <InfoPanel>
          <p className="mb-1 font-mono text-[10px] text-zinc-600">{scale.formula}</p>
          {scale.aliases?.length ? (
            <p className="mb-1 text-zinc-600">También: {scale.aliases.join(" · ")}</p>
          ) : null}
          <p>{scale.info}</p>
        </InfoPanel>
      ) : null}
    </div>
  );
}

// =============================================================================
// SECCIONES POR PILAR
// =============================================================================
function TonicaSection({ rootMidi, onRootChange, tonicMode, onModeChange, audio, level, focusedId, setFocusedId }) {
  const formulas = (TONIC_FORMULAS[tonicMode] || []).filter((f) => f.level <= level);
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {Object.entries(TONIC_MODES).map(([k, v]) => (
          <SelectionChip key={k} active={tonicMode === k} onClick={() => onModeChange(k)}>{v.label}</SelectionChip>
        ))}
      </div>

      {formulas.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          Sube de nivel para ver más fórmulas de este modo.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {formulas.map((f) => (
          <FormulaCard
            key={f.id}
            formula={f}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
            audio={audio}
            focused={focusedId === f.id}
            onFocus={() => setFocusedId(f.id)}
          />
        ))}
      </div>
    </section>
  );
}

function FundamentalSection({ rootMidi, onRootChange, audio, level, focusedId, setFocusedId }) {
  const chords = CHORDS.filter((c) => c.level <= level);
  return (
    <section>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chords.map((c) => (
          <ChordCard
            key={c.id}
            chord={c}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
            audio={audio}
            focused={focusedId === c.id}
            onFocus={() => setFocusedId(c.id)}
            pillarMode="approach"
          />
        ))}
      </div>
    </section>
  );
}

function EscalasSection({ rootMidi, onRootChange, audio, level, focusedId, setFocusedId }) {
  const scales = SCALES.filter((s) => s.level <= level);
  const byFamily = {};
  scales.forEach((s) => {
    if (!byFamily[s.family]) byFamily[s.family] = [];
    byFamily[s.family].push(s);
  });
  const orderedFamilies = [
    "diatonic", "majorModes", "melodicMinorModes", "harmonicMinorModes",
    "pentatonic", "hexatonic", "octatonic", "messiaen", "synthetic", "worldApprox",
  ];

  return (
    <section>
      {orderedFamilies.map((fam) => {
        const items = byFamily[fam];
        if (!items?.length) return null;
        return (
          <div key={fam} className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                {SCALE_FAMILIES[fam].label}
              </h2>
              <span className="text-[10px] text-zinc-400">{items.length}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <ScaleCard
                  key={s.id}
                  scale={s}
                  rootMidi={rootMidi}
                  onRootChange={onRootChange}
                  audio={audio}
                  focused={focusedId === s.id}
                  onFocus={() => setFocusedId(s.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ArpegiosSection({ rootMidi, onRootChange, audio, level, focusedId, setFocusedId }) {
  const chords = CHORDS.filter((c) => c.level <= level);
  return (
    <section>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chords.map((c) => (
          <ChordCard
            key={c.id}
            chord={c}
            rootMidi={rootMidi}
            onRootChange={onRootChange}
            audio={audio}
            focused={focusedId === c.id}
            onFocus={() => setFocusedId(c.id)}
            pillarMode="arpeggio"
          />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// HEADER + PILLAR DESCRIPTION
// =============================================================================
const PILLAR_LABELS = {
  tonica:      "Fórmulas a la tónica",
  fundamental: "Fórmulas a la fundamental",
  escalas:     "Escalas",
  arpegios:    "Arpegios",
};

const PILLAR_DESCRIPTIONS = {
  tonica:      "Cada fórmula asocia un grado de la escala con la tónica siguiendo el camino melódico más corto. Establece la tonalidad, escucha la fórmula, intenta cantarla; luego compárala con la armonía que la acompaña.",
  fundamental: "Identifica cualquier nota de un acorde y condúcela melódicamente hasta su fundamental. La fórmula puede sonar sola, con el acorde de bloque, o en simultáneo con él.",
  escalas:     "Catálogo extendido: diatónicas, modos del mayor y los menores, pentatónicas, hexáfonas y octatónicas, modos de Messiaen, sintéticas, y aproximaciones temperadas de tradiciones no-occidentales.",
  arpegios:    "Cada acorde nota por nota, en sus inversiones, ascendente o descendente. El acorde en bloque se reproduce con botón aparte para confirmar la sonoridad armónica.",
};

const LEVEL_DESCRIPTIONS = {
  1: "Tónica y dominante (V → I), tríadas básicas mayor y menor.",
  2: "Modos básicos del mayor; modos diatónicos más usados; tríadas con disminuido y aumentado.",
  3: "Subdominante y descenso completo del tetracordo; séptimas básicas; pentatónicas y bebop dominante.",
  4: "Locrio; modos diatónicos completos; pentatónicas asiáticas; Maj7; menor armónica completa.",
  5: "Modos del menor armónico (frigio dominante, dórico #4); ø7; octatónicas.",
  6: "Modos del menor melódico (lidio dominante, alterada); dim7, mMaj7; sintéticas (doble armónica, húngara menor).",
  7: "Modos exóticos y aproximaciones no-occidentales; descenso natural completo.",
  8: "Repertorio completo, escalas y acordes alterados.",
};

function Header({ rootMidi, onRootChange, instrument, onInstrumentChange }) {
  return (
    <header className="border-b border-zinc-200 bg-zinc-50/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <img src="/favicon.png" alt="Método Aural" className="h-12 w-12 rounded-lg border border-zinc-200" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Método Aural · Modelos sonoros
              </p>
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Música tonal</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm">
                Explora cada modelo: escucha la primera nota, intenta cantarlo, escúchalo completo
                melódica o armónicamente. Toca cualquier nota del pentagrama para reproducirla aislada.
              </p>
            </div>
          </div>

          {/* Selectores: tónica + instrumento */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">Tónica</span>
              <select
                value={NOTE_NAMES_SHARP[((rootMidi % 12) + 12) % 12]}
                onChange={(e) => {
                  const idx = NOTE_NAMES_SHARP.indexOf(e.target.value);
                  if (idx >= 0) onRootChange(60 + idx);
                }}
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs"
              >
                {NOTE_NAMES_SHARP.map((n) => (
                  <option key={n} value={n}>{NOTE_ES[n] || n}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">Sonido</span>
              <select
                value={instrument}
                onChange={(e) => onInstrumentChange(e.target.value)}
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs"
              >
                <option value="acoustic_grand_piano">Piano de cola</option>
                <option value="electric_piano_1">Piano eléctrico</option>
                <option value="string_ensemble_1">Cuerdas</option>
                <option value="choir_aahs">Coro</option>
                <option value="flute">Flauta</option>
                <option value="violin">Violín</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}

function PillarTabs({ activePillar, onChange }) {
  return (
    <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(PILLAR_LABELS).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${activePillar === id ? "aural-black-button" : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function LevelBar({ level, onLevelChange }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Nivel</span>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onLevelChange(n)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${level === n ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"}`}
          >
            Nivel {romanize(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

function PillarDescriptionCard({ activePillar, level }) {
  return (
    <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Nivel {romanize(level)}</p>
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">{PILLAR_LABELS[activePillar]}</h2>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-sm">
            {PILLAR_DESCRIPTIONS[activePillar]}
            <span className="ml-1 text-zinc-500">{LEVEL_DESCRIPTIONS[level]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================
export default function App() {
  const [activePillar, setActivePillar] = useState("tonica");
  const [rootMidi, setRootMidi] = useState(60);
  const [level, setLevel] = useState(3);
  const [instrument, setInstrument] = useState("acoustic_grand_piano");
  const [tonicMode, setTonicMode] = useState("major");
  const [focusedId, setFocusedId] = useState(null);

  const audio = useAudioEngine({ instrumentName: instrument });

  // Si cambia el pilar, limpiamos el focus.
  useEffect(() => { setFocusedId(null); }, [activePillar]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <AppThemeStyles />
      <Header
        rootMidi={rootMidi}
        onRootChange={setRootMidi}
        instrument={instrument}
        onInstrumentChange={setInstrument}
      />
      <PillarTabs activePillar={activePillar} onChange={setActivePillar} />
      <LevelBar level={level} onLevelChange={setLevel} />
      <PillarDescriptionCard activePillar={activePillar} level={level} />

      <main className="mx-auto mt-5 max-w-6xl px-4 sm:px-6">
        {activePillar === "tonica" ? (
          <TonicaSection
            rootMidi={rootMidi}
            onRootChange={setRootMidi}
            tonicMode={tonicMode}
            onModeChange={setTonicMode}
            audio={audio}
            level={level}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
          />
        ) : null}
        {activePillar === "fundamental" ? (
          <FundamentalSection
            rootMidi={rootMidi}
            onRootChange={setRootMidi}
            audio={audio}
            level={level}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
          />
        ) : null}
        {activePillar === "escalas" ? (
          <EscalasSection
            rootMidi={rootMidi}
            onRootChange={setRootMidi}
            audio={audio}
            level={level}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
          />
        ) : null}
        {activePillar === "arpegios" ? (
          <ArpegiosSection
            rootMidi={rootMidi}
            onRootChange={setRootMidi}
            audio={audio}
            level={level}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
          />
        ) : null}
      </main>

      <footer className="mx-auto mt-10 max-w-6xl px-4 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
        Método Aural · Modelos sonoros para música tonal
      </footer>
    </div>
  );
}
