# Test Cases — HouseholdCap v5.2
## Módulo: Importar con IA

---

> **Instrucciones de uso:**
> - Ejecutar los casos en orden, fase por fase
> - Registrar el **Resultado real** y cambiar el **Estado** según corresponda
> - Si algo falla, crear el bug en `BUG_REPORTS.md` y anotar el número (ej: BUG-003)
> - 🔴 No probado | 🟡 En progreso | ✅ Aprobado | ❌ Falló

---

## FASE 1: PDFs Válidos por Banco (5 casos)

---

### TC-001: Cargar PDF válido de BBVA
**Precondición:** Usuario en módulo Importar, API key de Claude configurada, archivo `extracto_bbva_valido.pdf` disponible
**Pasos:**
1. Abrir HouseholdCap en el navegador
2. Navegar al módulo "Importar"
3. Click en "Subir PDF" o el botón equivalente
4. Seleccionar `extracto_bbva_valido.pdf`
5. Esperar a que el sistema procese el archivo
6. Revisar la tabla de preview que aparece

**Resultado esperado:**
- La tabla preview muestra las transacciones del extracto
- Las fechas aparecen en formato DD/MM/YYYY
- Los montos tienen 2 decimales (ej: $12.450,50)
- Cada fila tiene una categoría asignada
- Las transacciones de débito están marcadas como "Gasto"
- Las acreditaciones están marcadas como "Ingreso"

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

**Notas:** _(completar si hay observaciones)_

---

### TC-002: Cargar PDF válido de Banco Nación
**Precondición:** API key configurada, archivo `extracto_banco_nacion_valido.pdf` disponible
**Pasos:**
1. Navegar al módulo "Importar"
2. Click en "Subir PDF"
3. Seleccionar `extracto_banco_nacion_valido.pdf`
4. Esperar procesamiento completo
5. Revisar la tabla de preview

**Resultado esperado:**
- El sistema reconoce el formato de Banco Nación
- Aparecen las transacciones con sus fechas y montos
- Las categorías son coherentes con el tipo de movimiento
- No hay filas duplicadas

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-003: Cargar PDF válido de Banco Santa Fe
**Precondición:** API key configurada, archivo `extracto_banco_santa_fe_valido.pdf` disponible
**Pasos:**
1. Navegar al módulo "Importar"
2. Click en "Subir PDF"
3. Seleccionar `extracto_banco_santa_fe_valido.pdf`
4. Esperar procesamiento completo
5. Revisar la tabla de preview

**Resultado esperado:**
- Transacciones del extracto aparecen en la tabla
- Fechas en formato DD/MM/YYYY
- Montos en pesos argentinos correctos
- Las categorías son asignadas automáticamente

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-004: Cargar PDF de Mercado Pago (movimientos)
**Precondición:** API key configurada, archivo `mercado_pago_movimientos.pdf` disponible
**Pasos:**
1. Navegar al módulo "Importar"
2. Click en "Subir PDF"
3. Seleccionar `mercado_pago_movimientos.pdf`
4. Esperar procesamiento
5. Revisar el preview

**Resultado esperado:**
- Aparecen los movimientos de Mercado Pago
- Pagos QR clasificados como "Gasto"
- Transferencias recibidas clasificadas como "Ingreso"
- CBU/alias no aparece en el preview (dato sensible)

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-005: Cargar PDF con más de 50 transacciones
**Precondición:** PDF de cualquier banco con extracto de un mes completo (50+ movimientos)
**Pasos:**
1. Subir el PDF con muchas transacciones
2. Esperar procesamiento
3. Verificar que aparecen TODAS las transacciones en el preview
4. Hacer scroll en la tabla para confirmar que no se cortó

**Resultado esperado:**
- Todas las transacciones del PDF aparecen en el preview
- La tabla es scrolleable si hay muchas filas
- No se perdieron transacciones al procesar

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

## FASE 2: Validación de Datos Extraídos (10 casos)

---

### TC-006: Fechas extraídas con formato correcto
**Precondición:** PDF cargado exitosamente (cualquier banco)
**Pasos:**
1. Revisar las fechas en la tabla de preview
2. Verificar que todas siguen el formato DD/MM/YYYY
3. Verificar que el año es el correcto (no 1970, no 2099)

