# Bug Reports — HouseholdCap v5.1
## Módulo: Importar con IA

---

> **Instrucciones:**
> - Completar un bug por sección, copiando el template
> - Asignar el número siguiente al último registrado (BUG-001, BUG-002, etc.)
> - Actualizar el **Estado** a medida que se trabaja el bug
> - Vincular al test case fallado (ej: TC-016)

---

## Niveles de Severidad

| Severidad | Descripción | Ejemplo |
|-----------|-------------|---------|
| 🔴 Crítico | La funcionalidad principal no funciona, no hay workaround | El PDF no se puede subir de ninguna manera |
| 🟠 Alto | Funcionalidad importante rota, existe workaround difícil | Los montos se redondean incorrectamente |
| 🟡 Medio | Funcionalidad secundaria afectada, hay workaround fácil | La categoría asignada no es la más precisa |
| 🟢 Bajo | Problema cosmético o de texto, no afecta funcionalidad | Un texto tiene error ortográfico |

---

## Estados de Bug

- **Abierto** — recién reportado, sin atención
- **En revisión** — el dev lo está analizando
- **En corrección** — se está trabajando el fix
- **Pendiente de verificación** — el fix fue hecho, falta confirmar que funciona
- **Cerrado** — confirmado que el bug ya no existe
- **No reproducible** — no se pudo confirmar el bug
- **No se corrige** — decisión consciente de no arreglarlo (con justificación)

---

## Template para nuevo bug (copiar esto para cada bug)

```
## BUG-XXX: [Título corto y descriptivo del bug]

**Severidad:** 🔴 Crítico / 🟠 Alto / 🟡 Medio / 🟢 Bajo
**Módulo:** Importar
**Versión:** v5.1
**Test Case relacionado:** TC-XXX
**Fecha de detección:** YYYY-MM-DD
**Detectado por:** [nombre o "Tester"]
**Asignado a:** [nombre del dev o "Sin asignar"]
**Estado:** Abierto

### Descripción breve
[Una oración que resume el problema]

### Pasos para reproducir
1. [Paso exacto que hay que hacer]
2. [Siguiente paso]
3. [Etc.]

### Resultado actual
[Qué sucede realmente, qué está mal]

### Resultado esperado
[Qué debería pasar según los requisitos]

### Evidencia
- [ ] Screenshot adjunto: [nombre_del_archivo.png]
- [ ] Log de consola copiado abajo
- [ ] Video de reproducción

**Log de consola (si aplica):**
```
[Pegar aquí el error de la consola del navegador]
```

### Entorno
- Navegador: [Chrome 124 / Firefox 125 / etc.]
- Sistema operativo: [Mac / Windows / etc.]
- Banco del PDF: [BBVA / Nación / Santa Fe / Mercado Pago]
- Tamaño del PDF: [X MB, X páginas]

### Notas adicionales
[Cualquier contexto extra, hipótesis sobre la causa, etc.]

### Historial de cambios
| Fecha | Estado | Comentario |
|-------|--------|-----------|
| YYYY-MM-DD | Abierto | Bug detectado durante testing de TC-XXX |

---
```

---

## Bugs registrados

*(No hay bugs registrados aún — el testing no ha comenzado)*

*(Copiar el template de arriba y completar cuando se encuentre un bug)*

---

## Resumen de bugs (actualizar durante el testing)

| ID | Título | Severidad | Estado | TC relacionado |
|----|--------|-----------|--------|---------------|
| — | — | — | — | — |

**Totales por severidad:**
- 🔴 Críticos: 0
- 🟠 Altos: 0
- 🟡 Medios: 0
- 🟢 Bajos: 0
- **Total: 0**

---

*Documento creado: 2026-06-08 | Versión: 1.0*
