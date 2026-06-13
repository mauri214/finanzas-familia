# 8 · Propuestas de mejoras (bugs + features)

Cada ítem: descripción · por qué importa · impacto · esfuerzo · prioridad · pasos.

---

## A. BUGS CRÍTICOS (rompedores / datos / resultados incorrectos)

### 🔴 C1 — Token de API hardcodeado en repo público
- **Qué**: `API_TOKEN` y `SPREADSHEET_ID` en `Code.gs` versionado público.
- **Por qué**: cualquiera con el repo + URL del Web App accede a todos los datos.
- **Impacto**: Alto · **Esfuerzo**: 1 h · **Prioridad**: CRÍTICA
- **Pasos**: 1) rotar token; 2) `PropertiesService` para token e ID; 3) actualizar campo Token en la app; 4) (opcional) limpiar historial Git.
- ⚠️ Requiere tu confirmación (toca credenciales/producción).

### 🔴 C2 — `capT` mezcla unidades → % pagado de deuda erróneo (BUG-D1)
- **Qué**: `capT=Σ d.cap` (UVA/USD nativo) restado contra `sdoT` en ARS.
- **Por qué**: con hipoteca UVA o préstamo USD, el "% pagado" y la barra del dashboard mienten.
- **Impacto**: Alto · **Esfuerzo**: 30 min · **Prioridad**: CRÍTICA
- **Pasos**: usar `capEfectivo(d)` en lugar de `d.cap` en `renderDashMes` (2198) y `renderDeudas` (3629).

### 🔴 C3 — Timezone en `calcCuotasPend`/`renderImportar` (BUG-G1)
- **Qué**: `new Date(g.fecha)` sin `'T00:00:00'` retrocede 1 día en UTC-3.
- **Por qué**: gastos del día 1 se cuentan en el mes anterior → cuotas pendientes mal.
- **Impacto**: Medio-Alto · **Esfuerzo**: 20 min · **Prioridad**: CRÍTICA
- **Pasos**: `new Date(g.fecha+'T00:00:00')` o reusar `getMesImp`.

### 🔴 C4 — XSS / ruptura de render por falta de escape (seguridad)
- **Qué**: textos del usuario interpolados sin `escHTML`.
- **Por qué**: dato importado con `<` rompe HTML o ejecuta JS.
- **Impacto**: Medio (uso personal) · **Esfuerzo**: 2–3 h · **Prioridad**: ALTA
- **Pasos**: envolver `escHTML()` en desc/notas/nombres/activos/categorías en todos los `innerHTML`.

---

## B. BUGS MENORES (fricciones)

### 🟡 M1 — `saveInv` bloquea `pe/pa/qty = 0` (BUG-INV1)
- Impacto: Medio · Esfuerzo: 15 min · Prioridad: ALTA
- Validar con `isNaN()`+`>=0` en vez de falsy.

### 🟡 M2 — Delta del comparativo sin conversión de moneda (BUG-D2)
- Impacto: Medio · Esfuerzo: 10 min · Prioridad: MEDIA
- `toARS(i.monto,i.mon)` en `ingTPrev`/`gTPrev`.

### 🟡 M3 — Desync id cliente (nid++) vs servidor (maxId+1) (BUG-I1)
- Impacto: Medio · Esfuerzo: 30 min · Prioridad: MEDIA
- `DB.insert` debe devolver el id; el caller hace `rec.id = res.id`.

### 🟡 M4 — `promDiario` y `calcCuotasPend` mezclan monedas
- Impacto: Bajo-Medio · Esfuerzo: 20 min · Prioridad: MEDIA
- Usar `toARS` en las sumas.

### 🟡 M5 — Meta con `obj=0` muestra 100%
- Impacto: Bajo · Esfuerzo: 5 min · Prioridad: MEDIA
- Guardia `m.obj>0 ? ... : 0`.

### 🟡 M6 — TC = 0 / NaN contamina valuaciones
- Impacto: Medio · Esfuerzo: 20 min · Prioridad: MEDIA
- Validar `cfg.tc>0` en `saveCfg` y al cargar; default 1200.