**Resultado esperado:**
- Todas las fechas tienen formato DD/MM/YYYY
- El año corresponde al período del extracto
- No hay fechas vacías ni "undefined"

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-007: Montos extraídos con precisión decimal
**Precondición:** PDF cargado exitosamente
**Pasos:**
1. Revisar los montos en la tabla de preview
2. Elegir 3 transacciones al azar del PDF original
3. Comparar los montos del PDF con los del preview

**Resultado esperado:**
- Los montos coinciden exactamente con el PDF original
- Los centavos se respetan (no se redondea)
- No hay signos extra ($, -, +) que no correspondan

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-008: Categorías asignadas son válidas
**Precondición:** PDF cargado y preview visible
**Pasos:**
1. Revisar la columna "Categoría" del preview
2. Verificar que cada categoría pertenece a la lista válida de la app
3. Verificar que no hay categorías en blanco o con "null"

**Resultado esperado:**
- Todas las categorías pertenecen al listado válido
- No hay valores "undefined", "null", ni categorías inventadas
- Las categorías son coherentes (ej: "Supermercado" para compras en Carrefour)

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-009: Separación correcta de gastos e ingresos
**Precondición:** PDF que incluya tanto débitos como acreditaciones
**Pasos:**
1. Cargar el PDF
2. Revisar la columna "Tipo" en el preview
3. Verificar que los débitos están como "Gasto"
4. Verificar que las acreditaciones están como "Ingreso"

**Resultado esperado:**
- Los débitos/pagos = Gasto
- Las acreditaciones/transferencias recibidas = Ingreso
- No hay gastos marcados como ingresos ni viceversa

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-010: Editar una transacción en el preview
**Precondición:** Preview visible con transacciones
**Pasos:**
1. En la tabla de preview, hacer click en el monto de una fila
2. Cambiar el monto por un valor diferente (ej: de $1000 a $950)
3. Hacer click fuera del campo para confirmar
4. Verificar que el cambio se guardó en la tabla

**Resultado esperado:**
- El campo es editable al hacer click
- El cambio se refleja inmediatamente en la tabla
- El nuevo valor se mantiene al confirmar la importación

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-011: Editar la categoría de una transacción
**Precondición:** Preview visible
**Pasos:**
1. Hacer click en la categoría de una fila
2. Cambiar la categoría a otra válida
3. Confirmar el cambio
4. Importar y verificar que la categoría editada se guardó en Sheets

**Resultado esperado:**
- Se puede cambiar la categoría desde el preview
- La categoría editada es la que termina en Google Sheets

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-012: Eliminar una transacción del preview antes de guardar
**Precondición:** Preview visible con múltiples transacciones
**Pasos:**
1. Seleccionar o identificar el botón de eliminar de una fila
2. Eliminar esa fila
3. Confirmar que la fila desaparece del preview
4. Importar y verificar que la transacción eliminada NO aparece en Sheets

**Resultado esperado:**
- La fila se elimina del preview
- Al importar, esa transacción no se guarda en Sheets

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-013: Descripción del comercio es legible
**Precondición:** PDF cargado
**Pasos:**
1. Revisar la columna "Descripción" o "Comercio" en el preview
2. Verificar que los nombres de los comercios son legibles
3. Verificar que no hay caracteres extraños (□, ?, ■)

**Resultado esperado:**
- Las descripciones son texto legible en español
- No hay caracteres de codificación rota
- Los nombres de comercios conocidos son reconocibles (ej: "CARREFOUR", "YPF")

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-014: Guardado en módulo Gastos es correcto
**Precondición:** Transacciones de gastos en preview, acceso a Google Sheets TEST
**Pasos:**
1. Confirmar la importación
2. Abrir el módulo Gastos de la app
3. Verificar que los nuevos gastos aparecen
4. Abrir el Google Sheets TEST y verificar los datos ahí también

