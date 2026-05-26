// Catálogo de calidades de acorde. Cada entrada describe la estructura intervalica,
// los arpegios (con sus inversiones), las fórmulas de conducción a la fundamental,
// y la información teórica didáctica.
//
// intervals: semitonos desde la fundamental.
// arpeggioInversions: cada inversión es un array de semitonos relativos a la nota más grave.
// approachFormulas: una fórmula por nota del acorde (qué nota se identifica → fórmula que la lleva a la fundamental).
//   - target: qué función tiene la nota inicial (1=fund, 3=tercera, 5=quinta, 7=séptima)
//   - intervals: secuencia de semitonos (relativos a la fundamental del acorde) que componen la fórmula.
//     La última nota siempre debe coincidir con la fundamental del acorde, en cualquier octava.

export const CHORD_FAMILIES = {
  triad: { label: "Tríadas", color: "ink" },
  triadAlt: { label: "Tríadas alteradas", color: "ink" },
  seventh: { label: "Séptimas", color: "mint" },
  seventhAlt: { label: "Séptimas alteradas", color: "lime" },
};

export const CHORDS = [
  // ===== TRÍADAS BÁSICAS =====
  {
    id: "M",
    name: "Mayor",
    symbol: "M",
    family: "triad",
    level: 1,
    intervals: [0, 4, 7],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 4, 7, 12] },
      { label: "1ª inversión", intervals: [4, 7, 12, 16] },
      { label: "2ª inversión", intervals: [7, 12, 16, 19] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª", intervals: [4, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 4, 0], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (a fundamental)", intervals: [7, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - 5 (tríada mayor en posición fundamental).",
      function: "Acorde de reposo. Aparece como I, IV y V en el modo mayor.",
      origin:
        "Estructura fundamental de la armonía tonal occidental. Su consonancia se sustenta en la serie armónica natural.",
      examples: [
        "Bach – cualquier final de coral",
        "Beethoven – Sinfonía Nº9, mov. IV (apertura del himno)",
      ],
      relations: ["Es el arpegio sobre el que se construyen jónico, lidio y mixolidio."],
    },
  },
  {
    id: "m",
    name: "Menor",
    symbol: "m",
    family: "triad",
    level: 1,
    intervals: [0, 3, 7],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 7, 12] },
      { label: "1ª inversión", intervals: [3, 7, 12, 15] },
      { label: "2ª inversión", intervals: [7, 12, 15, 19] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 3, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª menor", intervals: [3, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 3, 0], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (a fundamental)", intervals: [7, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - 5 (tríada menor en posición fundamental).",
      function: "Aparece como ii, iii y vi en el modo mayor; como i, iv, v en el menor natural.",
      origin:
        "Tercera menor sobre la fundamental: la sonoridad central del modo menor en toda la práctica común.",
      examples: [
        "Mozart – Sinfonía Nº40 en sol menor",
        "Chopin – Preludio en mi menor Op. 28 Nº4",
      ],
      relations: ["Es el arpegio sobre el que se construyen dórico, frigio y eólico."],
    },
  },
  {
    id: "dim",
    name: "Disminuido",
    symbol: "dim",
    family: "triad",
    level: 2,
    intervals: [0, 3, 6],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 6, 12] },
      { label: "1ª inversión", intervals: [3, 6, 12, 15] },
      { label: "2ª inversión", intervals: [6, 12, 15, 18] },
    ],
    approachFormulas: [
      // En disminuido la fund se llega vía sexta descendente desde la 5ª (PDF Modelos Sonoros II)
      { target: 3, label: "Desde la 3ª (no es del tritono)", intervals: [3, 0, 6, 0], duration: ["q", "q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (vía tritono)", intervals: [6, 3, 0], duration: ["q", "q", "h"] },
      { target: 1, label: "Desde la fundamental (6ª desc.)", intervals: [12, 6, 3, 0], duration: ["q", "q", "q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - b5. Dos terceras menores apiladas. El tritono entre 1 y b5 es su eje.",
      function: "Función dominante: aparece como vii° en el mayor y resuelve a la tónica. En el menor: ii°.",
      origin:
        "Aparece sistemáticamente desde el barroco como sustituto del dominante en estado de inversión.",
      examples: [
        "Bach – Tocata y fuga en re menor (acordes de aproximación)",
        "Schubert – Erlkönig (recursos dramáticos)",
      ],
      relations: ["Coincide con grados 2-4-6 del menor armónico y melódico ascendente."],
    },
  },
  {
    id: "aug",
    name: "Aumentado",
    symbol: "aum",
    family: "triad",
    level: 2,
    intervals: [0, 4, 8],
    arpeggioInversions: [{ label: "Posición única (simétrica)", intervals: [0, 4, 8, 12] }],
    approachFormulas: [
      { target: 1, label: "Estructura completa (sin resolución)", intervals: [0, 4, 8, 12], duration: ["q", "q", "q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - #5. Dos terceras mayores apiladas. Simetría perfecta cada 4 semitonos.",
      function:
        "Aislado no establece fundamental perceptible. Se usa como tensión o como acorde de paso entre dos tríadas.",
      origin:
        "Cromatismo del romanticismo tardío. Liszt, Wagner y Debussy explotan su ambigüedad tonal.",
      examples: [
        "Liszt – Fausto, apertura",
        "Wagner – Tristán e Isolda (cromatismo aumentado)",
      ],
      relations: ["Aparece como III+ en el menor armónico. Se relaciona con la escala de tonos enteros."],
    },
  },
  // ===== SÉPTIMAS BÁSICAS =====
  {
    id: "dom7",
    name: "Dominante",
    symbol: "7",
    family: "seventh",
    level: 3,
    intervals: [0, 4, 7, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 4, 7, 10, 12] },
      { label: "1ª inversión", intervals: [4, 7, 10, 12, 16] },
      { label: "2ª inversión", intervals: [7, 10, 12, 16, 19] },
      { label: "3ª inversión", intervals: [10, 12, 16, 19, 22] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª", intervals: [4, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 4, 0], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (a fund.)", intervals: [7, 12], duration: ["q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - 5 - b7. Tríada mayor + séptima menor. Tritono entre 3 y b7.",
      function:
        "El motor dominante del sistema tonal. V7→I es la cadencia armónica más estable de la música tonal.",
      origin:
        "Codificado por Rameau en el siglo XVIII como el acorde direccional por excelencia.",
      examples: [
        "Cualquier cadencia V7-I en Mozart, Haydn, Schubert",
        "Blues estándar (todas las funciones son acordes de dominante)",
      ],
      relations: ["Vive dentro del modo mixolidio y de la escala alterada. En jazz se sustituye por bII7 (sustitución tritonal)."],
    },
  },
  {
    id: "m7",
    name: "Menor séptima",
    symbol: "m7",
    family: "seventh",
    level: 3,
    intervals: [0, 3, 7, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 7, 10, 12] },
      { label: "1ª inversión", intervals: [3, 7, 10, 12, 15] },
      { label: "2ª inversión", intervals: [7, 10, 12, 15, 19] },
      { label: "3ª inversión", intervals: [10, 12, 15, 19, 22] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 3, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª menor", intervals: [3, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 3, 0], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (a fund.)", intervals: [7, 12], duration: ["q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - 5 - b7. Tríada menor + séptima menor.",
      function: "Función predominante (ii7) y subdominante (iv7). En jazz modal, acorde estable de dórico.",
      origin:
        "Sistemático desde el barroco como ii7. Central en la armonía del jazz desde mediados del siglo XX.",
      examples: [
        "Miles Davis – So What (Dm7 modal, dórico)",
        "Cualquier ii-V-I en jazz estándar",
      ],
      relations: ["Vive dentro de dórico, frigio y eólico. Su escala asociada por defecto: dórico."],
    },
  },
  {
    id: "Maj7",
    name: "Mayor séptima",
    symbol: "Maj7",
    family: "seventh",
    level: 4,
    intervals: [0, 4, 7, 11],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 4, 7, 11, 12] },
      { label: "1ª inversión", intervals: [4, 7, 11, 12, 16] },
      { label: "2ª inversión", intervals: [7, 11, 12, 16, 19] },
      { label: "3ª inversión", intervals: [11, 12, 16, 19, 23] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª", intervals: [4, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 4, 0], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (a fund.)", intervals: [7, 12], duration: ["q", "h"] },
      { target: 7, label: "Desde la 7ª mayor", intervals: [11, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - 5 - 7. Tríada mayor + séptima mayor.",
      function: "Tónica estable y luminosa. I7 (mayor) o IV7 (lidio).",
      origin:
        "Sistemático en el impresionismo (Debussy, Ravel) como sonoridad de reposo coloreado. Central en bossa nova y jazz modal.",
      examples: [
        "Jobim – The Girl from Ipanema (Fmaj7 inicial)",
        "Debussy – Suite Bergamasque (sonoridad de reposo)",
      ],
      relations: ["Vive dentro de jónico y lidio. La extensión #11 lo lleva claramente al lidio."],
    },
  },
  {
    id: "m7b5",
    name: "Semidisminuido",
    symbol: "ø7",
    family: "seventh",
    level: 4,
    intervals: [0, 3, 6, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 6, 10, 12] },
      { label: "1ª inversión", intervals: [3, 6, 10, 12, 15] },
      { label: "2ª inversión", intervals: [6, 10, 12, 15, 18] },
      { label: "3ª inversión", intervals: [10, 12, 15, 18, 22] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 3, 6, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª menor", intervals: [3, 6, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª disminuida", intervals: [6, 3, 0], duration: ["q", "q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - b5 - b7. Tríada disminuida + séptima menor.",
      function: "ii7 del modo menor (predominante). Resuelve clásicamente a V7.",
      origin:
        "Heredero del 'acorde de séptima de segunda especie' del barroco. Central en el ii-V-i menor del jazz.",
      examples: [
        "Bach – Pasiones (final cadencial en menor)",
        "Cualquier ii-V-i menor en jazz (Bm7♭5 - E7 - Am)",
      ],
      relations: ["Vive dentro de locrio y de locrio #2 (semilocrio)."],
    },
  },
  {
    id: "dim7",
    name: "Disminuido séptima",
    symbol: "dim7",
    family: "seventh",
    level: 5,
    intervals: [0, 3, 6, 9],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 6, 9, 12] },
      { label: "1ª inversión (simétrica)", intervals: [3, 6, 9, 12, 15] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental (simétrica)", intervals: [0, 3, 6, 9, 12], duration: ["q", "q", "q", "q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - b5 - bb7. Cuatro terceras menores apiladas. Simetría perfecta cada 3 semitonos.",
      function:
        "Acorde de paso cromático, dominante de inversión (vii°7 del menor armónico), o equivalente enarmónico que pivota tonalidades.",
      origin:
        "Mozart y Beethoven lo usan como recurso modulante. Chopin lo eleva a sustancia armónica autónoma.",
      examples: [
        "Beethoven – Sonata Patética, introducción (acorde dim7 dramático)",
        "Chopin – cualquier preludio en menor",
      ],
      relations: ["Por su simetría, una sola estructura dim7 produce cuatro 'fundamentales' enarmónicas distintas."],
    },
  },
  {
    id: "mMaj7",
    name: "Menor mayor séptima",
    symbol: "mMaj7",
    family: "seventhAlt",
    level: 6,
    intervals: [0, 3, 7, 11],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 3, 7, 11, 12] },
      { label: "1ª inversión", intervals: [3, 7, 11, 12, 15] },
      { label: "2ª inversión", intervals: [7, 11, 12, 15, 19] },
      { label: "3ª inversión", intervals: [11, 12, 15, 19, 23] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 3, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª menor", intervals: [3, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª (aguda)", intervals: [7, 3, 0], duration: ["q", "q", "h"] },
      { target: 7, label: "Desde la 7ª mayor", intervals: [11, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - b3 - 5 - 7. Tríada menor + séptima mayor.",
      function: "Tónica menor estable y misteriosa. I del menor melódico ascendente.",
      origin:
        "Sonoridad clásica de música de espionaje (James Bond). En jazz, primera función del menor melódico modal.",
      examples: [
        "Tema de James Bond – Em(maj7)",
        "Wayne Shorter – temas modales sobre menor melódico",
      ],
      relations: ["Es el acorde-tónica del menor melódico ascendente."],
    },
  },
  // ===== SÉPTIMAS ALTERADAS / SUS =====
  {
    id: "dom7sus4",
    name: "Dominante 7 sus4",
    symbol: "7sus4",
    family: "seventhAlt",
    level: 5,
    intervals: [0, 5, 7, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 5, 7, 10, 12] },
      { label: "1ª inversión", intervals: [5, 7, 10, 12, 17] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 5, 7, 12], duration: ["q", "q", "q", "h"] },
      { target: 4, label: "Desde la 4ª", intervals: [5, 7, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª", intervals: [7, 12], duration: ["q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 4 - 5 - b7. Dominante sin tercera, con cuarta justa.",
      function: "Dominante suspendido. Puede resolver el 4 al 3 o quedarse como sonoridad estable y abierta.",
      origin: "Fusión y jazz modal de los 60-70. Herbie Hancock, McCoy Tyner.",
      examples: ["John Coltrane – Naima (sonoridades suspendidas)", "Pop modal contemporáneo"],
      relations: ["Vive dentro de mixolidio y de los modos suspendidos."],
    },
  },
  {
    id: "dom7s5",
    name: "Dominante 7 #5",
    symbol: "7#5",
    family: "seventhAlt",
    level: 7,
    intervals: [0, 4, 8, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 4, 8, 10, 12] },
      { label: "1ª inversión", intervals: [4, 8, 10, 12, 16] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 8, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª", intervals: [4, 8, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª aumentada", intervals: [8, 4, 0], duration: ["q", "q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - #5 - b7. Dominante con quinta aumentada.",
      function: "Tensión dominante alterada. Resuelve fuerte a la tónica.",
      origin: "Cromatismo del jazz bebop. Charlie Parker usa este color rutinariamente sobre dominantes.",
      examples: ["Bebop estándar – cualquier turnaround alterado"],
      relations: ["Vive dentro de la escala alterada (modo VII del menor melódico) y de tonos enteros."],
    },
  },
  {
    id: "aumMaj7",
    name: "Aumentado mayor 7",
    symbol: "aumMaj7",
    family: "seventhAlt",
    level: 7,
    intervals: [0, 4, 8, 11],
    arpeggioInversions: [{ label: "Posición fundamental", intervals: [0, 4, 8, 11, 12] }],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 8, 12], duration: ["q", "q", "q", "h"] },
      { target: 7, label: "Desde la 7ª mayor", intervals: [11, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - #5 - 7. Tríada aumentada + séptima mayor.",
      function: "Tónica alterada en menor melódico (III+Maj7) o color expresionista.",
      origin: "Schoenberg y la música atonal libre. Tema de Star Trek (Goldsmith).",
      examples: ["Schoenberg – Pierrot Lunaire", "Wayne Shorter – sonoridades de menor melódico III"],
      relations: ["Es el III grado del menor melódico ascendente."],
    },
  },
  {
    id: "dom7b5",
    name: "Dominante 7 b5",
    symbol: "7b5",
    family: "seventhAlt",
    level: 8,
    intervals: [0, 4, 6, 10],
    arpeggioInversions: [
      { label: "Fundamental", intervals: [0, 4, 6, 10, 12] },
      { label: "1ª inversión", intervals: [4, 6, 10, 12, 16] },
    ],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 6, 12], duration: ["q", "q", "q", "h"] },
      { target: 3, label: "Desde la 3ª", intervals: [4, 6, 12], duration: ["q", "q", "h"] },
      { target: 5, label: "Desde la 5ª disminuida", intervals: [6, 4, 0], duration: ["q", "q", "h"] },
      { target: 7, label: "Desde la 7ª menor", intervals: [10, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - b5 - b7. Dominante con quinta disminuida.",
      function: "Sustituto tritonal del dominante (bII7 ≈ V7).",
      origin: "Sistemático en el bebop como sustitución funcional.",
      examples: ["Cualquier turnaround bebop con sustitución tritonal"],
      relations: ["Vive dentro de lidio dominante (IV grado del menor melódico)."],
    },
  },
  {
    id: "Maj7b5",
    name: "Mayor 7 b5",
    symbol: "Maj7b5",
    family: "seventhAlt",
    level: 8,
    intervals: [0, 4, 6, 11],
    arpeggioInversions: [{ label: "Posición fundamental", intervals: [0, 4, 6, 11, 12] }],
    approachFormulas: [
      { target: 1, label: "Desde la fundamental", intervals: [0, 4, 6, 12], duration: ["q", "q", "q", "h"] },
      { target: 7, label: "Desde la 7ª mayor", intervals: [11, 12], duration: ["q", "h"] },
    ],
    theory: {
      construction: "1 - 3 - b5 - 7. Acorde de tipo lidio aumentado en su séptima.",
      function: "Color particularmente sintético, sin tradición tonal funcional estable.",
      origin: "Repertorio postonal y jazz fusión.",
      examples: ["Repertorio contemporáneo"],
      relations: ["Aparece en el VI grado del menor melódico (lidio aumentado)."],
    },
  },
];

export function getChord(id) {
  return CHORDS.find((c) => c.id === id);
}

export function chordsByLevel(maxLevel) {
  return CHORDS.filter((c) => c.level <= maxLevel);
}
