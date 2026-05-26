// Fórmulas de conducción a la tónica.
// Datos extraídos del PDF "Fórmulas de conducción a la tónica" - Método Aural.
//
// Cada fórmula tiene:
// - id, degrees (ej: "2-1"), degree (grado inicial)
// - melody: array de semitonos relativos a la tónica, en orden.
//   La última nota siempre es la tónica (0 o 12).
// - harmony: array de acordes (arrays de semitonos relativos a la tónica)
//   que acompañan cada nota de la melody. Mismo tamaño que melody.
// - harmonyLabels: nombres romanos de los acordes (para mostrar debajo)
//
// Las armonías son las EXACTAS del PDF, no inferidas.

// Tríadas en función de la tónica
const I_MAJ  = [0, 4, 7];
const IV_MAJ = [-7, -3, 0]; // F-A-C cuando tónica=C: f3-a3-c4 (en grave para no chocar con melodía)
const V_MAJ  = [-5, -1, 2]; // G-B-D cuando tónica=C
const i_min  = [0, 3, 7];
const iv_min = [-7, -4, 0]; // f-ab-c (iv menor)
const V_in_min = [-5, -1, 2]; // V mayor (con sensible alzada en menor armónico)
const ii_dim = [-10, -7, -4]; // d-f-ab (ii° en menor)
const ii_maj = [-10, -7, -3]; // d-f-a (ii en mayor)

// ============================================================
// MODO MAYOR
// ============================================================
export const TONIC_FORMULAS_MAJOR = [
  {
    id: "maj-1",
    degree: 1,
    degrees: "1",
    melody: [0],
    harmony: [I_MAJ],
    harmonyLabels: ["I"],
  },
  {
    id: "maj-2",
    degree: 2,
    degrees: "2 - 1",
    melody: [2, 0],
    harmony: [V_MAJ, I_MAJ],
    harmonyLabels: ["V", "I"],
  },
  {
    id: "maj-3",
    degree: 3,
    degrees: "3 - 2 - 1",
    melody: [4, 2, 0],
    harmony: [I_MAJ, V_MAJ, I_MAJ],
    harmonyLabels: ["I", "V", "I"],
  },
  {
    id: "maj-4",
    degree: 4,
    degrees: "4 - 3 - 2 - 1",
    melody: [5, 4, 2, 0],
    harmony: [IV_MAJ, I_MAJ, V_MAJ, I_MAJ],
    harmonyLabels: ["IV", "I", "V", "I"],
  },
  {
    id: "maj-5",
    degree: 5,
    degrees: "5 - 1",
    melody: [7, 12],
    harmony: [V_MAJ, I_MAJ],
    harmonyLabels: ["V", "I"],
  },
  {
    id: "maj-6",
    degree: 6,
    degrees: "6 - 5 - 1",
    melody: [9, 7, 12],
    harmony: [IV_MAJ, V_MAJ, I_MAJ],
    harmonyLabels: ["IV", "V", "I"],
  },
  {
    id: "maj-7",
    degree: 7,
    degrees: "7 - 1",
    melody: [11, 12],
    harmony: [V_MAJ, I_MAJ],
    harmonyLabels: ["V", "I"],
  },
];

// ============================================================
// MENOR ARMÓNICA
// ============================================================
export const TONIC_FORMULAS_HARMONIC_MINOR = [
  {
    id: "hm-1",
    degree: 1,
    degrees: "1",
    melody: [0],
    harmony: [i_min],
    harmonyLabels: ["i"],
  },
  {
    id: "hm-2",
    degree: 2,
    degrees: "2 - 1",
    melody: [2, 0],
    harmony: [V_in_min, i_min],
    harmonyLabels: ["V", "i"],
  },
  {
    id: "hm-3",
    degree: 3,
    degrees: "♭3 - 2 - 1",
    melody: [3, 2, 0],
    harmony: [i_min, V_in_min, i_min],
    harmonyLabels: ["i", "V", "i"],
  },
  {
    id: "hm-4",
    degree: 4,
    degrees: "4 - ♭3 - 2 - 1",
    melody: [5, 3, 2, 0],
    harmony: [iv_min, i_min, V_in_min, i_min],
    harmonyLabels: ["iv", "i", "V", "i"],
  },
  {
    id: "hm-5",
    degree: 5,
    degrees: "5 - 1",
    melody: [7, 12],
    harmony: [V_in_min, i_min],
    harmonyLabels: ["V", "i"],
  },
  {
    id: "hm-6",
    degree: 6,
    degrees: "♭6 - 5 - 1",
    melody: [8, 7, 12],
    harmony: [iv_min, V_in_min, i_min],
    harmonyLabels: ["iv", "V", "i"],
  },
  {
    id: "hm-7",
    degree: 7,
    degrees: "7 - 1",
    melody: [11, 12],
    harmony: [V_in_min, i_min],
    harmonyLabels: ["V", "i"],
  },
];