**Resultado esperado:**
- Los gastos importados aparecen en el módulo Gastos
- Las fechas, montos y categorías en Sheets coinciden con el preview
- La columna "Fuente" o similar indica que vino de importación

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-015: Guardado en módulo Ingresos es correcto
**Precondición:** Transacciones de ingresos en preview
**Pasos:**
1. Confirmar la importación
2. Abrir el módulo Ingresos de la app
3. Verificar que los nuevos ingresos aparecen
4. Verificar en Google Sheets TEST

**Resultado esperado:**
- Los ingresos importados aparecen en el módulo Ingresos
- Los datos en Sheets coinciden con el preview

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

## FASE 3: Errores y Edge Cases (8 casos)

---

### TC-016: Subir un PDF corrupto
**Precondición:** Archivo `pdf_corrupto.pdf` disponible (puede ser un .jpg renombrado como .pdf)
**Pasos:**
1. Intentar subir el archivo corrupto
2. Observar qué hace la app

**Resultado esperado:**
- La app muestra un mensaje de error claro (ej: "No se pudo leer el archivo. Intentá con otro PDF.")
- La app NO se congela ni muestra pantalla en blanco
- Hay opción de volver a intentar o ingresar datos manualmente

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-017: Subir un PDF vacío (sin contenido)
**Precondición:** Archivo PDF válido pero sin texto (puede ser un PDF de una página en blanco)
**Pasos:**
1. Subir el PDF vacío
2. Observar la respuesta del sistema

**Resultado esperado:**
- La app muestra "No se encontraron transacciones en este PDF"
- No hay error de JavaScript en consola
- Hay opción de subir otro archivo

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-018: PDF que no es un extracto bancario
**Precondición:** Un PDF de cualquier otro tipo (ej: un contrato, un recibo sin tabla de movimientos)
**Pasos:**
1. Subir el PDF no bancario
2. Observar qué hace Claude con el texto
3. Ver qué muestra en el preview

**Resultado esperado:**
- Claude responde que no encontró transacciones reconocibles
- La app muestra mensaje informativo al usuario
- No se guardan datos inválidos en Sheets

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-019: API key de Claude no configurada
**Precondición:** Borrar o dejar vacía la API key en la configuración de la app
**Pasos:**
1. Vaciar la API key en la configuración
2. Intentar subir un PDF
3. Observar qué sucede

**Resultado esperado:**
- La app detecta que no hay API key antes de intentar la llamada
- Muestra mensaje claro: "Configurá tu API key de Claude para usar esta función"
- No hay error de red ni crash

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-020: API key de Claude inválida o expirada
**Precondición:** Configurar una API key incorrecta (ej: "sk-invalida123")
**Pasos:**
1. Configurar API key incorrecta
2. Subir un PDF válido
3. Observar qué pasa cuando intenta llamar a Claude

**Resultado esperado:**
- Se muestra el error de autenticación de manera comprensible
- Ej: "No se pudo conectar con Claude. Verificá tu API key."
- El texto extraído del PDF se muestra igualmente para edición manual
- No hay datos inválidos guardados en Sheets

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-021: Sin conexión a internet durante el procesamiento
**Precondición:** PDF cargado, luego desconectar WiFi/red antes de que termine
**Pasos:**
1. Subir un PDF
2. Mientras se procesa, desconectar la red
3. Observar el comportamiento

**Resultado esperado:**
- La app muestra un mensaje de error de conexión
- No se congela indefinidamente
- Hay opción de reintentar o continuar manualmente

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-022: Subir un archivo que no es PDF (ej: .xlsx, .jpg)
**Precondición:** Tener un archivo .xlsx o .jpg a mano
**Pasos:**
1. Intentar subir un archivo .jpg como si fuera un PDF
2. Observar si la app lo acepta o lo rechaza

**Resultado esperado:**
- La app valida el tipo de archivo antes de procesar
- Muestra mensaje: "Solo se admiten archivos PDF"
- El archivo no se procesa

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-023: PDF mayor a 10MB
**Precondición:** Tener un PDF de más de 10MB (puede ser uno con imágenes de alta resolución)
**Pasos:**
1. Intentar subir el PDF grande
2. Observar si lo procesa o da error

**Resultado esperado:**
- La app avisa que el archivo es demasiado grande
- Ej: "El archivo supera el límite de 10MB. Intentá con un extracto más corto."
- No intenta procesar un archivo que va a fallar

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

