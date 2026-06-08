# Recursos Necesarios para Testing — HouseholdCap v5.1
## Módulo: Importar con IA

---

## 1. PDFs de Prueba

Estos son los archivos que necesitás tener a mano antes de empezar el QA.

### PDFs válidos (flujo normal)

| Archivo | Banco | Descripción | ¿Disponible? |
|---------|-------|-------------|-------------|
| `extracto_bbva_valido.pdf` | BBVA | Extracto de 1 mes con al menos 10 transacciones | ☐ |
| `extracto_banco_nacion_valido.pdf` | Banco Nación | Extracto de 1 mes con al menos 10 transacciones | ☐ |
| `extracto_banco_santa_fe_valido.pdf` | Banco Santa Fe | Extracto de 1 mes con al menos 10 transacciones | ☐ |
| `mercado_pago_movimientos.pdf` | Mercado Pago | Movimientos del mes incluyendo pagos QR e ingresos | ☐ |
| `extracto_completo_mes.pdf` | Cualquier banco | Extracto con 50+ transacciones (para test de cantidad) | ☐ |

### PDFs para testing de errores

| Archivo | Cómo crearlo | Propósito |
|---------|-------------|-----------|
| `pdf_corrupto.pdf` | Renombrar un archivo .jpg como .pdf | Probar error handling con PDF no legible |
| `pdf_vacio.pdf` | Crear PDF de una página en blanco (desde Word/Pages) | Probar el caso "sin transacciones detectadas" |
| `pdf_sin_transacciones.pdf` | Usar un contrato o documento de texto sin movimientos bancarios | Probar que la IA no inventa datos |
| `archivo_no_pdf.xlsx` | Cualquier archivo Excel | Probar validación de tipo de archivo |

### Cómo conseguir los PDFs bancarios
- **BBVA:** Home Banking → Movimientos → Descargar PDF
- **Banco Nación:** BNA+ App o Home Banking → Descargar extracto
- **Banco Santa Fe:** Home Banking → Extracto de cuenta → PDF
- **Mercado Pago:** App → Actividad → Descargar

> ⚠️ Usar extractos reales con datos propios está bien para testing. Si preferís no usar datos reales, usar extractos de meses anteriores que ya estén registrados en la app.

---

## 2. Credenciales y Accesos

| Recurso | Descripción | Estado |
|---------|-------------|--------|
| API Key de Claude | La misma que usa la app en producción. Configurarla en el panel de la app | ☐ Disponible |
| Google Sheets TEST | URL del Sheet de prueba (diferente al de producción) | ☐ Disponible |
| URL del Sheet TEST | Completar: _________________________________ | |

> ⚠️ **IMPORTANTE:** Durante el testing, usar el Sheet de TEST, nunca el de producción. Los datos de prueba pueden ser difíciles de borrar del Sheet de producción.

---

## 3. Configuración del Entorno

### Antes de empezar, verificar:

- [ ] El archivo `finanzas_v5.1.html` abre correctamente en el navegador
- [ ] La API key de Claude está configurada en el panel de la app
- [ ] La app está apuntando al Google Sheets de TEST (no producción)
- [ ] DevTools del navegador está abierto en la pestaña Consola
- [ ] Captura de pantalla está disponible (Cmd+Shift+4 en Mac, Snipping Tool en Windows)
- [ ] Los PDFs de prueba están en una carpeta de fácil acceso

---

## 4. Herramientas de Testing

### Herramientas del navegador
- **DevTools / Inspector** — abrir con F12 o clic derecho → Inspeccionar
  - Pestaña **Consola**: ver errores de JavaScript
  - Pestaña **Red**: ver llamadas a la API de Claude y al Sheet
  - Pestaña **Aplicación**: ver storage local si la app usa localStorage

### Capturas de pantalla
- **Mac:** Cmd+Shift+4 → Seleccionar área
- **Windows:** Win+Shift+S → Seleccionar área
- Guardar en carpeta `qa/evidencia/` con nombre descriptivo (ej: `BUG-001-monto-redondeado.png`)

### Para copiar logs de consola
1. Abrir DevTools → pestaña Consola
2. Click derecho sobre el error → "Save as..."
3. O seleccionar el texto y copiar en el BUG_REPORTS.md

---

## 5. Carpeta de Evidencias

Crear la carpeta `qa/evidencia/` para guardar screenshots y logs:

```
qa/
├── evidencia/
│   ├── BUG-001-descripcion.png
│   ├── BUG-002-descripcion.png
│   └── TC-001-resultado-exitoso.png
```

> Los archivos de evidencia no van al repositorio de git (son muy pesados). Guardarlos solo localmente.

---

## 6. Cómo preparar los PDFs de error

### PDF corrupto
1. Buscar cualquier imagen .jpg en tu computadora
2. Renombrarla cambiando la extensión a `.pdf` (ej: `foto_vacaciones.jpg` → `pdf_corrupto.pdf`)
3. Este archivo parecerá un PDF pero no lo es

### PDF vacío
1. Abrir Pages (Mac) o Word (Windows)
2. Crear documento nuevo sin escribir nada
3. Exportar como PDF
4. Guardar como `pdf_vacio.pdf`

### PDF muy grande (para test de límite de tamaño)
1. Si tenés un extracto con muchas páginas o con imágenes escaneadas, usar ese
2. O combinar varios PDFs con una herramienta online para crear uno grande

---

*Documento creado: 2026-06-08 | Versión: 1.0*