### 🟡 M7 — Validar fechas (rango) y `pag ≤ plazo`, `tna ≥ 0`
- Impacto: Bajo · Esfuerzo: 1 h · Prioridad: BAJA

### 🟡 M8 — Comentario de versión desactualizado
- `<head>` dice "v6.0"; `PROYECTO.md` dice "v6.0". Actualizar a v7.8.
- Impacto: Bajo (doc) · Esfuerzo: 10 min · Prioridad: BAJA

### 🟡 M9 — Ajuste de cuentas descuadra con `quien` no estándar (BUG-AJ1)
- Impacto: Bajo · Esfuerzo: 30 min · Prioridad: BAJA

---

## C. FEATURES SUGERIDAS

### ✨ F-A — Cerrar Feature 3 Nivel 2 (importar posiciones de inversión)
- **Por qué**: completa la visión de inversiones; reusa infra de importación.
- Impacto: Alto · Esfuerzo: 8–12 h · Prioridad: ALTA
- Pasos: prompt nuevo en `callClaude` (o acción dedicada) → preview editable → confirm con detección de duplicados por `activo+plat`.

### ✨ F-B — Feature 3 Nivel 3 (API Binance read-only, actualizar precios)
- **Por qué**: PNL de crypto automático.
- Impacto: Alto · Esfuerzo: 10–16 h · Prioridad: MEDIA
- Pasos: acción `callBinance` con HMAC server-side (key en Script Properties) → mapear tickers → actualizar `pa`. **Nunca** key en frontend.

### ✨ F-C — Persistir snapshots de inversión en Sheets
- **Por qué**: hoy se pierden al limpiar navegador / no sincronizan entre dispositivos.
- Impacto: Medio · Esfuerzo: 3–4 h · Prioridad: MEDIA
- Pasos: nueva hoja `InvSnapshots`; `cerrarMes` inserta vía DB.

### ✨ F-D — `insertBatch` para importación
- **Por qué**: importar 50 ítems hoy son 50 round-trips (lento, roza timeout).
- Impacto: Medio · Esfuerzo: 3–4 h · Prioridad: MEDIA

### ✨ F-E — Exportar PDF del resumen mensual (del roadmap)
- Impacto: Medio · Esfuerzo: 4–6 h · Prioridad: BAJA

### ✨ F-F — Ajuste de cuentas proporcional al ingreso (no solo 50/50)
- **Por qué**: parejas con ingresos dispares suelen repartir proporcional.
- Impacto: Medio · Esfuerzo: 2–3 h · Prioridad: BAJA

### ✨ F-G — Indicador "sin conexión a Sheets" persistente + reintento
- **Por qué**: hoy un fallo de red deja datos locales y Sheet desincronizados sin avisar.
- Impacto: Medio · Esfuerzo: 3–4 h · Prioridad: MEDIA

---

## Roadmap de implementación sugerido (por olas)

### Ola 1 — Seguridad y correcciones críticas (medio día)
C1 (token) → C2 (capT) → C3 (timezone) → M1 (saveInv) → M5/M6 (guardias). 
*Bajo riesgo, alto valor. Empezar por acá.*

### Ola 2 — Robustez (1–2 días)
C4 (escape XSS) → M2/M3/M4 → M7 → F-G (estado de conexión) → M8 (docs/versión).

### Ola 3 — Inversiones completas (1 semana)
F-C (snapshots a Sheets) → F-A (importar posiciones) → F-D (insertBatch) → F-B (Binance).

### Ola 4 — Producto / nice-to-have
F-E (PDF) → F-F (ajuste proporcional) → performance (doc 6) → mobile cards.

---

## Matriz impacto / esfuerzo (quick wins primero)

| | Bajo esfuerzo | Alto esfuerzo |
|---|---|---|
| **Alto impacto** | C2, C3, M1, M6 (★ hacer primero) | C1*, C4, F-A, F-B |
| **Bajo impacto** | M5, M8, M2 | F-E, F-F, mobile cards |

(*C1 es bajo esfuerzo técnico pero requiere tu confirmación por tocar credenciales.)
