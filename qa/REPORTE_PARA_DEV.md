# Reporte QA → Dev — HouseholdCap v5.2
## Para leer al inicio de la sesión de fixes

> **Generado por:** Auditoría estática de código (sin ejecución)
> **Fecha:** 2026-06-08
> **Archivo auditado:** `finanzas_v5.2.html` (2457 líneas)
> **Resultado:** 🚫 QA RECHAZADO — 1 bug crítico, 3 altos, 5 medios, 5 bajos

---

## Instrucciones para esta sesión

1. Leer este documento completo antes de tocar código
2. Trabajar en la rama `main` (donde está el código de desarrollo)
3. Fixear en orden de prioridad (crítico → altos → medios → bajos)
4. Guardar cada versión antes de cambiar: el archivo activo es `finanzas_v5.2.html`
5. Al terminar los fixes, actualizar `PROYECTO.md` con los cambios

---

## 🔴 CRÍTICO — Fix antes de cualquier otra cosa

### BUG-001: `p.owner` undefined en ingresos importados
**Archivo:** `finanzas_v5.2.html`
**Función:** `confirmImport()`
**Línea:** 2338

**Problema:** El campo `quien` de los ingresos importados se guarda como `undefined` porque el código usa `p.owner` que no existe en el objeto. Debería ser `p.quien`.

**Código actual (incorrecto):**
```javascript
const nuevosIngresos=selIngresos.map(p=>({
  id:nid++,fecha:p.fecha,desc:p.desc,
  tipo:p.cat,
  quien:p.owner,   // ← p.owner no existe, siempre undefined
  monto:p.monto,rec:0
}));
```

**Código corregido:**
```javascript
const nuevosIngresos=selIngresos.map(p=>({
  id:nid++,fecha:p.fecha,desc:p.desc,
  tipo:p.cat,
  quien:p.quien,   // ← correcto
  monto:p.monto,rec:0
}));
```

**Impacto si no se corrige:** todos los ingresos importados llegan a Google Sheets y al módulo Ingresos con `quien: undefined`. No se asignan a ningún usuario. La distribución Modo A/B y el Dashboard no los contabilizan por persona.

---

## 🟠 ALTOS — Fix antes de pasar a producción

### BUG-003 + BUG-015: La proyección usa el mes navegado, no el mes real
**Archivo:** `finanzas_v5.2.html`
**Función:** `calcProyeccion()`
**Línea:** 1176

**Problema:** La proyección financiera del Dashboard itera desde `curM` (el mes que el usuario está navegando) hasta diciembre. Si el usuario navega a un mes pasado para ver historial, la proyección empieza desde ese mes pasado. La proyección debería siempre empezar desde el mes real de hoy.

**Código actual (incorrecto):**
```javascript
function calcProyeccion(recurrentes){
  const ingRec=ingresos.filter(i=>i.rec==1||i.rec==='1').reduce((a,i)=>a+i.monto,0);
  const gastRec=recurrentes.filter(r=>r.activo).reduce((a,r)=>a+r.monto,0);
  const cDeuM=deudas.reduce((a,d)=>a+cuotaMensual(d),0);
  const meses=[];
  let acum=0;
  for(let m=curM;m<=11;m++){           // ← usa curM (mes navegado)
    const cTarj=calcCuotasPend(m,curY); // ← usa curY (año navegado)
    ...
  }
}
```

**Código corregido:**
```javascript
function calcProyeccion(recurrentes){
  const hoy=new Date();
  const mesHoy=hoy.getMonth();
  const anioHoy=hoy.getFullYear();
  const ingRec=ingresos.filter(i=>i.rec==1||i.rec==='1').reduce((a,i)=>a+i.monto,0);
  const gastRec=recurrentes.filter(r=>r.activo).reduce((a,r)=>a+r.monto,0);
  const cDeuM=deudas.reduce((a,d)=>a+cuotaMensual(d),0);
  const meses=[];
  let acum=0;
  for(let m=mesHoy;m<=11;m++){            // ← usa fecha real
    const cTarj=calcCuotasPend(m,anioHoy); // ← usa fecha real
    const disponible=ingRec-gastRec-cTarj-cDeuM;
    acum+=disponible;
    meses.push({m,ingresos:ingRec,gastosRec:gastRec,cuotas:cTarj,deudas:cDeuM,disponible,acumulado:acum});
  }
  return meses;
}
```

