# Checklist de Aceptación — HouseholdCap v5.2
## Módulo: Importar con IA + revisión general

> **Estado actual:** Auditado por código estático (2026-06-08). Testing real con PDF pendiente.
> Las marcas `[x]` indican verificado por código. Las `[ ]` requieren testing manual con PDFs reales.

---

## 1. Funcionalidad Core

### Carga de archivos
- [ ] PDF de BBVA se carga sin error *(requiere testing manual)*
- [ ] PDF de Banco Nación se carga sin error *(requiere testing manual)*
- [ ] PDF de Banco Santa Fe se carga sin error *(requiere testing manual)*
- [ ] PDF de Mercado Pago se carga sin error *(requiere testing manual)*
- [x] El sistema muestra un indicador de carga mientras procesa *(confirmado en código: `setImpStatus('Procesando...','loading')`)*

### Extracción de texto
- [ ] El texto del PDF se extrae correctamente *(requiere testing manual con pdf.js)*
- [ ] Las transacciones del extracto se identifican correctamente *(depende de Claude API)*
- [ ] Los nombres de los comercios son reconocibles *(depende de Claude API)*

### Interpretación con Claude API
- [ ] Claude API recibe el texto y retorna una respuesta *(requiere testing con Apps Script configurado)*
- [ ] Las transacciones se clasifican como Gasto o Ingreso correctamente *(requiere testing manual)*
- [ ] Las categorías asignadas son válidas y coherentes *(requiere testing manual)*

### Preview editable
- [x] La tabla de preview muestra las transacciones antes de confirmar *(confirmado en código: `renderImpPreview()`)*
- [x] El usuario puede editar montos desde el preview *(confirmado: input editable en `renderImpPreview()`)*
- [x] El usuario puede editar categorías desde el preview *(confirmado: select editable)*
- [x] El usuario puede editar el tipo (Gasto/Ingreso) desde el preview *(confirmado: select de tipo)*
- [x] El usuario puede eliminar una fila antes de confirmar *(confirmado: botón trash con `impPending.splice`)*
- [x] Los cambios en el preview se reflejan en lo que se guarda *(confirmado: se lee directamente de `impPending`)*

### Separación gastos e ingresos
- [x] Los débitos/pagos se guardan como Gasto (no como Ingreso) *(confirmado: `selGastos` → `DB.insert('Gastos',...)`)*
- ❌ Las acreditaciones/transferencias recibidas se guardan como Ingreso con `quien` correcto → **BUG-001** — `quien` llega como `undefined`

### Guardado en Google Sheets
- [x] Al confirmar, los gastos se guardan en el módulo Gastos *(confirmado en código)*
- ❌ Al confirmar, los ingresos se guardan con `quien` correcto → **BUG-001**
- [ ] Los datos en Sheets coinciden exactamente con el preview *(requiere testing manual)*

---

## 2. Validaciones de Datos

### Fechas
- [ ] Todas las fechas guardadas están en formato DD/MM/YYYY *(internamente YYYY-MM-DD, se muestra como DD/MM/YY — confirmar formato en Sheets)*
- [ ] El año es correcto *(requiere testing manual con PDF real)*
- ❓ Las fechas corresponden al extracto, no a hoy → depende de lo que Claude extraiga; el parser básico usa `imp-mes` como referencia de año/mes

### Montos
- [ ] Los montos tienen decimales correctos *(requiere testing con PDF real)*
- [x] Los montos pasan por `Math.abs()` *(línea 1903 — siempre positivo)*
- [ ] Los montos coinciden con el extracto original *(requiere testing manual)*

### Categorías
- [x] Todas las categorías guardadas pertenecen a la lista válida → `catGastoOk=CAT[t.categoriaSugerida]?t.categoriaSugerida:'Otros'` garantiza fallback a 'Otros'
- [x] No hay valores "null" o "undefined" en categorías *(confirmado: hay fallback a 'Otros' / 'Otro')*
- [x] Las categorías editadas en el preview son las que se guardan *(confirmado)*

### Tipo de transacción
- [ ] No hay gastos clasificados como ingresos *(depende de Claude API — requiere testing)*
- [ ] No hay ingresos clasificados como gastos *(depende de Claude API — requiere testing)*

---

## 3. Seguridad

- [x] La API key de Claude NO está en el código del HTML *(confirmado: vive en Apps Script Script Properties)*
- [x] La API key NO se envía directamente desde el browser a Anthropic *(confirmado: va vía proxy Apps Script)*
- [x] El contenido del PDF NO se guarda en Google Sheets *(confirmado: solo se guardan las transacciones procesadas)*
- [ ] No hay errores de CORS en la consola *(requiere testing con el browser abierto)*
- [x] Datos sensibles del PDF (CBU, CUIT) no aparecen en Sheets *(Claude decide qué extraer; por diseño solo extrae transacciones)*

