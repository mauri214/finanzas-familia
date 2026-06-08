# Estrategia de QA — HouseholdCap v5.2
## Módulo: Importar con IA

---

## 1. Objetivo del Testing

Validar que el módulo **Importar con IA** funciona de manera correcta, segura y confiable antes de pasar a producción (main). El objetivo es encontrar bugs, comportamientos inesperados y casos borde **antes** de que los use el usuario final, no después.

---

## 2. Scope — ¿Qué se prueba?

### ✅ Incluido en este QA

| Área | Descripción |
|------|-------------|
| Carga de PDF | Subir archivos de BBVA, Banco Nación, Banco Santa Fe, Mercado Pago |
| Extracción de texto | El sistema lee correctamente el texto del PDF |
| Integración Claude API | La IA interpreta las transacciones y las clasifica |
| Preview editable | El usuario puede revisar y editar antes de confirmar |
| Separación gastos/ingresos | Las transacciones se clasifican correctamente |
| Guardado en Sheets | Los datos llegan bien al Google Sheets |
| Manejo de errores | El sistema responde bien a PDFs rotos, API caída, etc. |
| Seguridad básica | La API key no se expone ni se registra |
| Performance | Los tiempos de respuesta son aceptables |
| Regresión | Los módulos existentes (Dashboard, Health Score) siguen funcionando |

### ❌ No incluido en este QA

- Testing automatizado (este es QA manual)
- Testing de carga o estrés (muchos usuarios simultáneos)
- Testing en dispositivos móviles (opcional, baja prioridad)
- Testing de nuevas funcionalidades futuras (v5.3+)
- Auditoría de seguridad profunda del código

---

## 3. Tipos de Testing

### 3.1 Testing Funcional
Verificar que cada función hace lo que se supone que debe hacer. Ejemplo: al subir un PDF de BBVA, el sistema muestra las transacciones correctamente.

### 3.2 Testing de Integración
Verificar que los módulos se comunican bien entre sí. Ejemplo: al confirmar las transacciones importadas, estas aparecen correctamente en el módulo Gastos y actualizan el Dashboard.

### 3.3 Testing de Errores (Negative Testing)
Verificar que el sistema no se rompe con entradas inválidas. Ejemplo: al subir un PDF corrupto, el sistema muestra un mensaje de error claro en lugar de congelarse.

### 3.4 Testing de Regresión
Verificar que los cambios nuevos no rompieron algo que antes funcionaba. Ejemplo: el Health Score sigue calculando bien después de importar datos.

### 3.5 Testing de Performance
Verificar que los tiempos de respuesta son aceptables. Ejemplo: un PDF de 5MB se procesa en menos de 10 segundos.

---

## 4. Criterios de Entrada — ¿Cuándo empezar el QA?

Antes de iniciar el QA, verificar que:

- [ ] El módulo Importar está integrado en el HTML principal (v5.2)
- [ ] La integración con Claude API está implementada
- [ ] El guardado en Google Sheets está implementado
- [ ] Hay al menos un PDF real de prueba disponible
- [ ] Se tiene una API key válida de Anthropic
- [ ] Se tiene acceso al Google Sheets de TEST (no producción)
- [ ] El código de v5.2 fue mergeado a la rama `main` (o está en un branch estable)

---

## 5. Criterios de Salida — ¿Cuándo dar QA por aprobado?

### ✅ QA APROBADO cuando:
- 0 bugs críticos sin resolver
- ≤ 2 bugs altos (con fecha de fix planificada)
- ≥ 90% de test cases ejecutados
- 100% de test cases de funcionalidad core aprobados
- Checklist de aceptación completado al 100%
- Tiempo de procesamiento ≤ 10 segundos por PDF normal
- 0 errores en consola del navegador durante el flujo principal

### 🚫 QA RECHAZADO cuando:
- Más de 1 bug crítico sin workaround
- Más de 5 bugs altos sin resolver
- Más del 20% de test cases fallados
- Algún módulo existente dejó de funcionar
- La API key se registra en consola o se envía a un servidor externo

---

## 6. Fases del Testing

| Fase | Nombre | Duración estimada | Objetivo |
|------|--------|-------------------|----------|
| 1 | Funcionalidad básica | 3 horas | Flujo principal completo |
| 2 | Compatibilidad de bancos | 4 horas | Los 4 bancos soportados |
| 3 | Errores y edge cases | 3 horas | Que el sistema no se rompa |
| 4 | Validación de datos | 2 horas | Que los datos lleguen bien a Sheets |
| 5 | Regresión | 1 hora | Que nada existente se rompió |

**Total estimado: 13 horas de testing manual**

---

## 7. Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Formato de PDF diferente por banco | Alta | Alto | Tener PDFs reales de cada banco |
| Claude API interpreta mal una transacción | Media | Medio | Preview editable permite corrección manual |
| Duplicados al importar dos veces | Media | Alto | Verificar manejo de duplicados en Sheets |
| API key expuesta en consola | Baja | Crítico | Revisión de código antes de QA |
| Fechas del PDF en formato inesperado | Alta | Medio | Test cases específicos para fechas |
| PDF con caracteres especiales o tildes | Media | Bajo | Test con texto en español |

---

## 8. Recursos Necesarios

Ver archivo `qa/RECURSOS_TESTING.md` para el detalle completo.

**Resumen:**
- PDFs reales de los 4 bancos (o PDFs simulados con el mismo formato)
- API key válida de Anthropic (puede ser la misma que usa el usuario en producción)
- Acceso al Google Sheets de TEST
- Navegador Chrome o Firefox con DevTools disponible
- Herramienta para captura de pantalla

---

## 9. Responsabilidades

| Rol | Responsabilidad |
|-----|----------------|
| Tester | Ejecutar los test cases y documentar resultados en TEST_CASES.md |
| Tester | Reportar bugs en BUG_REPORTS.md |
| Dev | Revisar bugs y asignar prioridad |
| Dev | Corregir bugs antes del merge a producción |
| Tester | Verificar que el fix funciona (re-test) |

---

## 10. Entorno de Testing

- **Ambiente:** Local (navegador del desarrollador)
- **URL:** Archivo HTML abierto localmente (`file://`) o servidor local
- **Google Sheets:** Usar únicamente el Sheet de TEST, nunca el de producción
- **API Key:** Usar la clave configurada en el panel de la app
- **Navegador principal:** Chrome (con DevTools abierto en consola)

---

*Documento creado: 2026-06-08 | Versión: 1.0 | Módulo: Importar v5.2*
