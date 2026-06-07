# Finanzas Familia — Documentación del Proyecto

## Visión general

Herramienta de finanzas personales para una pareja (2 usuarios), construida como web app. Permite gestionar gastos, ingresos, inversiones, metas de ahorro y créditos/deudas con foco en la realidad argentina (ARS/USD dual, brokers locales, sistema francés de amortización).

## Estado actual

- **Versión del prototipo:** v4 (`finanzas_v4.html`)
- **Stack:** HTML + CSS + JavaScript vanilla (sin frameworks), un solo archivo
- **Persistencia:** ninguna aún — los datos viven en memoria y se pierden al cerrar
- **Próximo paso:** conectar Google Sheets como base de datos + GitHub para versioning

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

## Brokers y plataformas en uso

| Plataforma | Tipo | Moneda | Integración |
|------------|------|--------|-------------|
| Bull Market Broker | Acciones / Bonos / CEDEARs | ARS | Importación CSV manual |
| Binance | Crypto | USD | API key (read-only) — pendiente |
| Bancos locales | FCI / Plazo fijo | ARS | Importación CSV / texto manual |

---

## Pendientes / Roadmap

- [ ] Conectar Google Sheets como base de datos (próximo paso)
- [ ] Configurar GitHub para versionado
- [ ] Conectar API Binance (read-only) para PNL automático de crypto
- [ ] URL fija (GitHub Pages o Google Sites) para acceso desde celular
- [ ] Notificaciones de metas próximas a vencer (opcional)
- [ ] Exportación a PDF del resumen mensual (opcional)

---

## Cómo retomar el proyecto en Claude Code

1. Abrí Claude Code
2. Abrí la carpeta del proyecto
3. Decile: *"Leé PROYECTO.md y finanzas_v4.html para retomar el contexto"*
4. Describí lo que querés cambiar o agregar
5. Claude Code va a entender la arquitectura, las reglas y el estado actual sin necesidad de re-explicar todo

