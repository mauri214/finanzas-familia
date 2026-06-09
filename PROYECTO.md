# Finanzas Familia — Documentación del Proyecto

## Visión general

Herramienta de finanzas personales para una pareja (2 usuarios), construida como web app. Permite gestionar gastos, ingresos, inversiones, metas de ahorro y créditos/deudas con foco en la realidad argentina (ARS/USD dual, brokers locales, sistema francés de amortización).

## Estado actual

- **Versión activa:** v5.3 (`finanzas_v5.3.html`)
- **Stack:** HTML + CSS + JavaScript vanilla (sin frameworks), un solo archivo
- **Persistencia:** Google Sheets via Apps Script (con token de seguridad). Fallback a memoria si no hay URL configurada.
- **Repo:** github.com/mauri214/HouseholdCap
- **URL pública:** https://mauri214.github.io/HouseholdCap/
- **Diseño:** Aston Martin — British Racing Green #003A2F, Ivory #F5F0E8, Carbon Black #0A0A0A
- **App name:** HouseholdCap

### Novedades v5.3 (actual)
- Campo `imputacion` (YYYY-MM) en Gastos e Ingresos: separa fecha de transacción del mes contable
- Filtros del Dashboard, ajuste de cuentas y vista anual usan `imputacion` si está presente, sino `fecha`
- Formulario gastos: selector "Imputar al mes" (default = mes actual)
- Formulario ingresos: idem
- Modal editar gasto: campo imputación editable
- Módulo Importar: columna "Imputar a" con default = mes del extracto seleccionado
- Tabla gastos: badge `→ Jun` cuando el mes de imputación difiere de la fecha de la transacción
- Google Sheets: columna `imputacion` agregada al final de Gastos e Ingresos (sin romper registros existentes)

### Novedades v5.2
- Widget de Proyección Financiera en Dashboard (vista mensual, hasta diciembre del año en curso)
- Sub-widget de gastos recurrentes: detección automática (≥2 de últimos 3 meses), toggles ON/OFF, agregar manual
- Persistencia de preferencias en `localStorage` como `hc_recurrentes`
- Gráfico de barras apiladas (stacked bar): disponible + recurrentes + cuotas + créditos proporcionales al ingreso
- Calculadora de interés compuesto: slider % disponible + TEM configurable, actualiza en tiempo real
- Frases motivacionales (Buffett, Bogle, Munger) con rotación diaria
- Alerta visual si algún mes proyectado queda en disponible negativo

### Novedades v5 / v5.1
- Rediseño premium completo (Aston Martin palette, Duolingo-style UI)
- Health Score widget con 4 pilares (ahorro, inversión, deuda, metas)
- Módulo Importar con IA: PDF upload (pdf.js) + Claude API via Apps Script proxy
- Soporte multi-banco: BBVA, BNA Mastercard, BNA Visa, Banco Santa Fe, Mercado Pago
- Preview editable con columnas: Tipo, Fecha, Descripción, Categoría, Ámbito, Usuario, Cuotas (X/Y), Monto
- Reconocimiento de patrones: gastos repetidos se marcan con ✦ y heredan categoría/ámbito
- Fechas en formato DD/MM/YY en todas las tablas
- Cuotas como input numérico libre (cubre cualquier plazo)

---

## Arquitectura objetivo

```
finanzas_v4.html  (frontend — lógica + UI)
       │
       ▼
Google Apps Script  (API intermediaria — leer/escribir Sheets)
       │
       ▼
Google Sheets  (base de datos — una hoja por entidad)
```

- El HTML llama al Apps Script por fetch/JSONP
- El Apps Script lee y escribe el Sheet
- El Sheet nunca se toca manualmente en su estructura — solo se agregan columnas al final
- El código se versiona en GitHub (una rama por versión estable)

---

## Usuarios

| ID | Nombre actual | Descripción |
|----|--------------|-------------|
| u1 | VH | Usuario 1 |
| u2 | MG | Usuario 2 |
| fam / comp | — | Gastos/ingresos conjuntos |

Los nombres son configurables desde la UI (engranaje arriba a la derecha).

---

## Estructura de datos

### Hoja: Gastos
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | número | ID único autoincremental |
| fecha | YYYY-MM-DD | Fecha del gasto |
| desc | texto | Descripción |
| cat | texto | Categoría (ver lista abajo) |
| amb | texto | Ámbito: `fam` = familiar, `u1` = personal usuario 1, `u2` = personal usuario 2 |
| quien | texto | Quién pagó: `u1`, `u2`, `comp` (conjunto) |
| medio | texto | Medio de pago |
| cuotas | número | Cantidad de cuotas (1 = contado) |
| monto | número | Monto total en ARS |
| notas | texto | Notas opcionales |

