# 6 · Análisis de performance

> Escala objetivo: 2 usuarios, cientos a pocos miles de registros/año. A esa escala la app es **rápida**. Los puntos abajo importan a mediano plazo o con muchos datos.

---

## Velocidad

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Carga inicial | ✅ | `loadAll` hace **1 sola tanda** de 7 lecturas en paralelo (`Promise.all`). Eficiente. |
| Render del dashboard | 🟡 | `renderDashMes` recorre `gastos`/`ingresos` **muchas veces** (12 iteraciones para la línea de 12 meses, cada una filtrando todo el array). Con 5.000 gastos son ~60.000 comparaciones por render. Aún tolerable, pero crece O(n·12). |
| Gráficos SVG | ✅ | Generados como string, sin librería. Render instantáneo. |
| Búsqueda Cmd+K | ✅ | Filtra arrays en memoria; instantánea hasta miles de registros. |
| Cambiar filtros | 🟡 | Cada cambio re-renderiza toda la tabla (innerHTML completo). Con miles de filas se nota; conviene virtualizar o paginar. |

### Cálculos repetidos (oportunidad de optimización)
- `cuotaDet(d)` se llama **muchas veces** en cada render (dashboard: 1 vez para sdoT + 3 para familiar/u1/u2; deudas: similar). Cada llamada itera `d.pag` veces. Para hipotecas con `pag=36` y varias deudas se repite innecesariamente. *Cachear el resultado por deuda por render.*
- `getMesImp` se invoca dentro de filtros que corren por cada render y por cada mes del gráfico. Barato individualmente, pero multiplicado.
- `renderDashMes` recalcula la línea de 12 meses filtrando el array completo 12×2 veces. *Hacer una sola pasada acumulando por mes.*

---

## Memoria

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| RAM | ✅ | Todo en arrays planos; footprint bajo. |
| localStorage | ✅ | Solo preferencias + snapshots. Límite ~5 MB; los snapshots de inversiones podrían crecer si se guardan muchas posiciones por mes (cada snapshot serializa todas las posiciones). |
| Memory leaks | 🟡 | Se reasigna `innerHTML` (los listeners inline `onclick` no se acumulan como leaks reales). El listener global de `keydown` (Cmd+K) se agrega una vez. Sin leaks evidentes. |

---

## Llamadas a Google Sheets

| Operación | Llamadas | Comentario |
|-----------|----------|------------|
| Carga inicial | 7 (en paralelo) | ✅ Óptimo |
| Alta de 1 gasto | 1 insert | ✅ |
| Importar N ítems | **N inserts secuenciales** | 🟡 Necesario por el cálculo de `maxId` server-side (si fueran en paralelo, ids duplicados). Pero con 50 ítems son 50 round-trips → lento (varios segundos). *Mejora: una acción `insertBatch` que inserte todas las filas de una vez y devuelva los ids.* |
| Editar | 1 update | 🟡 `update` reescribe **celda por celda** (`setValue` por columna) en vez de un `setValues` de toda la fila → más lento de lo necesario. |
| Config | 1 setCfg | itera y `setValue` por clave |

### Rate limiting de Google
- Apps Script tiene cuotas: ~20.000 URL fetch/día, tiempo de ejecución 6 min/llamada. Una importación grande secuencial puede acercarse al timeout si Claude tarda. *Mitigar con `insertBatch`.*

---

## Mobile

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Layout responsive | 🟡 | Solo **2 media queries** (`600px`, `420px`). El grueso del layout usa `grid auto-fit minmax`, que se adapta bien, pero las **tablas** (gastos, inversiones, amortización) dependen de scroll horizontal (`overflow-x`). |
| Botones clickeables | ✅ | Tamaño táctil aceptable; iconos 13–16px. |
| Tablas en pantalla chica | 🟡 | La tabla de inversiones tiene ~12 columnas → mucho scroll horizontal en celular. Considerar vista "card" en mobile. |
| Topbar sticky | ✅ | Se mantiene; nav con `overflow-x:auto`. |

---

## Bottlenecks priorizados

| # | Impacto | Bottleneck | Mejora propuesta | Esfuerzo |
|---|---------|-----------|------------------|----------|
| 1 | Alto (con datos) | Importación = N round-trips | Acción `insertBatch` en Apps Script | 3–4 h |
| 2 | Medio | `renderDashMes` recorre arrays 24+ veces | Una sola pasada acumulando por mes | 2 h |
| 3 | Medio | `cuotaDet` recalculado múltiples veces | Cachear por deuda por render | 1 h |
| 4 | Medio | `update` celda por celda | `setValues` de fila completa | 1 h |
| 5 | Bajo | Tablas anchas en mobile | Vista card responsive | 3–4 h |

> A la escala actual (datos de 1 familia, ~1–2 años) **nada de esto es urgente**. Se vuelve relevante si se acumulan varios años o se busca convertir en producto.