**Impacto si no se corrige:** si el usuario navega a mayo en el Dashboard para revisar el historial, la proyección muestra barras desde mayo (mes pasado), con cuotas que ya se pagaron. Los números son incorrectos y el gráfico confunde.

---

### BUG-008: Consecuencia directa de BUG-001
Se cierra automáticamente al aplicar el fix de BUG-001. No requiere acción adicional.

---

## 🟡 MEDIOS — Fix deseable en esta sesión o en v5.2.1

### BUG-013: Badge "Interpretado con IA" nunca aparece
**Archivo:** `finanzas_v5.2.html`
**Función:** `renderImpPreview()`
**Línea:** 1928

**Problema:** El badge que confirma al usuario que Claude interpretó las transacciones depende de `getClaudeKey()`, que lee `localStorage.getItem('householdcap_claude_api_key')`. Esa key nunca se guarda en ningún lugar del código (el modal de Config. IA no tiene input para guardarla en localStorage — la key vive en el Apps Script). El badge nunca aparece.

**Código actual (incorrecto):**
```javascript
${getClaudeKey()?'<span class="ia-badge"><i class="ti ti-robot"></i> Interpretado con IA</span>':''}
```

**Fix sugerido — opción A (más simple):** usar la flag `hc_ia_ok` que sí se guarda:
```javascript
${localStorage.getItem('hc_ia_ok')==='1'&&DB.enabled()?'<span class="ia-badge"><i class="ti ti-robot"></i> Interpretado con IA</span>':''}
```

**Fix sugerido — opción B (más preciso):** agregar una variable local `let iaUsada=false` seteada en `true` dentro del bloque `try` de `processPDF` y `processImportTexto` cuando la llamada a Claude API tiene éxito, y usarla en el render.

Adicionalmente, limpiar el código muerto:
- Eliminar `const CLAUDE_KEY_LS='householdcap_claude_api_key'` (línea 1610)
- Eliminar `const getClaudeKey=()=>localStorage.getItem(CLAUDE_KEY_LS)||''` (línea 1611)

**Impacto si no se corrige:** el usuario nunca sabe visualmente si la IA procesó su extracto o si fue el parser básico. Mala experiencia de usuario.

---

### BUG-005: Fecha del ajuste de cuentas hardcodeada en HTML
**Archivo:** `finanzas_v5.2.html`
**Elemento HTML:** `id="ajuste-mes"`
**Línea:** 363

**Problema:** El selector de mes del ajuste de cuentas tiene `value="2026-06"` hardcodeado en el HTML. A partir de julio 2026 el selector arranca en un mes pasado y hay que cambiarlo a mano cada vez.

**Código actual (incorrecto):**
```html
<input type="month" id="ajuste-mes" value="2026-06" onchange="renderAjuste()"/>
```

**Fix:** eliminar el `value` del HTML y setearlo dinámicamente en el bloque `// ======= INIT =======` al final del script (aprox. línea 2442):
```javascript
// Agregar junto a los otros inits:
const _hoy=new Date();
document.getElementById('ajuste-mes').value=`${_hoy.getFullYear()}-${String(_hoy.getMonth()+1).padStart(2,'0')}`;
```

---

### BUG-010: `getClaudeKey()` / `CLAUDE_KEY_LS` es código muerto
**Archivo:** `finanzas_v5.2.html`
**Líneas:** 1610–1611

**Problema:** Estas dos líneas definen una constante y función que nunca cumplen ningún propósito real (ver BUG-013). Son código muerto que puede confundir.

```javascript
const CLAUDE_KEY_LS='householdcap_claude_api_key';  // ← nunca se escribe en localStorage
const getClaudeKey=()=>localStorage.getItem(CLAUDE_KEY_LS)||'';  // ← siempre retorna ''
```

**Fix:** eliminar ambas líneas una vez resuelto BUG-013 (que deja de usar `getClaudeKey()`).

---

### BUG-004: La proyección incluye cuotas de tarjeta de meses ya pasados
**Archivo:** `finanzas_v5.2.html`
**Función:** `calcCuotasPend()`
**Línea:** 2011–2014

**Problema:** `calcCuotasPend(m, y)` no distingue si el mes `m` ya pasó o está en el futuro. Cuando la proyección lo llama para el mes actual (que ya está en curso), incluye cuotas que quizás ya se pagaron. Esto sobrestima los compromisos del mes actual.

