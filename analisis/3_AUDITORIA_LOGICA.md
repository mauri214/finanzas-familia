# 3 · Auditoría de lógica y funcionalidad

Leyenda: ✅ correcto · 🟡 cuestionable / mejorable · 🔴 bug

---

## MÓDULO DASHBOARD

| Check | Estado | Detalle |
|-------|--------|---------|
| Health Score se calcula bien | 🟡 | Fórmula coherente, pero ver bug `capT` (deuda) abajo. Pilar inversión usa `ingT*12` como proxy de ingreso anual — si un mes tiene ingresos atípicos (aguinaldo), distorsiona el score. |
| Pilares bien ponderados | ✅ | 35/30/20/15 = 100. Suma correcta. |
| Consejo personalizado | ✅ | Elige el pilar más débil por ratio `score/max`. Útil. |
| Vista mensual vs anual | ✅ | `setDashView` alterna sin errores. |
| Comparativo período anterior | 🔴 | **Bug**: el mes anterior se suma con `i.monto`/`g.monto` **sin `toARS`** (líneas 2207–2208), mientras el mes actual usa `toARS`. Si hay registros en USD, el delta % es incorrecto. |

### 🔴 BUG-D1 — `capT` mezcla unidades (también afecta Deudas)
`renderDashMes` (línea 2198) y `renderDeudas` (línea 3629):
```js
const capT = deudas.reduce((a,d)=>a+d.cap,0);   // d.cap está en moneda NATIVA (UVA/USD/ARS)
const sdoT = deudas.reduce((a,d)=>a+cuotaDet(d).saldo,0); // saldo en ARS (capEfectivo)
const pctPag = (capT - sdoT)/capT;              // ⚠️ ARS - UVA → sin sentido
```
Para un préstamo **UVA** (`cap` en UVAs) o **USD**, `capT` queda en unidades nativas y `sdoT` en ARS. El % pagado y la barra de progreso salen mal. **Fix**: usar `capEfectivo(d)` para `capT`.

### 🔴 BUG-D2 — delta del comparativo sin conversión de moneda
Ver fila de la tabla. **Fix**: `ingTPrev = ingP.reduce((a,i)=>a+toARS(i.monto,i.mon||'ARS'),0)` (idem gastos).

---

## MÓDULO GASTOS

| Check | Estado | Detalle |
|-------|--------|---------|
| Categorías se guardan | ✅ | `saveGasto`/`updateGasto` toman `g-cat`. |
| Cuotas de tarjeta | 🟡 | Se guardan, pero la "cuota X/Y" se infiere de `notas` con regex; si el usuario edita la nota se rompe el badge. |
| Editable post-carga | ✅ | `openEditGasto`/`updateGasto` cubren todos los campos. |
| Eliminar gasto no rompe ajuste | ✅ | `delGasto` usa **índice de array** (no id) — fix correcto para datos con ids duplicados. |
| Campos opcionales | ✅ | `notas`, `imputacion` opcionales con default. |

### 🔴 BUG-G1 — `calcCuotasPend` y `renderImportar`: timezone
Líneas 3485 y 3491:
```js
const gd = new Date(g.fecha);   // '2026-06-01' → UTC medianoche
// en Argentina (UTC-3) → 2026-05-31 21:00 → getMonth()=4 (mayo!)
```
`new Date('YYYY-MM-DD')` se interpreta como **UTC**; en zona negativa retrocede un día. Para gastos del **día 1** del mes, `getMonth()`/`getFullYear()` devuelven el mes anterior → el conteo de cuotas pendientes se desfasa. El resto del código ya usa `+'T00:00:00'` o split de string; aquí falta. **Fix**: `new Date(g.fecha+'T00:00:00')` o usar `getMesImp`.

### 🟡 BUG-G2 — `calcCuotasPend` no convierte moneda
Suma `g.monto/g.cuotas` sin `toARS`. Cuotas en USD se cuentan como ARS en el total de "cuotas/créditos" del dashboard y Health Score.

---