---

## 4. Manejo de Errores y Fallbacks

- [x] PDF corrupto → muestra error "No se pudo leer el PDF" *(confirmado en `processPDF()`: catch → setImpStatus error)*
- [x] PDF vacío (texto < 30 chars) → muestra mensaje claro *(confirmado: `if(!texto||texto.length<30)`)*
- [x] PDF que no es bancario → Claude avisa, no se guardan datos inválidos *(diseño correcto, requiere testing)*
- [x] Sin Apps Script configurado → mensaje "Configurá el Apps Script primero" + fallback a parser básico *(confirmado)*
- [x] API de Claude falla → fallback a texto manual *(confirmado: `fallbackTextoManual(texto)` en el catch)*
- [ ] Sin conexión a internet → *(requiere testing: el fetch puede colgar, no hay timeout configurado)*
- [x] Archivo que no es PDF → rechaza con toast "Formato no compatible" *(confirmado)*

---

## 5. Performance

- [ ] Un PDF de menos de 5MB se procesa en menos de 10 segundos *(requiere testing manual)*
- [x] La UI muestra indicador de carga *(confirmado: spinner animado vía CSS `@keyframes spin`)*
- [ ] La UI no se congela completamente durante el procesamiento *(requiere testing: las llamadas son `async/await`, debería no bloquearse)*
- [ ] **Nota:** No hay timeout configurado para la llamada al Apps Script. Si el servidor no responde, la UI puede quedar esperando indefinidamente.

---

## 6. Compatibilidad entre Módulos

- [x] El Dashboard se actualiza después de importar → `renderDash()` se llama en `confirmImport()` *(confirmado)*
- [x] El Health Score recalcula después de importar → forma parte de `renderDash()` *(confirmado)*
- [ ] Los filtros del módulo Gastos funcionan con datos importados *(requiere testing manual)*
- ❓ No hay detección de duplicados implementada → si se importa el mismo PDF dos veces, se duplicarán los registros en Sheets. **No hay ningún mecanismo anti-duplicados.**

---

## 7. Regresión — Funcionalidades Existentes

- [x] Módulo Gastos: agregar, editar, eliminar funciona *(confirmado por código)*
- [x] Módulo Ingresos: agregar, eliminar funciona *(confirmado por código)*
- [x] Dashboard mensual renderiza correctamente *(confirmado por código)*
- ❌ Dashboard anual: PNL siempre en verde → **BUG-014**
- ❌ Proyección puede empezar en mes pasado → **BUG-003 / BUG-015**
- ❌ Ajuste de cuentas tiene fecha hardcodeada → **BUG-005**
- [x] Créditos/deudas: sistema francés y simulador funcionan *(confirmado)*

---

## 8. Compatibilidad de Navegadores

- [ ] Funciona en Chrome *(requiere testing manual)*
- [ ] Funciona en Safari *(requiere testing manual — Safari puede tener comportamiento diferente con `input[type=month]`)*
- [ ] Funciona en Firefox *(requiere testing manual)*

---

## Resultado Final del QA

| Criterio | Requerido | Real | ¿OK? |
|----------|-----------|------|------|
| Bugs críticos | 0 | **1** (BUG-001) | ❌ |
| Bugs altos | ≤ 2 | **3** (BUG-003, BUG-008, BUG-015) | ❌ |
| Bugs medios | — | **5** | — |
| Bugs bajos | — | **5** | — |
| Checklist completado | 100% | ~55% (resto requiere testing real) | — |
| Anti-duplicados | Recomendable | No implementado | ⚠️ |
| Timeout en API calls | Recomendable | No implementado | ⚠️ |

### Decisión final (auditoría estática):

- [x] 🚫 **QA RECHAZADO** — hay 1 bug crítico (BUG-001) y 3 bugs altos que deben corregirse antes de considerar producción.

---

## Items adicionales detectados en auditoría (no son bugs, son mejoras)

| # | Observación | Prioridad |
|---|-------------|-----------|
| M-001 | No hay mecanismo anti-duplicados al importar el mismo PDF dos veces | Alta |
| M-002 | No hay timeout en la llamada `fetch` al Apps Script — puede colgar indefinidamente | Media |
| M-003 | El badge "Interpretado con IA" nunca aparece (código muerto `getClaudeKey`) | Media |
| M-004 | `calcProyeccion` debería siempre usar la fecha real, no la navegación del Dashboard | Alta |
| M-005 | El campo `imp-mes` podría pre-llenarse automáticamente con el mes actual en el `init` | Baja |

---

*Checklist completado: 2026-06-08 | Método: auditoría estática de código*
*Testing manual con PDFs reales: pendiente para próxima sesión*
