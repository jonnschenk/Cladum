## Cladum

Explorador de biodiversidad construido en JavaScript Vanilla moderno. Proyecto de portafolio que conecta formación en Biología con desarrollo front-end: búsqueda, filtrado y ficha técnica de especies consumidas en vivo desde la [API de GBIF](https://www.gbif.org/developer/species).

🔗 Demo: [https://jonnschenk.github.io/Cladum/](https://jonnschenk.github.io/Cladum/)

## Stack

- HTML5 semántico
- Sass (SCSS) — custom properties, Grid, Flexbox — sin frameworks
- JavaScript Vanilla ES Modules (arquitectura modular: services / state / ui / handlers)
- Persistencia de favoritos con `localStorage`
- Fuente de datos: [GBIF Species API](https://www.gbif.org/developer/species)

## Roadmap

- [x] Fase 1 — Estructura HTML semántica y CSS base responsive
- [ ] Fase 2 — Arquitectura JS modular con datos mockeados
- [ ] Fase 3 — Integración real de la API (fetch, async/await, normalización)
- [ ] Fase 4 — Favoritos con persistencia en localStorage
- [ ] Fase 5 — Optimizaciones: debounce, paginación, accesibilidad, manejo de errores
- [ ] Fase 6/7 — Migración a React + TypeScript

## Cómo correrlo localmente

Este proyecto usará ES Modules a partir de la Fase 2, que requieren servirse por HTTP (no funcionan con `file://`). Opciones simples:

```bash
# Con Python
python3 -m http.server 8000

# Con Node (npx, sin instalar nada global)
npx serve .
```

Luego abre `http://localhost:8000`.

Para editar estilos, instala las dependencias y compila Sass:

```bash
npm install
npm run build:css     # compilación única
npm run watch:css     # recompila en cada cambio
```

## Estructura

```
Cladum/
├── index.html
├── scss/               # fuente de estilos (Sass)
│   ├── base/            # tokens, reset, tipografía
│   ├── layout/           # header, grid, footer
│   ├── components/        # search-bar, card, filters, modal, skeleton, states
│   └── main.scss           # orquestador (@use)
├── css/
│   └── styles.css      # generado por Sass — no editar a mano
├── js/                 # arquitectura modular (Fase 2+)
│   ├── services/       # API service
│   ├── state/           # State manager
│   ├── ui/               # DOM renderers
│   └── handlers/          # Event handlers
└── assets/
```
## Autor

Jonathan M. Ramírez

- Email: [jonathanrott.dev@gmail.com](mailto:jonathanrott.dev@gmail.com)
- GitHub: [github.com/jonnschenk](https://github.com/jonnschenk)
- LinkedIn: [linkedin.com/in/jonathan-ramírez](https://www.linkedin.com/in/jonathan-ramírez-2b0043246/)

---

© 2026 Jonathan Ramírez.