## MÓDULO INGRESOS

| Check | Estado | Detalle |
|-------|--------|---------|
| Tipos bien definidos | ✅ | `TIPOS_INGRESO` configurable + default. |
| Recurrencia | ✅ | Campo `rec` (0/1), badge "Mensual/Único". Usado en proyección. |
| Usuario se guarda | ✅ | `quien` (u1/u2/fam). |
| Duplicados detectados | 🟡 | Solo en **importación** (`detectarDuplicados`). En alta manual no hay chequeo (aceptable). |

### 🟡 `promDiario` mezcla monedas
Igual que en gastos: usa `r.monto` sin `toARS`. Promedio sin sentido si el período tiene ARS+USD.

---

## MÓDULO IMPORTAR

| Check | Estado | Detalle |
|-------|--------|---------|
| Parseo multi-formato | ✅ | Pre-filtro de líneas por regex de fecha de varios bancos AR + delega en Claude. Robusto. |
| Preview editable | ✅ | `renderImpPreview` permite editar todos los campos antes de confirmar. |
| CSV/TXT/PDF | ✅ | CSV/TXT lectura directa; PDF vía pdf.js; ambos al proxy. |
| Sugerencia de categorías | ✅ | Claude + historial de patrones (`buildPatrones`). |
| Validaciones anti-corrupción | 🟡 | Hay reparación de JSON truncado y sanitización de control chars (bien). Falta validar que `monto` sea número y `fecha` válida antes de `confirmImport`. |

### 🟡 BUG-I1 — Desincronización de `id` cliente vs servidor
`confirmImport`/`saveGasto`/`saveInv` asignan `id:nid++` local. El Apps Script `insert` **reasigna** `data.id = maxId+1` y lo guarda en el Sheet, pero el frontend **ignora** el id devuelto. Si el usuario edita/borra ese ítem **en la misma sesión sin recargar**, `DB.update/remove` usa el id local que puede no existir en el Sheet → "Registro no encontrado". **Fix**: en `DB.insert` devolver `json.id` y que los callers hagan `rec.id = r.id`.

### 🟡 BUG-I2 — Detección de duplicados con muestra parcial
`detectarDuplicados` compara contra los arrays **en memoria**. Si los datos no se recargaron desde Sheets (otro dispositivo cargó cosas), no detecta. Aceptable para uso de 2 personas, pero documentarlo.

---

## MÓDULO INVERSIONES

| Check | Estado | Detalle |
|-------|--------|---------|
| PNL se calcula | ✅ | `invToARSa - invToARS`; guarda `tI>0` antes de dividir (no NaN). |
| Distribución por tipo | ✅ | Dona por `i.tipo`, % sobre total. |
| Conversión ARS/USD | ✅ | `invToARS/invToARSa` multiplican por `cfg.tc` si `mon==='USD'`. |
| Historial sin pérdida | 🟡 | Snapshots **solo en localStorage** → se pierden al limpiar navegador o cambiar de equipo. |

### 🔴 BUG-INV1 — `saveInv` bloquea valores legítimos
Línea 3851: `if(!act||!qty||!pe||!pa)` rechaza con `0`. Casos válidos bloqueados:
- Precio de entrada `0` (airdrop, regalo).
- `pa` aún sin definir.
- `qty` fraccional que redondee… (no, parseFloat lo mantiene, pero `0.0` sí se bloquea).

**Fix**: validar con `isNaN()` y `>=0`, no con falsy (`0` es falsy). Recomendado permitir `pe>=0`, `pa>=0`, `qty>0`.

### 🟡 División por cero potencial
`Math.round(s.value/tA*100)` en la dona (línea 3515) y `pnl/tInv*100`: protegido en métricas (`tInv>0`) pero **no** en la leyenda de la dona (`s.value/tA`); si `tA===0` → `Infinity%`. Caso: portafolio con todas las posiciones a valor 0.

---

## MÓDULO METAS

