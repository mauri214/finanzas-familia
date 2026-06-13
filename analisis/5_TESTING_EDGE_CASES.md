# 5 · Testing de casos extremos (edge cases)

Para cada caso: qué pasa **hoy**, qué **debería** pasar, criticidad y cómo reproducir.

---

## MÓDULO GASTOS

| Caso | Hoy | Debería | Criticidad |
|------|-----|---------|------------|
| Monto = 0 | `saveGasto` lo rechaza (`!monto`) | OK rechazar (o permitir con aviso) | Baja |
| 99 cuotas | Se acepta; prorratea `monto/99` por 99 meses | OK, pero validar tope razonable (≤120) | Baja |
| Cuota que "vence" en año pasado | `calcCuotasPend` con `new Date(fecha)` y diff negativo → no la cuenta | OK (diff>0), pero el **timezone** (BUG-G1) puede desplazar el día 1 | Media |
| Eliminar gasto con cuotas pendientes | Se borra; las cuotas futuras desaparecen del cálculo | OK, pero sin aviso de que se pierden N cuotas | Baja |
| Editar categoría a una inexistente | El `<select>` solo ofrece categorías válidas; si el dato viene del Sheet con una cat borrada, `CAT[g.cat]` es `undefined` → color `#888` y no aparece en presupuestos | Mostrar "Sin categoría" claro | Baja |
| Caracteres especiales en desc (`<script>`, `&`, emojis) | Se renderiza **sin escapar** → puede romper layout o ejecutar JS | Escapar con `escHTML` | **Alta** (XSS) |
| Fecha vacía | `saveGasto` usa `td()` (hoy) como default | OK | — |

---

## MÓDULO INVERSIONES

| Caso | Hoy | Debería | Criticidad |
|------|-----|---------|------------|
| Portafolio con 0 inversiones | Métricas en `—`, dona vacía. `renderInvCharts` maneja `!invSnapshots.length` | OK | — |
| Precio a $0 | `saveInv` lo **rechaza** (BUG-INV1) | Permitir `pe>=0`/`pa>=0` | Media |
| Precio negativo | `parseFloat` lo aceptaría si no fuera por el falsy-check; edición (`guardarPrecios`) exige `v>=0` | Validar `>=0` consistente | Baja |
| Cantidad fraccional (0.0001) | Se acepta (`parseFloat`) ✓ | OK | — |
| TC = 0 | `invToARS` con `mon=USD` → multiplica por 0 → todo USD vale 0; `faC` divide por `cfg.tc||1` (usa 1) → inconsistencia | Validar `tc>0` en config | Media |
| Posición en corto (qty negativa) | `saveInv` rechaza (`!qty` con negativo es truthy, pero 0 falla); qty<0 pasaría y daría valores negativos | Definir si se permite; si no, validar `qty>0` | Baja |

---

## MÓDULO IMPORTAR

| Caso | Hoy | Debería | Criticidad |
|------|-----|---------|------------|
| Archivo muy grande (50 MB) | pdf.js intenta cargarlo; el texto se trunca a 6000–8000 chars antes de Claude | Avisar/limitar tamaño antes de procesar | Media |
| 10.000 transacciones | El texto se trunca → Claude solo ve las primeras; `max_tokens:4096` corta la respuesta (hay reparación de JSON truncado) | Procesar por lotes / paginar | Media |
| Archivo corrupto / ilegible | pdf.js lanza error → `setImpStatus(error)` | OK, hay manejo | — |
| UTF-8 raro en descripción | Sanitizado server-side (control chars) y `\s+`→espacio | OK | — |
| Fecha inválida que devuelve Claude | Entra a `impPending` sin validar; `confirmImport` la guarda tal cual | Validar formato YYYY-MM-DD antes de confirmar | Media |
| Sin API key configurada | `callClaude` retorna error claro | OK | — |

---

## GENERAL

| Caso | Hoy | Debería | Criticidad |
|------|-----|---------|------------|
| Primer uso (sin datos) | Modo demo con datos hardcodeados; Health Score "Sin datos" si todo en 0 | OK; pero los datos demo pueden confundir ("¿de dónde salió esto?") | Baja |
| Internet desconectado | `fetch` falla → `catch` → toast "Error al guardar"; el cambio **ya está en memoria** local | OK, pero el dato local y el Sheet quedan **desincronizados** sin reintento | Media |
| API de Google cae | Igual que arriba; `loadAll` devuelve false y queda el demo | Mostrar estado "sin conexión a Sheets" persistente | Media |
| Token expira / inválido | `getAll` → `{ok:false}` → toast error; queda con datos demo | Mensaje claro "token inválido, revisá Configuración" | Media |
| Usuario cambia de nombre | `applyNames` actualiza DOM; los datos usan `u1/u2` (claves), no el nombre → seguro ✓ | OK | — |
| Año fiscal vs calendario | Todo es calendario (Ene–Dic). No hay año fiscal configurable | OK para AR | — |
| `cfg.tc` no numérico | `Number(cfgRaw.tc)` → NaN posible; `toARS` con NaN propaga NaN | Validar/sane TC al cargar | Media |
| Dos dispositivos editando a la vez | Última escritura gana; sin merge ni lock | Aceptable para 2 personas; documentar | Baja |

---

## Casos que rompen cálculos (resumen accionable)

1. **TC = 0 o NaN** → contamina toda valuación USD y `faC`. *Validar en `saveCfg` y `loadAll`.*
2. **Meta con `obj=0`** → muestra 100%. *Guardia `obj>0`.*
3. **Gasto día-1 del mes** → `calcCuotasPend` lo ubica un mes antes (timezone). *Fix `+'T00:00:00'`.*
4. **Préstamo UVA/USD** → % pagado del dashboard sale mal (BUG-D1).
5. **Descripción con `<`** → rompe HTML / XSS. *Escapar.*
