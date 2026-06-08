# Bug Reports — HouseholdCap v5.2
## Módulo: Importar con IA + revisión general

> **Metodología:** Auditoría estática de código (sin ejecución). Todos los bugs fueron encontrados leyendo `finanzas_v5.2.html` línea por línea.
> **Fecha de auditoría:** 2026-06-08
> **Auditado por:** Claude Code (sesión QA)
> **Archivo auditado:** `finanzas_v5.2.html` (2457 líneas)

---

## Niveles de Severidad

| Severidad | Descripción |
|-----------|-------------|
| 🔴 Crítico | La funcionalidad principal no funciona, datos incorrectos o perdidos |
| 🟠 Alto | Funcionalidad importante rota, existe workaround |
| 🟡 Medio | Comportamiento incorrecto pero no bloquea el flujo |
| 🟢 Bajo | Problema cosmético, de texto o inconsistencia menor |

---

## BUG-001: Ingresos importados se guardan con `quien: undefined`

**Severidad:** 🔴 Crítico
**Módulo:** Importar — confirmImport()
**Versión:** v5.2
**Línea exacta:** 2338
**Estado:** Abierto

### Descripción breve
Al confirmar la importación, los ingresos se guardan con el campo `quien` como `undefined` porque el código referencia `p.owner` en lugar de `p.quien`.

### Código con el bug
```javascript
// línea 2335-2339
const nuevosIngresos=selIngresos.map(p=>({
  id:nid++,fecha:p.fecha,desc:p.desc,
  tipo:p.cat,
  quien:p.owner,   // ← BUG: p.owner no existe. Debe ser p.quien
  monto:p.monto,rec:0
}));
```

### Impacto
- El campo `quien` llega como `undefined` al array `ingresos` en memoria
- Se guarda `undefined` en Google Sheets (columna `quien` queda vacía o con texto "undefined")
- El módulo Ingresos muestra "—" en la columna de quién
- La distribución por usuario (Modo A / Modo B) no cuenta esos ingresos para ningún usuario
- El Dashboard no los asigna a u1 ni u2

### Resultado esperado
`quien` debe tomar el valor de `p.quien`, que es seteado correctamente en `buildImpPending()` línea 1907:
```javascript
quien:owner==='fam'?(esGasto?'comp':owner):owner,
```

### Fix a aplicar en próxima sesión
```javascript
// Cambiar línea 2338:
quien:p.owner,   // ← INCORRECTO
// Por:
quien:p.quien,   // ← CORRECTO
```

---

## BUG-002: Comentario HTML del módulo Importar dice "v5.1" (desactualizado)

**Severidad:** 🟢 Bajo
**Módulo:** HTML — comentario línea 370
**Versión:** v5.2
**Línea exacta:** 370
**Estado:** Abierto

### Descripción breve
El comentario del div del módulo Importar dice `<!-- IMPORTAR v5.1 — con IA y soporte PDF -->` cuando la versión actual es v5.2.

### Impacto
Solo cosmético / documentación interna del HTML.

### Fix a aplicar en próxima sesión
```html
<!-- Cambiar línea 370: -->
<!-- IMPORTAR v5.1 — con IA y soporte PDF -->
<!-- Por: -->
<!-- IMPORTAR v5.2 — con IA y soporte PDF -->
```

---

## BUG-003: La proyección financiera no avanza de año — queda fija al año actual

**Severidad:** 🟠 Alto
**Módulo:** Dashboard — calcProyeccion()
**Versión:** v5.2
**Línea exacta:** 1176
**Estado:** Abierto

### Descripción breve
`calcProyeccion()` itera desde el mes actual (`curM`) hasta diciembre (mes 11) del año actual (`curY`). Si el usuario navega al Dashboard en diciembre, la proyección muestra solo 1 mes. Si navega en enero del año siguiente, no muestra nada (el loop `for(let m=curM;m<=11;m++)` devuelve array vacío porque `curM=0` y la condición es `m<=11`, lo cual sí da 12 iteraciones — pero el año usado siempre es `curY`, no necesariamente el año en curso).

