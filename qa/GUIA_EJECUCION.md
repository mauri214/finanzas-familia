# Guía de Ejecución del QA — HouseholdCap v5.2
## Para el tester — instrucciones paso a paso

---

> Esta guía es para alguien que va a ejecutar el testing manual.
> No se necesita experiencia técnica para seguirla.
> Leer completo antes de empezar.

---

## Antes de empezar — Preparación (15 minutos)

### Paso 1: Reunir los PDFs de prueba
Necesitás al menos 1 extracto real de cada banco. Ver `RECURSOS_TESTING.md` para saber cuáles exactamente y cómo conseguirlos.

Guardalos en una carpeta que puedas encontrar fácil (ej: Escritorio/QA_PDFs).

### Paso 2: Abrir la app
1. Abrí el archivo `finanzas_v5.2.html` en Chrome (doble click o arrastrar al navegador)
2. Verificá que la app carga correctamente (ves el dashboard, los módulos, etc.)

### Paso 3: Configurar la API key
1. Buscá el panel de configuración en la app (ícono de engranaje o "Configuración")
2. Ingresá tu API key de Claude
3. Verificá que la app no muestra ningún error de API key

### Paso 4: Apuntar al Sheet de TEST
1. Verificá que la URL del Google Sheet configurado es el de TEST, no el de producción
2. Si no estás seguro, consultá con el dev

### Paso 5: Abrir DevTools (muy importante)
1. En Chrome, presionar **F12**
2. Ir a la pestaña **Console** (Consola)
3. Dejarla abierta en todo momento — acá vas a ver los errores
4. Si aparece algo en rojo, es un error que hay que reportar

---

## Durante el testing — Cómo trabajar

### Cómo ejecutar un test case
1. Leer el test case completo en `TEST_CASES.md` antes de ejecutarlo
2. Seguir los pasos exactamente como están escritos
3. Comparar el resultado con el "Resultado esperado"
4. Registrar lo que pasó realmente en "Resultado real"
5. Cambiar el estado: ✅ si pasó, ❌ si falló

### Cómo reportar un bug
Cuando algo no funciona como se espera:

1. **No cierres nada** — dejá la pantalla con el error visible
2. **Tomá una captura de pantalla** (Cmd+Shift+4 en Mac)
3. **Copiá el error de la consola** si hay uno (texto en rojo)
4. **Abrí `BUG_REPORTS.md`**
5. **Copiá el template** y completá todos los campos
6. **Guardá la captura** en `qa/evidencia/` con un nombre descriptivo
7. En `TEST_CASES.md`, marcá ese test case como ❌ y anotá el número de bug

---

## Flujo recomendado de testing

### Día 1: Funcionalidad básica (3-4 horas)

**Objetivo:** Confirmar que el flujo principal funciona de principio a fin.

1. Abrir la app y configurar todo (ver sección "Antes de empezar")
2. Ejecutar **TC-001** (BBVA): subir un PDF y seguir el flujo completo hasta guardarlo en Sheets
3. Verificar en Google Sheets TEST que los datos llegaron bien
4. Si TC-001 funcionó: ejecutar TC-002, TC-003, TC-004 (otros bancos)
5. Ejecutar TC-006 a TC-015 (validación de datos)

> 💡 **Tip:** Si el TC-001 falla de forma crítica (la app se rompe y no podés continuar), documentar el bug y avisarle al dev antes de seguir. No tiene sentido probar el resto si el flujo básico no funciona.

### Día 2: Errores y compatibilidad (3-4 horas)

1. Ejecutar TC-016 a TC-023 (errores y edge cases)
2. Ejecutar TC-024 a TC-028 (compatibilidad entre módulos)
3. Ejecutar TC-029 y TC-030 (performance)

### Fin del testing:

1. Completar el resumen en `TEST_CASES.md`
2. Completar el `CHECKLIST_ACEPTACION.md`
3. Actualizar el resumen de bugs en `BUG_REPORTS.md`
4. Comunicar el resultado al dev

---

## Cómo leer la consola del navegador

La consola muestra mensajes que el código genera. Lo importante:

| Color | Qué significa | ¿Qué hacer? |
|-------|--------------|-------------|
| 🔴 Rojo (Error) | Algo falló en el código | Copiar el mensaje y reportar bug |
| 🟡 Amarillo (Warning) | Algo podría estar mal | Evaluar si es relevante al test |
| ⚫ Negro/Blanco (Log) | Información normal | Solo leer si hay un bug |

**Lo que NO querés ver:**
- `Uncaught TypeError`
- `Failed to fetch`
- `401 Unauthorized` (problema de API key)
- `403 Forbidden`
- `CORS error`
- Tu API key de Claude escrita en texto plano

---

## Situaciones comunes y qué hacer

### "La app no carga"
- Verificar que el archivo .html existe y se puede abrir
- Intentar con otro navegador
- Ver si hay error en consola

### "El PDF no se puede subir"
- Verificar que el archivo es realmente un PDF (no un .jpg renombrado)
- Verificar que pesa menos de 10MB
- Intentar con otro PDF
- Ver error en consola

### "Claude API no responde"
- Verificar que la API key está bien configurada
- Verificar conexión a internet
- Ver si hay error `401` o `403` en la consola

### "Los datos no aparecen en Google Sheets"
- Verificar que se apretó "Confirmar" o el botón de guardar
- Verificar que el Sheet configurado es el correcto
- Ver errores en consola de red (pestaña Network en DevTools)

### "No sé si es un bug o algo que hice mal"
- Intentar reproducir el problema 2-3 veces siguiendo exactamente los mismos pasos
- Si pasa consistentemente → es un bug
- Si pasa solo a veces → igual reportar como bug (bugs intermitentes son bugs)
- Si no podés reproducirlo → anotar en el test case como "No reproducible - observar"

---

## Comandos de git para esta rama

Si necesitás guardar el progreso del QA en git:

```bash
# Ver en qué rama estás (debería decir qa/testing-v5.2)
git branch

# Guardar los cambios de los archivos .md del QA
git add qa/
git commit -m "qa — progreso testing TC-001 a TC-015"
```

---

## Contacto ante dudas

Si algo no está claro o encontrás un comportamiento que no sabés cómo clasificar, consultá con el dev antes de seguir. Es mejor preguntar que reportar un falso bug o ignorar uno real.

---

*Documento creado: 2026-06-08 | Versión: 1.0*
