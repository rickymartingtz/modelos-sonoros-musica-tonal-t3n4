# Modelos sonoros · Música tonal

Catálogo interactivo de modelos sonoros para el Método Aural. Cuatro pilares:

1. **Fórmulas a la tónica** — reconocer la gravedad melódica de cada grado.
2. **Fórmulas a la fundamental** — conducir cualquier nota de un acorde a su fundamental.
3. **Escalas** — catálogo extendido de ~70 escalas con teoría comparada.
4. **Arpegios** — acordes nota a nota, en sus inversiones, con el acorde en bloque por separado.

Cada modelo se presenta como una tarjeta con: partitura (VexFlow), controles de reproducción, transposición libre y un panel teórico desplegable con estructura, contexto y relaciones.

## Stack

- Vite + React 18
- Tailwind CSS
- VexFlow 4 (partituras)
- soundfont-player (audio con soundfont MusyngKite, ≈4 MB la primera carga)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para servir como sitio estático.

## Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **New Project** → importa el repo.
3. Framework Preset: **Vite** (se autodetecta).
4. Build command: `npm run build` · Output directory: `dist`.
5. Deploy.

## Embebido en Hotmart

Una vez desplegado, embebe el sitio en una página/clase de Hotmart con:

```html
<iframe
  src="https://tu-deploy.vercel.app"
  width="100%"
  height="900"
  style="border:0; border-radius:12px"
  allow="autoplay"
></iframe>
```

El primer clic dentro del iframe desbloquea el audio (requisito de los navegadores).

## Estructura del proyecto

```
src/
  App.jsx              # composición principal, gestión de pilares y estado global
  main.jsx
  index.css
  audio/
    AudioEngine.js     # soundfont-player + helpers de reproducción
  theory/
    utils.js           # MIDI helpers, transposición, cadencias
    chords.js          # catálogo de acordes con teoría y fórmulas de conducción
    scales.js          # catálogo extendido de escalas con teoría
    formulas.js        # fórmulas a la tónica (mayor, menor armónica, melódica, natural)
  components/
    TopBar.jsx         # navegación de pilares + filtros globales
    ChordCard.jsx      # tarjeta de acorde (sirve para arpegios y fundamentales)
    ScaleCard.jsx      # tarjeta de escala
    FormulaCard.jsx    # tarjeta de fórmula a la tónica
    ScoreView.jsx      # render VexFlow
    TheoryPanel.jsx    # panel teórico desplegable
    UI.jsx             # botones, etiquetas, controles de transposición
```

## Extender el catálogo

Para añadir una escala nueva: editar `src/theory/scales.js` y agregar una entrada en el array `SCALES` con los campos `id`, `name`, `aliases`, `family`, `intervals` (semitonos desde la tónica, sin incluir la octava), `formula`, `description`, `origin`, `genres`, `works`, `relations`, `level`.

Para añadir un acorde nuevo: editar `src/theory/chords.js` con la calidad, inversiones, fórmulas de conducción y bloque teórico.

Los niveles I–VIII se respetan a través del filtro global del TopBar.

## Tipografía y marca

- Display: Cormorant Garamond
- Texto: DM Sans
- Fondo: off-white `#f5f4f0`
- Acentos: mint/emerald (estados activos), negro (acciones primarias), lima (familia escalas)

Las fuentes se cargan desde Google Fonts; el favicon `M` está en `/public/favicon.png`.
