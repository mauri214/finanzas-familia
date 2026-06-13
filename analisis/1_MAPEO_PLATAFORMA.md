# 1 · Mapeo de la plataforma — HouseholdCap

> Análisis del estado actual en `main`. Fecha: 12/06/2026.

## Versión actual identificada

| Dato | Valor |
|------|-------|
| **Archivo activo** | `finanzas_v7.html` (idéntico byte a byte a `finanzas_v7.8.html`, 4304 líneas) |
| **Comentario interno** | El encabezado del `<head>` todavía dice "v6.0" (línea 8) — **desactualizado**, ver hallazgo en doc 8 |
| **Apps Script** | `appsscript/Code.gs` — etiquetado `Versión: v7` |
| **Redirect** | `index.html` → `finanzas_v7.html` ✓ |
| **Última feature** | v7.8: orden de metas + campo `importancia`; selector global ARS/USD |
| **Snapshots previos** | v4, v5, v5.1, v5.2, v5.3, v6, v7.7 conservados en la carpeta |

> ⚠️ El `PROYECTO.md` declara "Versión activa: v6.0" — también está desactualizado respecto a v7.

## Arquitectura actual

```
┌──────────────────────────────────────────────────────────┐
│  NAVEGADOR (cliente)                                       │
│                                                            │
│  finanzas_v7.html  ─ archivo único (HTML+CSS+JS vanilla)  │
│   ├─ Estado en memoria: gastos[], ingresos[],             │
│   │   inversiones[], metas[], deudas[], cfg{}, CAT{}       │
│   ├─ localStorage:                                         │
│   │   • ff_script_url / ff_script_token  (conexión DB)    │
│   │   • hc_presupuestos, hc_recurrentes,                  │
│   │     hc_inv_snapshots, hc_paleta                        │
│   └─ objeto DB.* (fetch POST → Apps Script)               │
│                                                            │
│  Librerías CDN:  pdf.js 3.11.174 · Tabler Icons 3.19      │
└───────────────────────────┬──────────────────────────────┘
                            │  HTTPS POST (JSON + token)
                            ▼
┌──────────────────────────────────────────────────────────┐
│  GOOGLE APPS SCRIPT  (Code.gs — Web App)                  │
│   doGet/doPost → handleRequest → switch(action)           │
│   acciones: getAll, insert, update, delete, getCfg,       │
│             setCfg, initSheets, callClaude, deleteCat,    │
│             fixHeaders, fixDupIds                          │
│   callClaude → proxy server-side a api.anthropic.com      │
└───────────────────────────┬──────────────────────────────┘
                            │  SpreadsheetApp
                            ▼
┌──────────────────────────────────────────────────────────┐
│  GOOGLE SHEETS  (1 hoja por entidad)                      │
│   Gastos · Ingresos · Inversiones · Metas · Deudas ·      │
│   Configuracion · Categorias                              │
└──────────────────────────────────────────────────────────┘
                            ▲
                            │  (proxy)
┌──────────────────────────────────────────────────────────┐
│  ANTHROPIC API  — modelo claude-haiku-4-5                 │
│   Interpreta extractos bancarios → JSON de transacciones  │
└──────────────────────────────────────────────────────────┘
```

## Módulos y funciones principales

| Módulo | Render principal | Funciones de apoyo clave |
|--------|------------------|--------------------------|
| **Dashboard** | `renderDash` → `renderDashMes` / `renderDashAnual` | `calcHealthScore`, `renderHealthScore`, `calcProyeccion`, `renderProyeccion`, `renderNotificaciones`, `deltaLabel` |
| **Ingresos** | `renderIngresos` | `aplicarFiltroDates`, `promDiario`, `renderDistResult`, `renderDistCfg` |
| **Gastos** | `renderGastos` | `fltG`, `fillCatFilter`, `renderAjuste` (ajuste de cuentas), `calcCuotasPend` |
| **Importar** | `renderImportar` | `processFile`, `extractTextFromPDF`, `parseWithClaudeAPI`, `buildImpPending`, `renderImpPreview`, `confirmImport`, `detectarDuplicados` |
| **Inversiones** | `renderInv` | `renderInvCharts`, `invToARS/invToARSa`, `openUpdPrecios`, `guardarPrecios`, `cerrarMes` (snapshots) |
| **Metas** | `renderMetas` | `openNuevaMeta`, `openEditMeta`, `saveMeta`, `marcarDone` |
| **Créditos/Deudas** | `renderDeudas` | `capEfectivo`, `cuotaMensual`, `cuotaDet`, `buildAmort`, `calcAdel`, `simAdel` |
| **Simulador** | `renderSimulador` | `calcSimAhorro`, `calcSimDeuda` |
| **Config** | `saveCfg`, `applyNames` | `addCat`, `delCat`, `renderPresupuestosConfig`, `fixHeadersSheets`, `fixDupIdsSheets` |