**Código actual:**
```javascript
function calcCuotasPend(m,y){
  let t=0;
  gastos.forEach(g=>{
    if(g.cuotas<=1)return;
    const gd=new Date(g.fecha);
    const diff=(y-gd.getFullYear())*12+(m-gd.getMonth());
    if(diff>0&&diff<g.cuotas)t+=g.monto/g.cuotas  // no verifica si ya pasó
  });
  return t;
}
```

**Fix sugerido:** este fix es opcional para la proyección — la función en sí es correcta para su uso en el módulo Importar (cuotas próximo mes) y en el módulo Deudas. Para la proyección específicamente, el fix de BUG-003 (usar fecha real) ya mitiga bastante el problema porque el primer mes proyectado sería el mes actual, y las cuotas pendientes para ese mes son las correctas.

---

### BUG-006: Sin validación cuando `cuotaActual > cuotasTotal` en preview editable
**Archivo:** `finanzas_v5.2.html`
**Función:** `renderImpPreview()`
**Líneas:** 1958–1962

**Problema:** El usuario puede editar el campo "cuota actual" a un valor mayor que "cuotas total" sin que la app lo corrija. Por ejemplo: Cuota 5 de 3. El registro se guarda con nota "Cuota 5/3" en Sheets, que es incoherente.

**Fix sugerido:** en el `onchange` del input de `cuotaActual`, agregar validación:
```javascript
// Cambiar:
onchange="impPending[${i}].cuotaActual=+this.value"
// Por:
onchange="impPending[${i}].cuotaActual=+this.value;if(impPending[${i}].cuotaActual>impPending[${i}].cuotas)impPending[${i}].cuotas=impPending[${i}].cuotaActual;renderImpPreview()"
```

---

## 🟢 BAJOS — Backlog, baja urgencia

### BUG-014: PNL en Dashboard anual siempre en verde
**Archivo:** `finanzas_v5.2.html`
**Función:** `renderDashAnual()`
**Línea:** ~1447

**Problema:** El card de "PNL" en la vista anual usa clase `green` hardcodeada, sin importar si el portfolio está en pérdida. En la vista mensual sí es dinámico.

**Fix:**
```javascript
// Cambiar:
<div class="met green"><div class="ml">PNL</div><div class="mv">${fa(inversiones.reduce((a,i)=>a+toARSa(i)-toARS(i),0))}</div></div>
// Por:
<div class="met ${inversiones.reduce((a,i)=>a+toARSa(i)-toARS(i),0)>=0?'green':'red'}"><div class="ml">PNL</div><div class="mv">${fa(inversiones.reduce((a,i)=>a+toARSa(i)-toARS(i),0))}</div></div>
```

---

### BUG-002: Comentario HTML del módulo Importar dice v5.1
**Línea:** 370

**Fix:**
```html
<!-- Cambiar: -->
<!-- IMPORTAR v5.1 — con IA y soporte PDF -->
<!-- Por: -->
<!-- IMPORTAR v5.2 — con IA y soporte PDF -->
```

---

### BUG-009: Posibles duplicados en `getRecurrentes()` en edge case
**Función:** `getRecurrentes()`
**Líneas:** 1138–1168

**Problema:** La lógica de merge en 3 pasos puede producir entradas duplicadas en casos borde donde un ítem manual fue también detectado como candidato automático con variaciones de capitalización o espacios en la descripción.

**Fix sugerido:** simplificar el merge usando un `Map` por clave normalizada para garantizar unicidad, o agregar un `filter` de deduplicación al final de `getRecurrentes()`:
```javascript
// Agregar al final de getRecurrentes(), antes del return:
const seen=new Set();
return merged.filter(r=>{const k=r.desc.toLowerCase().trim();if(seen.has(k))return false;seen.add(k);return true;});
```

---

### BUG-012: `processImportBasico` genera fecha `NaN` si `imp-mes` está vacío
**Función:** `processImportBasico()`
**Líneas:** 1848–1849

**Problema:** Si el campo `imp-mes` está vacío, `mesVal.split('-')` produce `['']` y `mesY`/`mesM` quedan como `NaN`. La fecha resultante sería inválida.

**Fix sugerido:** agregar fallback:
```javascript
const mesVal=document.getElementById('imp-mes').value || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
```