### Problema más sutil
La proyección usa `curY` que es el año del **mes seleccionado en el navegador del Dashboard**, no el año actual del calendario. Si el usuario navega a enero 2025 en el Dashboard para revisar datos históricos, la proyección intenta proyectar desde enero 2025 hasta diciembre 2025, usando cuotas pendientes calculadas para ese año pasado. Los números de la proyección serán incorrectos.

### Código con el bug
```javascript
// línea 1176
for(let m=curM;m<=11;m++){
  const cTarj=calcCuotasPend(m,curY);  // curY puede ser un año pasado
```

### Impacto
- Si el usuario está navegando un mes pasado en el Dashboard, la proyección proyecta hacia el pasado, no hacia diciembre del año real.
- Potencialmente confuso: los números de proyección cambian según el mes seleccionado en el navegador, no según la fecha real.

### Fix sugerido para próxima sesión
Usar `new Date().getFullYear()` y `new Date().getMonth()` en `calcProyeccion()`, en lugar de `curM` y `curY` que dependen de la navegación del usuario.

---

## BUG-004: `calcCuotasPend` en proyección acumula cuotas de meses ya pasados

**Severidad:** 🟡 Medio
**Módulo:** Dashboard — calcProyeccion() → calcCuotasPend()
**Versión:** v5.2
**Línea exacta:** 1177 (llamada), 2011-2014 (función)
**Estado:** Abierto

### Descripción breve
`calcCuotasPend(m, curY)` devuelve la suma de cuotas de tarjeta pendientes para un mes y año dado. La lógica es correcta para meses futuros. Pero cuando `calcProyeccion` la llama con meses que ya pasaron (ej: si `curM` = 3 y la proyección calcula m=3 a m=11, junio ya pasó), los montos de cuotas de meses pasados se incluyen igualmente en la proyección.

### Código involucrado
```javascript
// calcCuotasPend — línea 2011
function calcCuotasPend(m,y){
  let t=0;
  gastos.forEach(g=>{
    if(g.cuotas<=1)return;
    const gd=new Date(g.fecha);
    const diff=(y-gd.getFullYear())*12+(m-gd.getMonth());
    if(diff>0&&diff<g.cuotas)t+=g.monto/g.cuotas  // no distingue si ese mes ya pasó
  });
  return t;
}
```

### Impacto
- La proyección de cuotas de tarjeta es correcta para meses futuros.
- Para el mes actual (que ya está en curso), incluye cuotas que quizás ya se pagaron.
- Impacto visual: el gráfico de barras puede sobrestimar compromisos.

---

## BUG-005: Ajuste de cuentas tiene fecha hardcodeada

**Severidad:** 🟡 Medio
**Módulo:** Gastos — input ajuste-mes
**Versión:** v5.2
**Línea exacta:** 363
**Estado:** Abierto

### Descripción breve
El input de mes para el ajuste de cuentas tiene el valor hardcodeado en el HTML:
```html
<input type="month" id="ajuste-mes" value="2026-06" onchange="renderAjuste()"/>
```
El valor `2026-06` está escrito directamente en el HTML en lugar de calcularse dinámicamente como el mes actual.

### Impacto
Cuando pase junio 2026, el selector arranca en junio 2026 en lugar del mes en curso. El usuario tiene que cambiarlo manualmente cada vez.

### Fix sugerido para próxima sesión
Eliminar `value="2026-06"` del HTML y setear el valor dinámicamente en el `init` al final del script:
```javascript
document.getElementById('ajuste-mes').value = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
```

---

## BUG-006: Cuota importada con `cuotaActual > cuotasTotal` no se corrige correctamente

**Severidad:** 🟡 Medio
**Módulo:** Importar — buildImpPending() y renderImpPreview()
**Versión:** v5.2
**Líneas exactas:** 1895-1898 y 1956
**Estado:** Abierto

