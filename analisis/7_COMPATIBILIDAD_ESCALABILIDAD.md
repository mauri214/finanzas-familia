# 7 · Compatibilidad y escalabilidad

---

## Navegadores

| Navegador | Compatibilidad | Notas |
|-----------|---------------|-------|
| Chrome / Edge (Chromium) | ✅ Total | Entorno principal de prueba. |
| Safari (macOS/iOS) | ✅ Alta | Usa APIs estándar (fetch, `Intl`, SVG, `Promise.all`). `Intl.NumberFormat('es-AR')` soportado. Revisar `input[type=date]` (Safari lo soporta desde hace años). |
| Firefox | ✅ Alta | Sin APIs exóticas. |
| Navegadores viejos (IE11) | ❌ | Usa optional chaining (`?.`), template literals, `const/let`, arrow functions. No es objetivo. |

**Dependencias externas (CDN)** — punto único de falla:
- `pdf.js` (Cloudflare) y `Tabler Icons` (jsDelivr). Si el CDN cae o no hay internet, los iconos desaparecen y la importación de PDF falla. *Para offline/PWA habría que self-hostear.*

---

## Dispositivos

| Dispositivo | Estado | Notas |
|-------------|--------|-------|
| Desktop (Mac/Win/Linux) | ✅ | Layout `max-width:1100px` centrado. |
| Tablet | ✅ | Grids se adaptan. |
| Mobile | 🟡 | Funciona, pero tablas anchas exigen scroll horizontal (ver doc 6). |

---

## Escala de datos

| Volumen | Comportamiento esperado |
|---------|------------------------|
| Cientos de registros | ✅ Fluido. |
| ~5.000 gastos | 🟡 Renders notan algo de lag (recorridos O(n·12) en dashboard). Tolerable. |
| Decenas de miles | 🔴 Tablas sin virtualizar + recorridos repetidos → lag perceptible. Sheets también se vuelve lento de leer entero. |

### Límites de Google Sheets
- **10 millones de celdas** por spreadsheet (límite duro). A ~12 columnas, son ~800.000 filas teóricas — inalcanzable para 1 familia.
- El cuello real es **leer toda la hoja** en cada `loadAll` (`getDataRange().getValues()`): a partir de ~50.000 filas la lectura completa empieza a tardar segundos.
- **Conclusión**: para el uso previsto (1 familia, años de historial) Sheets escala de sobra. Para producto multi-familia **no** escala (ver PDF/roadmap: migrar a Postgres/Supabase).

---

## Cambios de estructura y migraciones

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Agregar columna | ✅ Soportado | `HEADERS` define el orden; `fixHeaders()` agrega columnas faltantes al Sheet. `coerce_*` ponen default a registros viejos. |
| ¿Quién migra datos viejos? | 🟡 | Hay helpers (`fixHeaders`, `fixDupIds`, `fixMetasFechas`) pero **no** hay carpeta `/migrations/` poblada (CLAUDE.md la pide). Las migraciones viven sueltas en `Code.gs`. |
| Documentación de migración | 🔴 | No existe registro versionado de qué migración corresponde a qué versión. `appsscript/Migrations.gs` está casi vacío (21 líneas). |
| Robustez de Apps Script | ✅ | CRUD genérico, manejo de errores con try/catch, respuestas `{ok, error}`. Sólido para su tamaño. |

### Riesgos de migración detectados
1. **`HEADERS` y el Sheet pueden divergir**: si alguien agrega una columna en `HEADERS` pero no corre `fixHeaders`, los `insert` escriben en orden corrido. *Recomendación: que `insert` valide longitud de cabecera, o correr `fixHeaders` al deploy.*
2. **`update` lee `headers` del Sheet pero recorre `HEADERS[sheetName]`**: si difieren, escribe en columnas equivocadas. Mismo riesgo que arriba.
3. **Sin entorno PROD separado**: PROYECTO.md dice que PROD "está pendiente de crear"; hoy todo apunta al mismo Sheet TEST. Antes de tratar datos como "producción", crear PROD y parametrizar el ID.

---

## Escalabilidad máxima realista (sin reescribir)

| Dimensión | Techo práctico |
|-----------|----------------|
| Usuarios | 2 (modelo de 2 columnas u1/u2 cableado en toda la lógica) |
| Familias | 1 (single-tenant, un solo Sheet/token) |
| Años de historial | 5–10+ sin problema |
| Registros | Decenas de miles antes de necesitar paginación |

## Roadmap técnico sugerido para escalar

1. **Corto plazo (seguir como herramienta personal)**: poblar `/migrations/`, separar PROD/TEST por config, self-hostear CDNs si se quiere PWA offline.
2. **Mediano plazo (más datos)**: `insertBatch`, paginación de tablas, snapshots en Sheets.
3. **Largo plazo (producto)**: lo que ya dice el PDF — backend REST + Postgres/Supabase multi-tenant, auth real, RevenueCat. El código actual sirve como **prototipo de lógica de negocio**, no como base de producción multi-usuario.