### Hoja: Ingresos
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | número | ID único |
| fecha | YYYY-MM-DD | Fecha |
| desc | texto | Descripción |
| tipo | texto | Tipo: Sueldo neto / Premio-bono / Aguinaldo / Negocio-freelance / Alquiler cobrado / Dividendos / Otro |
| quien | texto | `u1`, `u2`, `fam` |
| monto | número | Monto en ARS |
| rec | número | 0 = único, 1 = recurrente mensual |

### Hoja: Inversiones
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | número | ID único |
| activo | texto | Ticker o nombre (MELI, BTC, AL30…) |
| tipo | texto | CEDEARs / Bono / Crypto / FCI / Acción local / Plazo fijo |
| plat | texto | Plataforma: Bull Market / Binance / Banco / Otra |
| mon | texto | Moneda: ARS o USD |
| qty | número | Cantidad |
| pe | número | Precio de entrada |
| pa | número | Precio actual |
| fe | YYYY-MM-DD | Fecha de entrada |

### Hoja: Metas
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | número | ID único |
| nom | texto | Nombre de la meta |
| tipo | texto | Ahorro / Inversión / Gasto programado |
| obj | número | Monto objetivo en ARS |
| act | número | Monto acumulado actual |
| fecha | YYYY-MM-DD | Fecha límite |
| color | hex | Color de la barra (#1D9E75, etc.) |
| done | número | 0 = activa, 1 = cumplida (trofeo) |

### Hoja: Deudas
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | número | ID único |
| nom | texto | Nombre del crédito |
| tipo | texto | Hipotecario / Personal / Prendario / Tarjeta / Deuda informal |
| cap | número | Capital original en ARS |
| tna | número | Tasa nominal anual en % (ej: 8.5) |
| plazo | número | Plazo total en cuotas |
| pag | número | Cuotas ya pagadas |
| ent | texto | Entidad (banco, persona, etc.) |
| own | texto | Titularidad: `fam`, `u1`, `u2` |

### Hoja: Configuracion
| Clave | Valor por defecto | Descripción |
|-------|-------------------|-------------|
| u1_nombre | VH | Nombre usuario 1 |
| u2_nombre | MG | Nombre usuario 2 |
| tc | 1200 | Tipo de cambio USD/ARS |
| dist_modo | gastos_primero | Modo de distribución: `gastos_primero` o `inv_primero` |
| dist_inv | 500000 | Inversión mensual fija (modo B) |
| dist_gu1 | 200000 | Presupuesto personal u1 |
| dist_gu2 | 200000 | Presupuesto personal u2 |
| app_nombre | finanzas familia | Nombre de la app |

### Hoja: Categorias
| Columna | Tipo | Descripción |
|---------|------|-------------|
| nombre | texto | Nombre de la categoría |
| color | hex | Color en formato #RRGGBB |
| amb | texto | `fam` = familiar, `ind` = individual |

---

## Categorías predefinidas

| Nombre | Color | Ámbito |
|--------|-------|--------|
| Supermercado | #1D9E75 | fam |
| Restaurantes | #EF9F27 | fam |
| Transporte | #378ADD | fam |
| Salud | #E24B4A | fam |
| Educación | #7F77DD | fam |
| Entretenimiento | #D85A30 | fam |
| Servicios | #888780 | fam |
| Hogar | #639922 | fam |
| Ropa | #D4537E | ind |
| Belleza/cuidado | #FA8072 | ind |
| Gustos personales | #9B59B6 | ind |
| Regalos | #E67E22 | ind |
| Otros | #5F5E5A | fam |

---

## Funcionalidades implementadas (v4)

### Dashboard
- Vista mensual: ingresos, flujo de caja, gastos familiares vs individuales, resumen inversiones, metas con trofeos, resumen deudas
- Vista anual: comparativo últimos 3 años, gráfico mensual de ingresos vs gastos, tabla por categoría con variación %, cartera acumulada
- Navegación por mes y por año

### Ingresos
- Tipos: Sueldo neto, Premio/bono, Aguinaldo, Negocio/freelance, Alquiler cobrado, Dividendos, Otro
- Diferencia por usuario (u1, u2, conjunto)
- Recurrente vs único
- Modo A (gastos primero → inversión es el sobrante): calcula cuánto va a inversión
- Modo B (inversión fija → distribuir excedente): calcula resto por persona, compara presupuesto vs real

### Gastos
- Campos: descripción, monto, fecha, categoría, ámbito (familiar/personal), quién pagó, medio, cuotas, notas
- Filtros: por usuario, categoría, medio de pago
- Edición completa post-carga (modal con todos los campos)
- Eliminación
- **Ajuste de cuentas**: calcula cuánto se debe un miembro al otro por gastos familiares del mes, descuenta fondos conjuntos, sugiere cómo saldar

### Importar
- Parseo de texto libre (formato extracto bancario/tarjeta)
- Carga de archivos CSV/TXT (lectura automática)
- PDF: instrucción de copiar texto manualmente
- Excel: instrucción de exportar como CSV
- Preview editable antes de confirmar: todos los campos (fecha, desc, cat, ámbito, quién pagó, cuotas)
- Selección individual y masiva de ítems
- Vista de cuotas pendientes para el mes siguiente

### Inversiones
- Vista en ARS o USD (conversión por tipo de cambio configurado)
- PNL por posición y total
- Distribución por tipo (barra segmentada)
- Plataformas: Bull Market, Binance, Banco, Otra
- Monedas: ARS, USD

### Metas
- Tipos: Ahorro, Inversión, Gasto programado
- Barra de progreso con días restantes
- Marcar como cumplida → pasa a sección de Trofeos
- Trofeos: galería de metas cumplidas con monto logrado

### Créditos y deudas
- Titularidad: familiar, u1, u2
- Cálculo por sistema francés (TEM desde TNA)
- Tabla de amortización: capital vs interés vs saldo por cuota
- Simulador de adelanto de capital: dos estrategias
  - Reducir cantidad de cuotas (misma cuota mensual)
  - Reducir monto de cuota (mismas cuotas restantes)
- Proyección mes siguiente: cuotas de créditos + cuotas de tarjeta pendientes

---

## Reglas de evolución del proyecto

### Regla 1 — Solo agregar, nunca renombrar ni borrar
Cuando una iteración requiera cambios en la estructura del Sheet, siempre se agregan columnas al final de la hoja correspondiente. Nunca se renombran ni eliminan columnas existentes. Los registros viejos sin ese dato muestran vacío o valor por defecto.

### Regla 2 — Versionado en GitHub
Antes de cada iteración significativa:
1. Commit del estado actual con tag de versión (v4, v5…)
2. Desarrollar la nueva versión en rama `dev`
3. Probar con Sheet de prueba
4. Merge a `main` solo cuando funciona correctamente

### Regla 3 — Script de migración para cambios de estructura
Cada vez que se agreguen columnas al Sheet, se genera un script Apps Script de migración que agrega las columnas vacías a los registros existentes. El script de migración se guarda en `/migrations/` con el número de versión.

### Regla 4 — Separación de responsabilidades
- `finanzas_vN.html` → toda la UI y lógica del frontend
- `appsscript/Code.gs` → API que lee/escribe el Sheet
- `appsscript/Migrations.gs` → scripts de migración por versión
- `PROYECTO.md` → este archivo, se actualiza con cada versión

### Regla 5 — Entorno de prueba antes de producción
El Sheet tiene dos versiones:
- `Finanzas Familia — PROD` → datos reales
- `Finanzas Familia — TEST` → para probar cambios
La URL del Sheet en el código se configura por variable, no hardcodeada.

---

## Infraestructura actual

| Componente | Detalle |
|------------|---------|
| Repo GitHub | github.com/mauri214/HouseholdCap |
| Google Sheet TEST | ID: `1IxTLG38x-Zr-JhTI0AU-VNCINtRQjJ6Ne6ErA0Yyrzs` |
| Google Sheet PROD | pendiente de crear |
| Apps Script | deployado como Web App (acceso: cualquier usuario + token) |
| Token / URL | guardados en `localStorage` del navegador — no se commitean |

---

## Brokers y plataformas en uso

| Plataforma | Tipo | Moneda | Integración |
|------------|------|--------|-------------|
| Bull Market Broker | Acciones / Bonos / CEDEARs | ARS | Importación CSV manual |
| Binance | Crypto | USD | API key (read-only) — pendiente |
| Bancos locales | FCI / Plazo fijo | ARS | Importación CSV / texto manual |

---

## Pendientes / Roadmap

### Completados
- [x] Conectar Google Sheets como base de datos ✓
- [x] Configurar GitHub para versionado ✓
- [x] URL fija para acceso desde celular ✓ → https://mauri214.github.io/HouseholdCap/
- [x] Rediseño premium Aston Martin ✓
- [x] Health Score widget ✓
- [x] Módulo Importar con IA (Claude API via Apps Script proxy) ✓
- [x] Soporte multi-banco (BBVA, BNA, Santa Fe, Mercado Pago) ✓
- [x] Reconocimiento de patrones históricos en importación ✓
- [x] Cuotas X/Y en importación y módulo Gastos ✓
- [x] Widget de Proyección Financiera en Dashboard (v5.2) ✓

### Completado — v5.2: Proyección Financiera en Dashboard

**Objetivo:** Widget en Dashboard que proyecte ingresos, gastos y disponible mes a mes hasta diciembre del año en curso, con incentivo de inversión por interés compuesto.

**Componentes a implementar:**

#### 1. Gestión de gastos recurrentes (paso previo a la proyección)

La detección automática es una **sugerencia**, no una verdad. El usuario tiene control total.

**Sub-widget "Gastos recurrentes para proyección"** (colapsable, arriba del gráfico):
- El sistema detecta candidatos: gastos que aparecen en ≥2 de los últimos 3 meses (mismo desc+cat)
- Muestra lista editable con: descripción, categoría, monto promedio, toggle ON/OFF
- Los que están OFF no se incluyen en la proyección
- Botón "+ Agregar" para sumar gastos recurrentes que no fueron detectados automáticamente
- Persistencia en `localStorage` como `hc_recurrentes` (preferencia del usuario, no va a Sheets)

Estructura de cada ítem:
```js
{
  desc: 'OSDE cuota',
  cat: 'Salud',
  monto: 142000,   // promedio de los meses detectados
  activo: true,    // toggle del usuario
  manual: false    // true si fue agregado a mano
}
```

#### 2. Motor de proyección (`calcProyeccion()`)
Inputs:
- Ingresos recurrentes (`rec=1`) → se repiten cada mes
- Gastos recurrentes: **solo los aprobados por el usuario** en el sub-widget (toggle=true)
- Cuotas pendientes: por mes según fecha de inicio y total de cuotas (`calcCuotasPend` ya existe)
- Deudas activas: cuota mensual fija (sistema francés ya calculado)

Output por mes (mes actual → diciembre):
```
{
  mes: 'julio',
  ingresos: 3_200_000,
  gastosRecurrentes: 1_800_000,
  cuotasPendientes: 420_000,
  deudas: 180_000,
  disponible: 800_000,      // ingresos - todo lo anterior
  acumulado: 800_000        // suma del disponible desde hoy
}
```

#### 2. Gráfico de barras apiladas (mes a mes)
- Barras: ingresos (verde), gastos recurrentes (rojo), cuotas (naranja), deudas (marrón)
- Línea: disponible acumulado
- Rango: mes actual → diciembre

#### 3. Widget "¿Qué pasa si invierto el disponible?"
- Input: % del disponible mensual a invertir (slider, default 30%)
- TEM configurable (default: 5% mensual — referencia plazo fijo)
- Cálculo de interés compuesto mes a mes sobre el disponible proyectado
- Muestra capital + intereses acumulados a diciembre

#### 4. Frases motivacionales
- Rotación de 8-10 frases de Buffett, Bogle, Munger, etc. en español
- Contextuales: si el disponible proyectado cae en algún mes → mensaje de alerta
- Si el disponible es positivo todos los meses → mensaje de incentivo a invertir

**Datos necesarios (ya disponibles):**
- `gastos[]` con `fecha`, `desc`, `cat`, `cuotas`, `monto`
- `ingresos[]` con `monto`, `rec`
- `deudas[]` con `cap`, `tna`, `plazo`, `pag`
- `calcCuotasPend(m, y)` → ya existe en el código

**No requiere cambios en Google Sheets** — toda la proyección es calculada en frontend.

---

### Backlog futuro
- [ ] Conectar API Binance (read-only) para PNL automático de crypto
- [ ] Notificaciones de metas próximas a vencer
- [ ] Exportación a PDF del resumen mensual
- [ ] App nativa (PWA → App Store / Play Store)

---

## Cómo retomar el proyecto en Claude Code

1. Abrí Claude Code
2. Abrí la carpeta del proyecto
3. Decile: *"Leé PROYECTO.md y finanzas_v4.html para retomar el contexto"*
4. Describí lo que querés cambiar o agregar
5. Claude Code va a entender la arquitectura, las reglas y el estado actual sin necesidad de re-explicar todo