## FASE 4: Compatibilidad entre Módulos (5 casos)

---

### TC-024: Dashboard se actualiza después de importar
**Precondición:** Importar al menos 3 gastos nuevos con éxito
**Pasos:**
1. Importar gastos nuevos
2. Navegar al Dashboard principal
3. Verificar que los totales cambiaron

**Resultado esperado:**
- El total de gastos del mes refleja los nuevos importados
- Los gráficos se actualizan (si aplica)
- No hay valores congelados del estado anterior

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-025: Health Score recalcula después de importar
**Precondición:** Importar gastos nuevos con éxito
**Pasos:**
1. Anotar el Health Score antes de importar
2. Importar gastos por un monto significativo (ej: $50.000)
3. Revisar el Health Score después

**Resultado esperado:**
- El Health Score cambia de acuerdo a los nuevos gastos
- No queda con el valor anterior congelado

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-026: No se crean duplicados al importar el mismo PDF dos veces
**Precondición:** PDF ya importado exitosamente
**Pasos:**
1. Subir el mismo PDF que ya se importó antes
2. Confirmar la importación nuevamente
3. Revisar en el módulo Gastos si hay duplicados

**Resultado esperado:**
- La app advierte que esas transacciones ya existen, O
- La app no guarda duplicados, O
- Al menos la app tiene algún mecanismo para detectarlo

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-027: Los filtros del módulo Gastos funcionan con datos importados
**Precondición:** Gastos importados exitosamente
**Pasos:**
1. Ir al módulo Gastos
2. Aplicar filtro por mes
3. Verificar que los gastos importados aparecen bajo el mes correcto
4. Aplicar filtro por categoría y verificar

**Resultado esperado:**
- Los gastos importados responden a los filtros normalmente
- El mes asignado corresponde a la fecha del extracto, no a la fecha de importación

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-028: El módulo Ingresos no muestra gastos importados
**Precondición:** Gastos importados exitosamente
**Pasos:**
1. Ir al módulo Ingresos
2. Verificar que los gastos importados NO aparecen ahí

**Resultado esperado:**
- Los gastos importados solo están en el módulo Gastos
- Los ingresos importados solo están en el módulo Ingresos
- No hay mezcla entre módulos

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

## FASE 5: Performance (2 casos)

---

### TC-029: PDF pequeño (< 5MB) se procesa en tiempo razonable
**Precondición:** PDF de hasta 5MB, conexión a internet normal
**Pasos:**
1. Anotar la hora de inicio al subir el PDF
2. Esperar hasta que aparezca el preview
3. Anotar la hora de finalización

**Resultado esperado:**
- El procesamiento completo (extracción + Claude API + preview) toma menos de 10 segundos
- La UI muestra algún indicador de carga ("Procesando..." o spinner)
- La UI no se congela durante el proceso

**Tiempo registrado:** _____ segundos

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

### TC-030: La UI no se bloquea durante el procesamiento
**Precondición:** PDF en proceso de carga
**Pasos:**
1. Subir un PDF
2. Mientras se procesa, intentar hacer click en otras partes de la app
3. Intentar hacer scroll
4. Verificar que el indicador de carga es visible

**Resultado esperado:**
- Aparece un indicador de carga visible (spinner, barra de progreso, o texto)
- La UI no se congela completamente (aunque puede tener elementos deshabilitados)
- No hay pantalla en blanco durante el proceso

**Resultado real:** _(completar durante testing)_

**Estado:** 🔴 No probado

---

## Resumen de Ejecución

| Fase | Total | ✅ Aprobado | ❌ Falló | 🔴 No probado |
|------|-------|------------|---------|--------------|
| Fase 1: PDFs por banco | 5 | | | 5 |
| Fase 2: Validación de datos | 10 | | | 10 |
| Fase 3: Errores y edge cases | 8 | | | 8 |
| Fase 4: Compatibilidad módulos | 5 | | | 5 |
| Fase 5: Performance | 2 | | | 2 |
| **TOTAL** | **30** | **0** | **0** | **30** |

---

*Documento creado: 2026-06-08 | Versión: 1.0 | Actualizar estado durante la ejecución*
