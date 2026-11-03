# Cladum

Explorador de biodiversidad con datos verificables de [GBIF](https://www.gbif.org).
Busca especies, recorre su clasificación de reino a especie y consulta sus ocurrencias documentadas, con la procedencia de cada dato siempre visible.

## Funciones

- **Explorar:** búsqueda por nombre científico o común con sugerencias en vivo (navegable con teclado), filtros por rango y estado taxonómico, y "¿Quisiste decir…?" cuando no hay coincidencias.
- **Índice taxonómico:** la ruta Reino → Especie con el identificador GBIF de cada rango. Al hacer clic en un rango superior se listan las especies que contiene.
- **Ficha de especie:** identidad y nomenclatura, nombre común en español, fotografía con autoría y licencia (con respaldo en iNaturalist, ver abajo), recuento de ocurrencias y aviso cuando las ubicaciones están generalizadas.
- **Ocurrencias:** registros con país, fecha, observador, incertidumbre e incidencias de calidad. Incluye filtro por país y detalle del registro seleccionado.
- **Guardadas:** colección personal en `localStorage`, con búsqueda y opción de deshacer.
- **Clave de procedencia:** cada dato se marca como *Verificado · GBIF*, *Fuente externa* o *Sin dato*. Nunca se inventa información.
- Modo claro y oscuro, diseño responsivo y accesibilidad WCAG 2.2 AA (foco visible, combobox ARIA, contraste y estados anunciados).

## Stack

- HTML5 semántico
- Sass/SCSS (arquitectura 7-1 reducida)
- JavaScript Vanilla con módulos ES
- GBIF API v1 (sin clave)
- iNaturalist API v1 (sin clave), solo como respaldo de fotografías

## Estructura

```
cladum/
├── index.html
├── css/main.css              ← compilado desde scss/ (no editar a mano)
├── scss/
│   ├── abstracts/            tokens (colores, radios, tipografía) y mixins
│   ├── base/                 estilos globales y utilidades
│   ├── layout/               encabezado, página y pie
│   ├── components/           botones, píldoras, tarjetas, buscador, índice, estados
│   └── views/                estilos de cada pantalla
├── js/
│   ├── main.js               punto de entrada
│   ├── config.js             URL de la API y constantes
│   ├── router.js             rutas por hash (#/especie/5219426)
│   ├── services/
│   │   ├── gbif.js           única capa que habla con GBIF
│   │   ├── inaturalist.js    respaldo de fotografías
│   │   └── photos.js         elige la fuente: GBIF primero, iNaturalist si falla
│   ├── state/                estado compartido y favoritos
│   ├── handlers/             eventos: buscador, encabezado, guardar/toasts
│   ├── ui/                   componentes e índice taxonómico
│   │   └── views/            búsqueda, ficha, ocurrencias, guardadas
│   └── utils/                formato (fechas, números) y DOM
└── assets/favicon.svg
```

## Cómo correrlo en VS Code

Los módulos ES no funcionan abriendo `index.html` con doble clic: necesitan un servidor local.

**Opción A (la más sencilla):**

1. Instala la extensión **Live Server**. VS Code te la sugiere al abrir la carpeta.
2. Clic derecho en `index.html` → *Open with Live Server*.

**Opción B (con npm):**

```bash
npm install          # instala Sass
npm run sass:watch   # terminal 1: recompila el CSS al guardar
npm run serve        # terminal 2: abre http://localhost:5500
```

> `css/main.css` ya viene compilado, así que la app funciona sin instalar nada. Para cambiar estilos, edita los archivos de `scss/` y ejecuta `npm run sass:watch`, o usa la extensión *Live Sass Compiler*.

## Rutas

| Ruta | Vista |
|---|---|
| `#/` | Explorar |
| `#/?q=Panthera%20onca` | Resultados |
| `#/?higher=9703&label=Felidae` | Especies dentro de un taxón |
| `#/especie/5219426` | Ficha |
| `#/especie/5219426/ocurrencias?country=BR` | Ocurrencias |
| `#/guardadas` | Guardadas |

## Endpoints de GBIF usados

- `GET /species/suggest`: sugerencias del buscador
- `GET /species/search`: resultados, filtrados por el backbone taxonómico
- `GET /species/match`: "¿Quisiste decir…?"
- `GET /species/{key}` y `/species/{key}/vernacularNames`: ficha y nombre común
- `GET /occurrence/search`: ocurrencias, fotografía (`media_type=StillImage`) y faceta de países

## Fotografías y respaldo

Las fotos se buscan en este orden, para que nunca quede un espacio vacío si hay alguna alternativa:

1. **GBIF**: imágenes de los registros de ocurrencia (`media_type=StillImage`).
2. **iNaturalist**: si GBIF no tiene fotos, no responde, o todas sus imágenes fallan al cargar en el navegador.
3. **Sin dato**: solo si ninguna fuente tiene una imagen que cargue. El mensaje distingue entre "no se pudo consultar", "no se pudo cargar" y "sin fotografía documentada".

Si una foto o miniatura no carga, se retira de la galería en lugar de dejar un ícono. Para iNaturalist se aplican dos reglas:

- El taxón se busca por **nombre científico exacto**. Sin coincidencia exacta no se muestra nada, para no enseñar la foto de otra especie.
- Solo se usan fotos con **licencia abierta** (Creative Commons). Las marcadas como "todos los derechos reservados" se descartan.

Cada foto indica su fuente (*vía GBIF* o *vía iNaturalist*), su autoría, su licencia y un enlace al original.

### Endpoints de iNaturalist usados

- `GET /taxa?q={nombre}`: localiza el taxón por nombre científico
- `GET /taxa/{id}`: fotografías curadas del taxón (`taxon_photos`)

## Despliegue

Es un sitio estático: funciona en GitHub Pages o Firebase Hosting sin configuración extra, porque las rutas usan `#`.

```bash
npm run build        # CSS comprimido
firebase deploy      # si usas Firebase Hosting
```

## Proyectos de referencia

- **GBIF.org**: la fuente de los datos, pensada para investigadores.
- **EncicloVida** (CONABIO): enciclopedia de especies de México.
- **OneZoom**: explorador visual del árbol de la vida.

Cladum se diferencia por hacer visible la procedencia de cada dato, enlazar la consulta exacta a la API y respetar las ubicaciones generalizadas de especies sensibles.

## Próximos pasos

- Mapa de ocurrencias con Leaflet, donde los registros generalizados se dibujen como áreas y no como puntos.
- Búsqueda en lenguaje natural con IA ("felinos nocturnos de México" → filtros de GBIF).
- Migración a React + TypeScript, conservando los tokens de `scss/abstracts/_tokens.scss`.

---

Datos: GBIF.org. Fotografías de GBIF e iNaturalist, con la licencia y autoría indicadas en cada ficha.
