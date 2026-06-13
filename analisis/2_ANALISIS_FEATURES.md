# 2 · Análisis de features planificadas

## Resumen ejecutivo de esta fase

| Feature | Estado real en v7 | Acción recomendada |
|---------|-------------------|--------------------|
| **F1 — Filtro por rango de fechas en Ingresos** | ✅ **YA IMPLEMENTADO** | Pulir bugs menores (ver abajo) |
| **F2 — Filtro por rango de fechas en Gastos** | ✅ **YA IMPLEMENTADO** | Pulir bugs menores |
| **F3 — Inversiones 3 niveles** | 🟡 Nivel 1 (manual) ✅ · Charts ✅ · Nivel 2 (import doc) ❌ · Nivel 3 (API) ❌ | Diseño nuevo (abajo) |

> **Hallazgo importante:** las features 1 y 2 del pedido **ya existen y funcionan** en `finanzas_v7.html`. No hay que construirlas de cero; solo corregir detalles. Esto libera esfuerzo para concentrarse en la Feature 3.

---

## FEATURE 1 y 2 — Filtros de fecha (Ingresos / Gastos)

### Lo que ya existe
- **UI**: barra `filtro-fecha-bar` con `<select>` (Todos / mes / Personalizado) e inputs `desde`/`hasta` (líneas 515–560 del HTML).
- **Lógica**: `aplicarFiltroDates(arr, filtro)` con 3 modos (`todos`/`mes`/`custom`), `ingFiltro` y `gastFiltro` como estado, `onIngFltMes`/`onGastFltMes`, `limpiarFiltroIng/Gast`.
- **Extras ya hechos**: subtotales por categoría/usuario y promedio diario (`promDiario`) cuando hay filtro activo; contador "Mostrando X de Y".

### Impacto arquitectónico
- **Nulo en backend**: el filtrado es 100% en frontend sobre arrays ya cargados. No toca Sheets ni Apps Script.
- **Nulo en Health Score / Ajuste**: esos cálculos usan `getMG`/`getIng` (mes del dashboard) o su propio selector de mes, no el filtro de los módulos. Por lo tanto el filtro visual **no contamina** los cálculos financieros. ✓ Correcto.

### Conflictos / bugs detectados (ver doc 3 y 5 para detalle)
1. **Modo "mes" ignora el año**: `aplicarFiltroDates` filtra por `getMonth()` en cualquier año → "Mayo" muestra mayo 2024+2025+2026 juntos. Puede sorprender al usuario. *Decisión de diseño a confirmar.*
2. **No persiste**: el filtro se resetea al recargar (es intencional según comentario, pero conviene documentarlo en la UI).
3. **`promDiario` mezcla monedas**: suma `r.monto` sin `toARS`, así que un período con ARS+USD da un promedio sin sentido. Fix: usar `toARS(r.monto, r.mon)`.
4. **Dependencia de `new Date(fecha+'T00:00:00')`**: correcto aquí (evita el bug de timezone), a diferencia de `calcCuotasPend` que sí lo tiene.

### Esfuerzo de cierre
~1–2 h para los 3 fixes. No requiere tocar el Sheet.

---

## FEATURE 3 — Inversiones en 3 niveles + gráficos

### Estado por nivel

**Nivel 1 — Carga manual** ✅ Completo
- Formulario `modal-inv` (activo, tipo, plataforma, moneda, qty, pe, pa, fecha).
- `saveInv`, `delInv`, `openUpdPrecios`/`guardarPrecios` (actualización de precios), `cerrarMes` (snapshots mensuales en localStorage).

**Gráficos de portafolio y PNL** ✅ Mayormente completo
- `renderInvCharts`: evolución del portafolio (línea/área desde `invSnapshots`), distribución por tipo (dona), barras de PNL por activo.
- **Limitación**: los snapshots viven en `localStorage` (`hc_inv_snapshots`), **no** en Sheets → no se sincronizan entre dispositivos y se pierden al limpiar el navegador.

**Nivel 2 — Importación de documentos (PDF/XLS/CSV)** ❌ No existe
- El módulo Importar (extractos) ya tiene la infraestructura (pdf.js + proxy Claude) pero está orientado a **gastos/ingresos**, no a posiciones de inversión.