### Descripción breve
En `buildImpPending()` se calcula:
```javascript
const cuotasTotal = Math.max(
  parseInt(t.cuotasTotal||...)||1,
  cuotaActual
);
```
Esto garantiza que `cuotasTotal >= cuotaActual`. Pero en el render del preview (línea 1956), se hace:
```javascript
const cuotasTotal=Math.max(p.cuotas||1, cuotaActual);
```
Este `Math.max` se recalcula en el render usando `p.cuotas` (que ya fue ajustado en `buildImpPending`), por lo que debería estar bien. Sin embargo, si el usuario edita el campo `cuotaActual` en el preview a un valor mayor que `cuotasTotal`, el objeto `impPending[i].cuotaActual` queda mayor que `impPending[i].cuotas`, y la condición:
```javascript
onchange="impPending[${i}].cuotas=Math.max(+this.value,impPending[${i}].cuotaActual||1)"
```
solo se aplica al campo de "total" cuando el usuario lo edita, no al campo de "actual". Si el usuario cambia el "actual" a un valor imposible (ej: cuota 5 de 3), no hay validación.

### Impacto
Un extracto donde Claude devuelve datos de cuotas invertidos podría generar notas en Sheets tipo "Cuota 5/3", incoherentes.

---

## BUG-007: Variación anual en tabla comparativa aplica colores invertidos

**Severidad:** 🟡 Medio
**Módulo:** Dashboard Anual — yrTable()
**Versión:** v5.2
**Línea exacta:** 1423
**Estado:** Abierto

### Descripción breve
La tabla comparativa anual colorea la variación de gastos por categoría así:
```javascript
r.vals[2]-r.vals[1]>=0?'neg':'pos'
```
Aplicado a **gastos**, un incremento (`>=0`) se colorea como `.neg` (rojo) — esto está bien: gastar más es negativo. Pero el texto de la clase `pos` en gastos implica "positivo" visualmente (verde), cuando en realidad significa "gastaste menos". Podría confundir: un -30% en gastos se muestra en verde (correcto), pero un +50% en gastos se muestra en rojo — aquí el rojo está bien, pero la lógica se invierte si en el futuro se agrega la misma tabla para ingresos.

### Impacto
Bajo — la lógica actual es visualmente correcta para gastos. Se vuelve un problema si se reutiliza el mismo código para ingresos.

---

## BUG-008: `quien` en el selector de importación para ingresos familiares queda como `'fam'` pero Sheets espera otro valor

**Severidad:** 🟠 Alto
**Módulo:** Importar — buildImpPending()
**Versión:** v5.2
**Línea exacta:** 1907
**Estado:** Abierto

### Descripción breve
Para ingresos (cuando `esGasto=false`), el campo `quien` se setea así:
```javascript
quien:owner==='fam'?(esGasto?'comp':owner):owner
```
Cuando `owner='fam'` y `esGasto=false`, devuelve `owner` = `'fam'`.

Sin embargo, el módulo de Ingresos y el esquema de Google Sheets usan `'u1'`, `'u2'`, o `'fam'` para ingresos. Usar `'fam'` para un ingreso importado es válido, pero en la función `renderIngresos()` se filtran ingresos por `i.quien==='u1'`, `i.quien==='u2'`, `i.quien==='fam'`. El valor `'fam'` es reconocido.

Sin embargo, combinado con BUG-001 (donde `p.owner` es undefined), el resultado real es que `quien` queda como `undefined`, no `'fam'`.

**Este bug es consecuencia directa de BUG-001** — con el fix de BUG-001 (`p.quien` en lugar de `p.owner`), este comportamiento quedaría correcto.

### Estado
Dependiente de BUG-001. Se cierra automáticamente al fixear BUG-001.

---

## BUG-009: `getRecurrentes()` puede devolver duplicados en edge case

**Severidad:** 🟢 Bajo
**Módulo:** Dashboard — getRecurrentes()
**Versión:** v5.2
**Líneas exactas:** 1138–1168
**Estado:** Abierto

### Descripción breve
La función `getRecurrentes()` tiene una lógica de merge en tres pasos:
1. Agrega manuales que NO están en candidatos
2. Agrega candidatos detectados
3. Agrega manuales que SÍ están en candidatos (si no están ya en `merged`)