| Check | Estado | Detalle |
|-------|--------|---------|
| Progreso se calcula | 🟡 | `Math.min(100,Math.round(m.act/m.obj*100))`. Si `obj===0` → `Infinity`→`min(100,Inf)=100`. Muestra 100% engañoso. Falta guardia `obj>0`. |
| Traspaso a Trofeos | ✅ | `marcarDone` setea `done` y re-renderiza. |
| Días restantes | ✅ | `(new Date(m.fecha) - new Date())/86400000`; muestra "Vencida" si ≤0. Pequeño desfase de timezone irrelevante a nivel días. |
| Orden (v7.8) | ✅ | Por importancia / % / fecha / monto. Default 999 para sin importancia. Correcto. |

---

## MÓDULO CRÉDITOS / DEUDAS

| Check | Estado | Detalle |
|-------|--------|---------|
| Sistema francés | ✅ | `tem=(1+TNA/100)^(1/12)-1`; cuota constante estándar. Correcto. |
| Tabla de amortización | ✅ | `buildAmort` itera capital/interés/saldo; `saldo=max(0,...)`. |
| Simulador de prepago | ✅ | `calcAdel` dos estrategias (reducir cuotas / reducir monto). Fórmulas correctas. |
| Proyección mes siguiente | 🟡 | Usa `calcCuotasPend` que tiene el bug de timezone (BUG-G1). |

### 🟡 OBS-DEU1 — `cuotaDet` no limita `pag > plazo`
`for(i=0;i<d.pag;i++)` — si por error `pag>plazo`, el saldo se hace 0 (ok por `max(0,...)`) pero la cuota mostrada sigue calculándose. Validar `pag ≤ plazo` en alta/edición.

### 🟡 OBS-DEU2 — TNA = 0 protegida ✅, pero TNA negativa no
`cuotaMensual` maneja `tem===0` → `cap/plazo`. Una TNA negativa (improbable) daría resultados raros. Validar `tna>=0`, `plazo>=1`.

---

## AJUSTE DE CUENTAS

| Check | Estado | Detalle |
|-------|--------|---------|
| Calcula deuda entre usuarios | ✅ | `neto=totalFam-pagConj`; `debeada=neto/2`; `u1diff=pagU1-debeada`. Lógica correcta para split 50/50. |
| Propuestas de saldo | ✅ | Sugiere transferencia o descuento de inversión. |
| Considera gastos compartidos | 🟡 | Solo `amb==='fam'`. Asume **siempre 50/50**, no proporcional al ingreso. |

### 🟡 BUG-AJ1 — Gastos familiares con `quien` fuera de {u1,u2,comp}
Si un gasto `amb==='fam'` tiene `quien` con otro valor (p. ej. importado como `'fam'`), entra en `totalFam` pero **no** en `pagU1/pagU2/pagConj` → el reparto descuadra (no suman el total). **Fix**: normalizar `quien` o incluir un "otros pagadores" explícito.

---

## Resumen de hallazgos de lógica

| ID | Severidad | Módulo | Problema |
|----|-----------|--------|----------|
| BUG-D1 | 🔴 Alta | Dashboard/Deudas | `capT` mezcla unidades → % pagado erróneo en UVA/USD |
| BUG-G1 | 🔴 Alta | Gastos/Importar/Deudas | Timezone en `calcCuotasPend`/`renderImportar` |
| BUG-INV1 | 🔴 Media | Inversiones | `saveInv` bloquea `pe/pa/qty=0` legítimos |
| BUG-D2 | 🟡 Media | Dashboard | Delta mes anterior sin `toARS` |
| BUG-G2 | 🟡 Media | Gastos | `calcCuotasPend` no convierte USD |
| BUG-I1 | 🟡 Media | Importar | Desync id cliente/servidor |
| BUG-AJ1 | 🟡 Baja | Ajuste | `quien` no estándar descuadra |
| Metas obj=0 | 🟡 Baja | Metas | 100% engañoso sin guardia |
| promDiario | 🟡 Baja | Ing/Gastos | Promedio mezcla monedas |