**Nivel 3 — Sincronización API (Binance + otros)** ❌ No existe
- "Binance" solo figura como opción de plataforma en un `<select>`. No hay integración real.

### Análisis arquitectónico de lo pendiente

#### Nivel 2 — Importar posiciones desde documento
- **Reutilizable**: `extractTextFromPDF`, el patrón de proxy `callClaude`, y el patrón `impPending[] → preview editable → confirmImport`.
- **Nuevo**: un *system prompt* distinto en `callClaude` (o una acción nueva `callClaudeInv`) que devuelva `{activo, tipo, qty, precio, moneda}` en vez de transacciones bancarias.
- **Sheets**: sin cambios de columnas (Inversiones ya tiene activo/tipo/plat/mon/qty/pe/pa/fe).
- **Riesgo**: los resúmenes de broker (Bull Market, Balanz) tienen formatos muy variables; la precisión del parseo será menor que con extractos de tarjeta. Conviene preview **siempre editable** y no auto-confirmar.

#### Nivel 3 — API Binance (read-only)
- **Problema de fondo**: Binance requiere firmar cada request con **HMAC-SHA256** usando una *secret key*. Esa key **no puede vivir en el frontend** (repo público). Debe ir en **Script Properties** del Apps Script, con una acción nueva tipo `callBinance` que firme server-side (igual que `callClaude`).
- **Endpoints**: `/api/v3/account` (balances), `/api/v3/ticker/price` (precios). Apps Script puede hacer HMAC con `Utilities.computeHmacSha256Signature`.
- **Mapeo**: cada balance de Binance → posición con `mon:'USD'`, `pe` = costo promedio (Binance no lo da directo → o se ingresa manual, o se deja `pe` y solo se actualiza `pa`).
- **Decisión clave**: ¿la API solo **actualiza precios** (`pa`) de posiciones existentes, o **crea** posiciones nuevas? Recomendado: empezar por *actualizar precios* (menos riesgo de duplicar/ensuciar datos).
- **Otros brokers (Bull Market, etc.)**: la mayoría **no** ofrecen API pública read-only para retail. Realista: solo Binance por API; el resto por importación (Nivel 2) o manual.

### Cambios necesarios

| Componente | Nivel 2 | Nivel 3 |
|-----------|---------|---------|
| **Google Sheets** | Ninguno (opcional: persistir snapshots → nueva hoja `InvSnapshots`) | Ninguno en columnas; guardar `binance_api_key` solo como *Script Property*, **nunca** en el Sheet ni en el HTML |
| **Apps Script** | Nuevo prompt o acción `parseInversionesDoc` | Nueva acción `callBinance` con firma HMAC server-side |
| **Frontend** | Reusar flujo `impPending`/preview para inversiones | Botón "Sincronizar Binance" → `DB.call('callBinance')` → actualizar `pa` |

### Conflictos potenciales y mitigación
1. **Duplicados de posiciones** al importar: aplicar una detección tipo `detectarDuplicados` por `activo`+`plat`.
2. **PNL con costo desconocido** (API no da precio de entrada): mostrar PNL solo cuando `pe>0`; si viene de API sin costo, marcar la posición como "solo valuación".
3. **Snapshots en localStorage**: si se conecta API, conviene mover snapshots a Sheets para no perder histórico. → nueva hoja `InvSnapshots` (id, mes, tc, totalARS, totalInvARS, json_posiciones).
4. **Health Score**: hoy `tAct` suma `invToARSa`. Cualquier nivel nuevo que cargue posiciones impactará el pilar Inversión automáticamente — **verificar que precios en USD se conviertan** (ya lo hace `invToARSa`). ✓

### Esfuerzo estimado
- Nivel 2: ~8–12 h (prompt nuevo + adaptar preview + pruebas con resúmenes reales).
- Nivel 3 (solo Binance, actualizar precios): ~10–16 h (firma HMAC, manejo de errores, mapeo de tickers).
- Persistir snapshots en Sheets: ~3–4 h.