## Flujos de datos

1. **Arranque:** `DB.loadAll()` lee las 7 hojas en paralelo (`Promise.all`) → coerce → estado en memoria. Si no hay URL/token configurados → modo demo (datos hardcodeados en el HTML).
2. **Alta:** `save*()` empuja al array local + render inmediato + `DB.insert()` async. El id local sale de `nid++`; el servidor reasigna su propio id (ver hallazgo de desincronización, doc 3/8).
3. **Edición/baja:** mutación local + render + `DB.update()/remove()` por `id`.
4. **Importación:** archivo/texto → (PDF: pdf.js) → `parseWithClaudeAPI` (proxy) → `impPending[]` editable → `confirmImport` → inserción secuencial.
5. **Moneda de visualización:** variable global `curCur` ('ARS'/'USD'); `faC()` convierte para mostrar; `setCur()` sincroniza todos los botones `.cur-btn` y re-renderiza el módulo activo.

## Reglas de negocio identificadas

- **Doble moneda:** cada registro tiene campo `mon` ('ARS'/'USD'; deudas también 'UVA'). `toARS()` convierte a ARS con `cfg.tc`. Almacenamiento siempre en moneda nativa.
- **Imputación contable:** `getMesImp()` usa `imputacion` (YYYY-MM) si existe, sino `fecha`. Separa fecha de transacción del mes contable.
- **Ámbito vs quién pagó:** `amb` (fam/u1/u2) = a quién corresponde el gasto; `quien` (u1/u2/comp) = quién lo pagó. El ajuste de cuentas cruza ambos.
- **Health Score:** 0–100, 4 pilares ponderados — Ahorro 35, Inversión 30, Deuda 20, Metas 15.
- **Amortización francesa:** TEM = (1+TNA/100)^(1/12) − 1; cuota constante.
- **Cuotas de tarjeta:** un gasto con `cuotas>1` se prorratea `monto/cuotas` por mes futuro.

## Restricciones conocidas (de CLAUDE.md / PROYECTO.md)

- Nunca renombrar/borrar columnas del Sheet; solo agregar al final con default.
- Probar en Sheet TEST antes que PROD (PROD aún sin crear).
- No hardcodear URLs ni credenciales (ver violación en doc 4).
- Versionado: fix→sin bump; feature menor→v7.x; cambio grande→v8.
- Desarrollo en rama `dev`, merge a `main` cuando funciona.

## Tech stack detallado

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | HTML5 + CSS3 + JS ES6+ vanilla | Single-file, sin build, sin framework |
| Gráficos | SVG generado a mano (`svgLinea`, `svgDona`, `svgBarrasPNL`, `svgLineaArea`, `svgBarrasGrupo`) | Sin librerías de charting |
| Iconos | Tabler Icons (webfont CDN) | Dependencia externa |
| PDF | pdf.js 3.11.174 (CDN) | Para extraer texto de extractos |
| IA | Claude `claude-haiku-4-5` vía proxy Apps Script | Key en Script Properties |
| Backend | Google Apps Script (Web App) | Auth por token compartido |
| Persistencia | Google Sheets | 7 hojas, una por entidad |
| Hosting | GitHub Pages | `mauri214.github.io/HouseholdCap` |
| Estado local | `localStorage` | URL/token + preferencias UI |