El paso 3 tiene una condición `if(!merged.find(...))` que debería prevenir duplicados, pero el paso 1 puede agregar un manual, y el paso 2 puede luego agregar el mismo ítem si lo detectó como candidato (porque `savedMap[key]` lo reconocería, pero en paso 1 ya se lo agregó). La lógica del paso 3 dice "manuales que ya estaban como candidatos" — este grupo no debería agregarse si el paso 2 ya los incluyó. La condición en paso 3 debería funcionar, pero la combinación de los tres pasos es difícil de razonar y podría producir duplicados en casos borde (ej: un ítem manual que fue detectado como candidato y cuyo `lower().trim()` coincide con otro candidato con distinto case).

### Impacto
Bajo — en uso normal con descripciones únicas no debería ocurrir. Visible como dos filas idénticas en el sub-widget de recurrentes.

---

## BUG-010: El modal de Claude API key describe una configuración que NO aplica

**Severidad:** 🟡 Medio
**Módulo:** Modal "Config. IA" — modal-claude-key
**Versión:** v5.2
**Líneas exactas:** 617–637
**Estado:** Abierto

### Descripción breve
El modal de configuración de IA muestra instrucciones para guardar la API key **en el browser** (`localStorage`), pero el texto dice:
> "La API key de Claude se guarda en Script Properties del proyecto Apps Script, no en el browser."

Y luego muestra los pasos para configurarla en Apps Script Script Properties — lo cual es correcto. Pero el código tiene esta constante en el JS que nunca se usa funcionalmente:
```javascript
const CLAUDE_KEY_LS='householdcap_claude_api_key';
const getClaudeKey=()=>localStorage.getItem(CLAUDE_KEY_LS)||'';
```
`getClaudeKey()` se llama en `renderImpPreview()` (línea 1928) para mostrar el badge "Interpretado con IA":
```javascript
${getClaudeKey()?'<span class="ia-badge">...IA</span>':''}
```
Pero como la key nunca se guarda en localStorage (el modal no tiene ningún input para guardarla ahí), este badge **nunca se muestra**, independientemente de si la IA está funcionando o no.

### Impacto
- El badge "Interpretado con IA" nunca aparece en el preview, aunque la IA haya funcionado correctamente.
- El código de `getClaudeKey()` / `CLAUDE_KEY_LS` es código muerto.
- Confusión para el desarrollador que lea el código.

---

## BUG-011: Sin manejo de error si `clearImport()` se llama con `imp-ia-status` visible en modo texto

**Severidad:** 🟢 Bajo
**Módulo:** Importar — clearImport()
**Versión:** v5.2
**Líneas exactas:** 2002–2010
**Estado:** Abierto

### Descripción breve
```javascript
function clearImport(){
  impPending=[];
  document.getElementById('imp-text').value='';
  document.getElementById('imp-file-info').textContent='';
  document.getElementById('imp-preview-section').style.display='none';
  setImpStatus('','ok');
  setImpStatus('','ok','imp-ia-status-texto');
  document.getElementById('file-input').value='';
}
```
La llamada `setImpStatus('','ok')` con string vacío oculta el status (correcto). Pero `setImpStatus('','ok','imp-ia-status-texto')` asume que `imp-ia-status-texto` existe — y existe en el HTML. Sin embargo, si por algún motivo el DOM no tuviera ese elemento, fallaría silenciosamente (la función tiene un guard `if(!el) return`, así que no crashea). Esto está bien. **No es un bug real**, es una observación de código defensivo correcto.

**Reclasificado:** No es bug. Eliminado del conteo.

---

## BUG-012: `processImportBasico` usa la fecha del campo `imp-mes` pero no valida que exista

**Severidad:** 🟢 Bajo
**Módulo:** Importar — processImportBasico()
**Versión:** v5.2
**Líneas exactas:** 1846–1876
**Estado:** Abierto

