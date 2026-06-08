# Checklist de Aceptación — HouseholdCap v5.1
## Módulo: Importar con IA

---

> **Instrucciones:**
> - Marcar cada ítem con `[x]` cuando esté verificado
> - Solo marcar si se probó activamente — no marcar si "se supone que funciona"
> - Si algo falla, anotar el número de BUG y no marcar como aprobado

---

## ✅ Para dar QA por aprobado, TODOS los ítems deben estar marcados

---

## 1. Funcionalidad Core

### Carga de archivos
- [ ] PDF de BBVA se carga sin error
- [ ] PDF de Banco Nación se carga sin error
- [ ] PDF de Banco Santa Fe se carga sin error
- [ ] PDF de Mercado Pago se carga sin error
- [ ] El sistema muestra un indicador de carga mientras procesa

### Extracción de texto
- [ ] El texto del PDF se extrae correctamente (legible, sin caracteres extraños)
- [ ] Las transacciones del extracto se identifican correctamente
- [ ] Los nombres de los comercios son reconocibles

### Interpretación con Claude API
- [ ] Claude API recibe el texto y retorna una respuesta
- [ ] Las transacciones se clasifican como Gasto o Ingreso correctamente
- [ ] Las categorías asignadas son válidas y coherentes

### Preview editable
- [ ] La tabla de preview muestra las transacciones antes de confirmar
- [ ] El usuario puede editar montos desde el preview
- [ ] El usuario puede editar categorías desde el preview
- [ ] El usuario puede editar el tipo (Gasto/Ingreso) desde el preview
- [ ] El usuario puede eliminar una fila antes de confirmar
- [ ] Los cambios en el preview se reflejan en lo que se guarda

### Separación gastos e ingresos
- [ ] Los débitos/pagos se guardan como Gasto (no como Ingreso)
- [ ] Las acreditaciones/transferencias recibidas se guardan como Ingreso

### Guardado en Google Sheets
- [ ] Al confirmar, los gastos se guardan en el módulo Gastos
- [ ] Al confirmar, los ingresos se guardan en el módulo Ingresos
- [ ] Los datos en Sheets coinciden exactamente con el preview

---

## 2. Validaciones de Datos

### Fechas
- [ ] Todas las fechas guardadas están en formato DD/MM/YYYY
- [ ] El año es correcto (no 1970, no 2099)
- [ ] Las fechas corresponden al período del extracto, no a la fecha de hoy

### Montos
- [ ] Los montos tienen decimales correctos (sin redondeo incorrecto)
- [ ] Los montos coinciden con el extracto original (verificar manualmente al menos 3)
- [ ] No hay caracteres extraños en los montos ($, -, +, espacios raros)

### Categorías
- [ ] Todas las categorías guardadas pertenecen a la lista válida de la app
- [ ] No hay valores "null", "undefined" ni categorías en blanco
- [ ] Las categorías editadas en el preview son las que se guardan

### Tipo de transacción
- [ ] No hay gastos clasificados como ingresos
- [ ] No hay ingresos clasificados como gastos

---

## 3. Seguridad

- [ ] La API key de Claude NO aparece en la consola del navegador
- [ ] La API key NO se envía a ningún servidor propio (solo a api.anthropic.com)
- [ ] El contenido del PDF NO se guarda en Google Sheets (solo las transacciones procesadas)
- [ ] No hay errores de CORS en la consola durante el uso normal
- [ ] Datos sensibles del PDF (CBU, CUIT, dirección) no aparecen en el preview ni en Sheets

---

## 4. Manejo de Errores y Fallbacks

- [ ] PDF corrupto → muestra mensaje de error claro, no se congela
- [ ] PDF vacío → muestra "No se encontraron transacciones", no se congela
- [ ] PDF que no es bancario → Claude avisa que no encontró transacciones
- [ ] Sin API key → pide al usuario que la configure antes de continuar
- [ ] API key inválida → muestra error comprensible, no crash
- [ ] Sin conexión a internet → muestra error de red, no se congela indefinidamente
- [ ] Archivo que no es PDF → rechaza el archivo con mensaje claro

---

## 5. Performance

- [ ] Un PDF de menos de 5MB se procesa en menos de 10 segundos
- [ ] La UI muestra algún indicador de carga (spinner, texto, barra)
- [ ] La UI no se congela completamente durante el procesamiento
- [ ] El proceso completo (subir → procesar → preview) toma menos de 15 segundos en condiciones normales

**Tiempos registrados:**
- BBVA: _____ seg
- Banco Nación: _____ seg
- Banco Santa Fe: _____ seg
- Mercado Pago: _____ seg

---

## 6. Compatibilidad entre Módulos

- [ ] El Dashboard se actualiza después de importar gastos/ingresos
- [ ] El Health Score recalcula correctamente después de importar
- [ ] Los filtros del módulo Gastos funcionan con los datos importados
- [ ] Los filtros del módulo Ingresos funcionan con los datos importados
- [ ] No se crean duplicados al importar el mismo PDF dos veces

---

## 7. Regresión — Funcionalidades Existentes

*(Verificar que nada se rompió con los cambios de v5.1)*

- [ ] El módulo Gastos sigue funcionando (agregar, editar, eliminar)
- [ ] El módulo Ingresos sigue funcionando
- [ ] El Dashboard muestra datos correctos
- [ ] El Health Score calcula correctamente
- [ ] Los filtros por mes funcionan
- [ ] El resumen mensual es correcto

---

## 8. Compatibilidad de Navegadores

- [ ] Funciona correctamente en **Chrome** (versión actual)
- [ ] Funciona correctamente en **Safari** (versión actual)
- [ ] Funciona correctamente en **Firefox** (versión actual)
- [ ] *(Opcional)* Funciona en dispositivo móvil (Chrome mobile)

---

## Resultado Final del QA

### ¿QA APROBADO?

| Criterio | Requerido | Real | ¿OK? |
|----------|-----------|------|------|
| Bugs críticos | 0 | ___ | |
| Bugs altos | ≤ 2 | ___ | |
| Test cases aprobados | ≥ 90% | ___% | |
| Checklist completado | 100% | ___% | |
| Performance < 15 seg | Sí | ___ | |
| Errores en consola | 0 | ___ | |

### Decisión final:

- [ ] ✅ **QA APROBADO** — listo para mergear a producción
- [ ] 🚫 **QA RECHAZADO** — corregir bugs antes de mergear

**Firma del tester:** ___________________________

**Fecha de cierre del QA:** ___________________________

**Observaciones finales:**
_(espacio para comentarios, deuda técnica, o notas para v5.2)_

---

*Documento creado: 2026-06-08 | Versión: 1.0*