// ============================================================
// MENOR MELÓDICA ASCENDENTE (6° y 7° alzados)
// ============================================================
export const TONIC_FORMULAS_MELODIC_MINOR_ASC = [
  {
    id: "mma-6",
    degree: 6,
    degrees: "6 - 7 - 1",
    melody: [9, 11, 12],
    harmony: [ii_maj, V_in_min, i_min],
    harmonyLabels: ["ii", "V", "i"],
  },
  {
    id: "mma-7",
    degree: 7,
    degrees: "7 - 1",
    melody: [11, 12],
    harmony: [V_in_min, i_min],
    harmonyLabels: ["V", "i"],
  },
];

// ============================================================
// MENOR NATURAL / MELÓDICA DESCENDENTE (6° y 7° menores)
// ============================================================
export const TONIC_FORMULAS_NATURAL_MINOR = [
  {
    id: "nm-6",
    degree: 6,
    degrees: "♭6 - 5 - 1",
    melody: [8, 7, 12],
    harmony: [ii_dim, V_in_min, i_min],
    harmonyLabels: ["ii°", "V", "i"],
  },
  {
    id: "nm-7",
    degree: 7,
    degrees: "♭7 - ♭6 - 5 - 1",
    melody: [10, 8, 7, 12],
    // v6 = v en primera inversión: G-Bb-D, con Bb como bajo → en C menor: bb-d-g (Bb es ♭3 del Sol menor)
    // iv6 = iv en primera inversión: F-Ab-C, con Ab como bajo
    harmony: [
      [-9, -5, -2], // v⁶: bb2 d3 g3 (G menor en 1ª inv)
      [-8, -5, 0],  // iv⁶: ab2 c3 f3 (F menor en 1ª inv)
      V_in_min,
      i_min,
    ],
    harmonyLabels: ["v⁶", "iv⁶", "V", "i"],
  },
];

// ============================================================
// HELPERS
// ============================================================

// Modo activo → grupo de fórmulas
export function getFormulasByMode(mode) {
  switch (mode) {
    case "major":
      return TONIC_FORMULAS_MAJOR;
    case "harmonicMinor":
      return TONIC_FORMULAS_HARMONIC_MINOR;
    case "melodicMinorAsc":
      return TONIC_FORMULAS_MELODIC_MINOR_ASC;
    case "naturalMinor":
      return TONIC_FORMULAS_NATURAL_MINOR;
    default:
      return TONIC_FORMULAS_MAJOR;
  }
}

// Construye la cadencia I-IV-V-I (mayor) o i-iv-V-i (menor)
// para "establecer tonalidad" antes de tocar la fórmula.
export function buildEstablishingCadence(rootMidi, mode) {
  const isMajor = mode === "major";
  // tónica en la octava grave para no chocar con la fórmula
  const base = rootMidi - 12;
  if (isMajor) {
    return [
      [base, base + 4, base + 7],     // I
      [base + 5, base + 9, base + 12], // IV
      [base + 7, base + 11, base + 14], // V
      [base, base + 4, base + 7],     // I
    ];
  }
  return [
    [base, base + 3, base + 7],     // i
    [base + 5, base + 8, base + 12], // iv
    [base + 7, base + 11, base + 14], // V (con sensible)
    [base, base + 3, base + 7],     // i
  ];
}

// Modos disponibles para el selector
export const TONIC_MODES = {
  major: { label: "Mayor" },
  harmonicMinor: { label: "Menor armónica" },
  melodicMinorAsc: { label: "Menor melódica asc." },
  naturalMinor: { label: "Menor natural / desc." },
};