---

### BUG-007: Colores de variación en tabla anual solo son correctos para gastos
**Función:** `yrTable()` dentro de `renderDashAnual()`
**Línea:** 1423

**Observación:** La lógica `r.vals[2]-r.vals[1]>=0?'neg':'pos'` es correcta para gastos (más gasto = rojo). Si en el futuro se agrega una tabla similar para ingresos, la lógica debería invertirse. No es un bug hoy, es deuda técnica a documentar.

---

## Mejoras adicionales (no son bugs)

### M-001: No hay detección de duplicados al importar el mismo PDF dos veces
**Prioridad:** Alta
**Descripción:** Si el usuario importa el mismo extracto dos veces, todos los registros se duplican en Google Sheets sin ningún aviso. No hay ningún mecanismo de detección.

**Sugerencia de implementación:** al confirmar la importación, comparar las transacciones a guardar contra los últimos N registros del mismo mes en `gastos[]`. Si descripción + fecha + monto coinciden exactamente, omitir o preguntar al usuario.

---

### M-002: No hay timeout en la llamada `fetch` al Apps Script
**Prioridad:** Media
**Descripción:** Si el Apps Script no responde (servidor caído, demora en Claude API), el `fetch` de `parseWithClaudeAPI()` puede quedar esperando indefinidamente. La UI muestra el spinner pero nunca sale del estado de carga.

**Fix sugerido:** usar `AbortController` con un timeout de 30 segundos:
```javascript
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),30000);
const res=await fetch(DB.url,{method:'POST',body:JSON.stringify(body),signal:controller.signal});
clearTimeout(timeout);
```

---

### M-004: El título de la proyección debería usar el año real, no `curY`
**Prioridad:** Baja
**Línea:** 1079
**Descripción:** El título dice `"hasta diciembre ${curY}"`. Si el usuario navega en el Dashboard a un año pasado, el título dice "hasta diciembre 2025" aunque la proyección debería siempre ser hacia diciembre del año real. Se resuelve solo con el fix de BUG-003.

---

## Resumen de cambios a realizar

| Prioridad | Bug/Mejora | Archivo | Línea | Tipo de cambio |
|-----------|-----------|---------|-------|----------------|
| 🔴 1 | BUG-001: `p.owner` → `p.quien` | v5.2.html | 2338 | 1 palabra |
| 🟠 2 | BUG-003/015: proyección con fecha real | v5.2.html | 1170–1183 | ~8 líneas |
| 🟡 3 | BUG-013: badge IA + limpiar getClaudeKey | v5.2.html | 1610, 1928 | ~3 líneas |
| 🟡 4 | BUG-005: fecha ajuste de cuentas dinámica | v5.2.html | 363, ~2442 | 2 líneas |
| 🟡 5 | BUG-010: eliminar código muerto | v5.2.html | 1610–1611 | 2 líneas |
| 🟡 6 | BUG-006: validar cuotaActual ≤ cuotasTotal | v5.2.html | 1959 | 1 línea |
| 🟢 7 | BUG-014: PNL anual dinámico | v5.2.html | ~1447 | 1 línea |
| 🟢 8 | BUG-002: comentario v5.1 → v5.2 | v5.2.html | 370 | 1 palabra |
| 🟢 9 | BUG-009: deduplicar getRecurrentes | v5.2.html | 1168 | 3 líneas |
| 🟢 10 | BUG-012: fallback fecha en parser básico | v5.2.html | 1848 | 1 línea |
| ✨ 11 | M-001: anti-duplicados en importación | v5.2.html | confirmImport | Feature nueva |
| ✨ 12 | M-002: timeout en fetch al Apps Script | v5.2.html | parseWithClaudeAPI | ~5 líneas |

---

## Contexto del proyecto para esta sesión

- **Archivo a modificar:** `finanzas_v5.2.html`
- **Rama de trabajo:** `main` (donde está el desarrollo)
- **Google Sheets:** no requiere cambios de estructura — todos los bugs son de lógica frontend
- **Apps Script:** no requiere cambios — los bugs están todos en el HTML
- **Después de los fixes:** guardar como `finanzas_v5.2.html` (misma versión, son correcciones) o `finanzas_v5.3.html` si se agrega M-001 o M-002

---

*Documento generado por sesión QA — rama qa/testing-v5.1 — 2026-06-08*