### Descripción breve
```javascript
const mesVal=document.getElementById('imp-mes').value;
const [mesY,mesM]=mesVal.split('-').map(Number);
```
Si el campo `imp-mes` está vacío (el usuario lo borró manualmente), `mesVal` sería `''`, y `mesVal.split('-')` devolvería `['']`, causando que `mesY=NaN` y `mesM=NaN`. La fecha construida sería `NaN-NaN-dd`, que no es una fecha válida. Los gastos se guardarían con fecha inválida en Sheets.

### Impacto
Bajo — el input `type="month"` del navegador normalmente no permite dejarlo vacío en Chrome/Firefox. En Safari podría comportarse diferente.

---

## BUG-013: `renderImpPreview()` usa `getClaudeKey()` para decidir si mostrar el badge de IA, pero la key nunca se guarda en localStorage

**Severidad:** 🟡 Medio
**Módulo:** Importar — renderImpPreview()
**Versión:** v5.2
**Línea exacta:** 1928
**Estado:** Abierto

### Descripción breve
*(Este bug es la segunda mitad del BUG-010, merece su propio registro porque afecta la UX directamente)*

```javascript
${getClaudeKey()?'<span class="ia-badge"><i class="ti ti-robot"></i> Interpretado con IA</span>':''}
```

El badge "Interpretado con IA" depende de `getClaudeKey()` → `localStorage.getItem('householdcap_claude_api_key')`. Esta key nunca se guarda en ningún lugar del código. El modal de Config. IA no tiene un input para guardar la key en localStorage.

**Resultado:** El badge "Interpretado con IA" NUNCA aparece, aunque Claude haya interpretado las transacciones correctamente. El usuario no tiene confirmación visual de que la IA procesó su extracto.

### Fix sugerido para próxima sesión
Usar la flag `hc_ia_ok` que sí se guarda (en `updateIAConfigBtn`), o agregar una variable local `let iaUsada = false` que se setea a `true` en `buildImpPending` cuando viene de la API y mostrarlo en el render.

---

## BUG-014: `renderDashAnual` — el color del PNL total muestra incorrecto en el card de métricas

**Severidad:** 🟢 Bajo
**Módulo:** Dashboard Anual — renderDashAnual()
**Versión:** v5.2
**Línea exacta:** 1446–1447
**Estado:** Abierto

### Descripción breve
```javascript
<div class="met green"><div class="ml">Valor actual</div><div class="mv">${fa(inversiones.reduce(...)}</div></div>
<div class="met green"><div class="ml">PNL</div><div class="mv">${fa(...)}</div></div>
```
El card de "PNL" en la vista anual siempre usa la clase `green` independientemente de si el PNL es positivo o negativo. Si el portfolio está en pérdida, se muestra en verde de todas formas.

En la vista mensual del Dashboard, el mismo dato sí cambia de color correctamente (línea 1060):
```javascript
<div class="met ${pnl>=0?'green':'red'}">
```

### Impacto
Visual — si el portfolio está en pérdida, el widget anual muestra el PNL en verde de todas formas.

### Fix sugerido para próxima sesión
```javascript
// Cambiar en renderDashAnual (aprox línea 1447):
<div class="met green"><div class="ml">PNL</div>
// Por:
<div class="met ${inversiones.reduce((a,i)=>a+toARSa(i)-toARS(i),0)>=0?'green':'red'}"><div class="ml">PNL</div>
```

---

## BUG-015: La proyección no considera el mes actual del calendario, sino `curM`

**Severidad:** 🟠 Alto
**Módulo:** Dashboard — renderProyeccion()
**Versión:** v5.2
**Línea exacta:** 1176 (ya señalado en BUG-003, pero hay un aspecto adicional)
**Estado:** Abierto

### Descripción breve (aspecto adicional al BUG-003)
El título del widget dice "Proyección financiera hasta diciembre 2026". Si el usuario navega a mayo 2026 en el Dashboard, la proyección empieza desde mayo, no desde junio (mes actual real). Esto puede hacer que el primer bar del gráfico corresponda a un mes ya pasado, con cuotas que ya se pagaron.

La proyección debería siempre empezar desde el mes real de hoy (`new Date().getMonth()`), sin importar qué mes está navegando el usuario.

---

## Resumen final de bugs

