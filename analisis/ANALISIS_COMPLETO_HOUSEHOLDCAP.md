# Análisis completo — HouseholdCap

> Documento ejecutivo consolidado · 12/06/2026
> Detalle por tema en los documentos `1_`…`8_` de esta carpeta.

---

## 1. Resumen ejecutivo

**Versión analizada**: `finanzas_v7.html` (v7.8, 4304 líneas) + `appsscript/Code.gs` (v7). Es la versión activa en `main` (el redirect de `index.html` apunta ahí). *Nota: los comentarios internos y `PROYECTO.md` todavía dicen "v6.0" — desactualizados.*

**Estado general**: 🟢 **Sólido y funcional**. Es una app madura, bien organizada para ser un único archivo vanilla, con buena cobertura de funciones (dashboard, gastos, ingresos, importación con IA, inversiones, metas, créditos con amortización francesa, simuladores). La lógica financiera está, en general, **bien planteada**.

**Hallazgos que requieren acción**:
- 🔴 **1 problema de seguridad serio**: token de API y ID de planilla hardcodeados en el repo público (viola CLAUDE.md). *Requiere tu confirmación para corregir.*
- 🔴 **2 bugs de cálculo**: % pagado de deuda mal en préstamos UVA/USD; desfase de timezone en cuotas pendientes.
- 🟡 **Varios bugs menores** de moneda, validación y XSS.
- ✅ **Buena noticia**: las "Features 1 y 2" del pedido (filtros de fecha en Ingresos/Gastos) **ya están implementadas**. Solo falta cerrar la Feature 3 (inversiones niveles 2 y 3).

**Recomendación prioritaria**: ejecutar la **Ola 1** (medio día) — seguridad + 3 fixes críticos — antes de agregar features nuevas.

---

## 2. Estado actual por módulo

| Módulo | Funciona bien | Cuestionable | Con bug |
|--------|---------------|--------------|---------|
| Dashboard | Health Score, vistas mes/anual, proyección, notificaciones | proxy de ingreso anual; render O(n·12) | 🔴 `capT` mezcla unidades; delta sin `toARS` |
| Gastos | CRUD, edición, filtros, ajuste de cuentas | cuota X/Y depende de regex en notas | 🔴 timezone en cuotas; XSS sin escapar |
| Ingresos | tipos, recurrencia, distribución A/B | `promDiario` mezcla monedas | — |
| Importar | parseo multi-banco + IA, preview editable, duplicados | falta validar fecha/monto antes de confirmar | 🟡 desync id cliente/servidor |
| Inversiones | PNL, dona, charts, snapshots, update precios | snapshots solo en localStorage | 🔴 `saveInv` bloquea 0; dona /0 |
| Metas | progreso, trofeos, orden v7.8, días restantes | — | 🟡 `obj=0` → 100% |
| Créditos | francés, amortización, prepago, proyección | sin validar `pag≤plazo`, `tna≥0` | hereda timezone de cuotas |
| Ajuste cuentas | reparto 50/50, sugerencias | solo 50/50, no proporcional | 🟡 `quien` no estándar descuadra |

---

## 3. Análisis de features planificadas

| Feature | Estado real | Recomendación |
|---------|-------------|---------------|
| **F1 — Filtro fechas Ingresos** | ✅ Ya existe (`aplicarFiltroDates`, UI completa) | Pulir: modo "mes" ignora año; `promDiario` mezcla monedas (~1–2 h) |
| **F2 — Filtro fechas Gastos** | ✅ Ya existe | Idem |
| **F3 — Inversiones 3 niveles** | 🟡 Nivel 1 (manual) ✅ + charts ✅; Nivel 2 (import doc) ❌; Nivel 3 (API Binance) ❌ | Construir N2 reusando infra de importación (8–12 h); N3 solo Binance con HMAC server-side (10–16 h) |

**Clave de la Feature 3**: la *secret key* de Binance **no puede ir en el frontend** (repo público). Debe firmarse server-side en Apps Script con key en Script Properties — mismo patrón que `callClaude`. Realista: solo Binance por API; otros brokers por importación o manual.

Detalle: ver `2_ANALISIS_FEATURES.md`.

---

## 4. Bugs encontrados

### Críticos (con pasos para reproducir)
1. **Token hardcodeado** (`Code.gs:15`). *Repro*: abrir el repo público → el token es visible.
2. **% pagado de deuda en UVA/USD** (`renderDashMes:2198`, `renderDeudas:3629`). *Repro*: cargar deuda con `mon='UVA'` o `'USD'` → el % pagado y la barra muestran valores absurdos.
3. **Timezone en cuotas** (`calcCuotasPend:3485`, `renderImportar:3491`). *Repro*: cargar gasto con `fecha` día 1 y `cuotas>1` → la cuota aparece desfasada un mes.

### Menores
- `saveInv` rechaza precio/cantidad 0 · delta del comparativo sin `toARS` · desync de ids · `promDiario` mezcla monedas · meta `obj=0` → 100% · TC=0/NaN · falta de escape HTML (XSS) · versión desactualizada en comentarios.

Detalle y fixes en `3_AUDITORIA_LOGICA.md` y `8_PROPUESTAS_MEJORAS.md`.

---

## 5. Mejoras propuestas (priorizadas)

**Quick wins de alto impacto** (hacer primero): corregir `capT`, timezone de cuotas, `saveInv`, guardias de `obj=0` y `tc=0`. Todos < 30 min cada uno.

**Inversión media** que agrega valor: cerrar Nivel 2 de inversiones, persistir snapshots en Sheets, `insertBatch` para importación, indicador de conexión a Sheets.

**Largo plazo**: API Binance, exportar PDF, ajuste proporcional al ingreso, vista mobile en cards.

Roadmap por olas en `8_PROPUESTAS_MEJORAS.md`.

---

## 6. Seguridad y performance

**Seguridad**: el hallazgo crítico es el token en el repo (rotar + Script Properties). Secundarios: escapar HTML en todos los render (XSS), validar fechas/montos, avisar que la IA procesa el extracto. Sin rate limiting (mitigado de hecho por cuotas de Apps Script). Detalle en `4_ANALISIS_SEGURIDAD.md`.

**Performance**: a la escala actual (1 familia, 1–2 años) la app es rápida. Cuellos a futuro: importación con N round-trips, dashboard con recorridos O(n·12), tablas sin virtualizar y anchas en mobile. Nada urgente. Detalle en `6_ANALISIS_PERFORMANCE.md`.

**Escalabilidad**: single-tenant, 2 usuarios cableados; Sheets escala de sobra para uso familiar pero no para producto multi-familia (eso requiere el backend del roadmap del PDF). Faltan: carpeta `/migrations/` poblada y separación PROD/TEST. Detalle en `7_COMPATIBILIDAD_ESCALABILIDAD.md`.

---

## 7. Recomendaciones finales

### Qué hacer primero (esta semana)
1. **Seguridad** (con tu OK): rotar token y moverlo + el ID de planilla a Script Properties.
2. **Ola 1 de fixes** (medio día): `capT`, timezone de cuotas, `saveInv`, guardias `obj=0`/`tc=0`. Bajo riesgo, alto valor.
3. **Actualizar** `PROYECTO.md` y el comentario del `<head>` a v7.8.

### Qué esperar
- Tras la Ola 1, los números del dashboard y las cuotas serán confiables incluso con deudas UVA/USD.
- La Ola 2 (escape HTML + validaciones + estado de conexión) deja la app robusta frente a datos raros y cortes de red.
- La Ola 3 completa la visión de inversiones (lo que más te falta del roadmap).

### Cómo proceder
- Trabajar en rama `dev`, probar contra el Sheet **TEST**, mergear a `main` cuando funcione (regla del proyecto).
- Antes de tocar `Code.gs`/credenciales/PROD: confirmación explícita tuya (lo pide CLAUDE.md).
- Versionar: estos fixes son menores → `v7.9`; el bloque de inversiones (Nivel 2/3 + snapshots a Sheets) justifica `v8`.

### Veredicto
HouseholdCap es un proyecto **bien hecho y útil** para su propósito. No tiene problemas estructurales graves; los hallazgos son corregibles en horas, no semanas. El único punto que conviene resolver **ya** es el token en el repo. Lo demás es pulido incremental sobre una base sana.

---

## Índice de documentos

| Doc | Tema |
|-----|------|
| `1_MAPEO_PLATAFORMA.md` | Arquitectura, módulos, tech stack, reglas |
| `2_ANALISIS_FEATURES.md` | Impacto de F1/F2 (ya existen) y F3 (inversiones) |
| `3_AUDITORIA_LOGICA.md` | Estado y bugs por módulo |
| `4_ANALISIS_SEGURIDAD.md` | Token, XSS, validaciones, privacidad |
| `5_TESTING_EDGE_CASES.md` | Casos extremos por módulo |
| `6_ANALISIS_PERFORMANCE.md` | Velocidad, memoria, llamadas a Sheets, mobile |
| `7_COMPATIBILIDAD_ESCALABILIDAD.md` | Navegadores, escala, migraciones |
| `8_PROPUESTAS_MEJORAS.md` | Bugs + features priorizados, roadmap por olas |