| ID | Título resumido | Severidad | Módulo | Estado |
|----|----------------|-----------|--------|--------|
| BUG-001 | `p.owner` undefined en ingresos importados | 🔴 Crítico | Importar | Abierto |
| BUG-002 | Comentario HTML dice v5.1 | 🟢 Bajo | HTML | Abierto |
| BUG-003 | Proyección usa curM/curY en vez de fecha real | 🟠 Alto | Dashboard | Abierto |
| BUG-004 | Cuotas proyección incluye meses pasados | 🟡 Medio | Dashboard | Abierto |
| BUG-005 | Fecha ajuste de cuentas hardcodeada | 🟡 Medio | Gastos | Abierto |
| BUG-006 | Sin validación cuotaActual > cuotasTotal en preview | 🟡 Medio | Importar | Abierto |
| BUG-007 | Colores variación anual podrían confundir en ingresos | 🟢 Bajo | Dashboard | Abierto |
| BUG-008 | `quien` en ingresos = 'fam' (consecuencia BUG-001) | 🟠 Alto | Importar | Depende BUG-001 |
| BUG-009 | Posibles duplicados en getRecurrentes() edge case | 🟢 Bajo | Dashboard | Abierto |
| BUG-010 | getClaudeKey() / CLAUDE_KEY_LS es código muerto | 🟡 Medio | Importar | Abierto |
| BUG-012 | imp-mes vacío genera fecha NaN en parser básico | 🟢 Bajo | Importar | Abierto |
| BUG-013 | Badge "Interpretado con IA" nunca se muestra | 🟡 Medio | Importar | Abierto |
| BUG-014 | PNL en Dashboard anual siempre en verde | 🟢 Bajo | Dashboard | Abierto |
| BUG-015 | Proyección puede empezar en mes pasado | 🟠 Alto | Dashboard | Abierto |

**Totales:**
- 🔴 Críticos: **1** (BUG-001)
- 🟠 Altos: **3** (BUG-003, BUG-008, BUG-015)
- 🟡 Medios: **5** (BUG-004, BUG-005, BUG-006, BUG-010, BUG-013)
- 🟢 Bajos: **5** (BUG-002, BUG-007, BUG-009, BUG-012, BUG-014)
- **Total: 14 bugs**

---

## Resultado del QA según criterios de aceptación

Según `CHECKLIST_ACEPTACION.md`:

```
🚫 QA RECHAZADO si:
  • > 1 bug crítico sin workaround   → 1 crítico (BUG-001) — FALLA
```

**Estado: QA RECHAZADO** — hay 1 bug crítico (BUG-001) que hace que todos los ingresos importados lleguen con `quien: undefined` a Sheets y al módulo de ingresos. Debe corregirse antes de mergear a producción.

---

## Orden de prioridad de fixes para próxima sesión

### Prioridad 1 — Crítico (bloquea producción)
1. **BUG-001** — `p.owner` → `p.quien` en `confirmImport()` línea 2338

### Prioridad 2 — Altos (fix antes de siguiente release)
2. **BUG-003 + BUG-015** — Proyección debe usar `new Date()` en vez de `curM/curY`
3. **BUG-008** — Se resuelve solo con BUG-001

### Prioridad 3 — Medios (fix deseable en v5.2.1)
4. **BUG-013** — Badge "Interpretado con IA" nunca aparece (mala UX)
5. **BUG-005** — Fecha hardcodeada en ajuste de cuentas
6. **BUG-010** — Limpiar código muerto `CLAUDE_KEY_LS` / `getClaudeKey()`
7. **BUG-004** — Cuotas de meses pasados en proyección
8. **BUG-006** — Validación cuota actual vs total en preview

### Prioridad 4 — Bajos (backlog)
9. **BUG-014** — PNL anual siempre en verde
10. **BUG-002** — Comentario HTML desactualizado
11. **BUG-007** — Colores variación anual
12. **BUG-009** — Edge case duplicados en recurrentes
13. **BUG-012** — Fecha NaN en parser básico con campo mes vacío

---

*Auditoría completada: 2026-06-08 | Método: revisión estática de código | Sin ejecución real*
