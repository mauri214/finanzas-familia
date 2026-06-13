# 4 · Análisis de seguridad y datos

> Contexto: app de uso personal para 2 personas, repo **público** en GitHub, hosting en GitHub Pages. El modelo de amenaza es modesto (no es multi-tenant), pero hay un hallazgo serio.

---

## 🔴 VULNERABILIDAD CRÍTICA — Token de API hardcodeado en repo público

**Archivo**: `appsscript/Code.gs`, línea 15
```js
var API_TOKEN = 'ucspyuncxefg9gpszai1d';
```
- También está hardcodeado el **`SPREADSHEET_ID`** (línea 10): `1IxTLG38x-Zr-JhTI0AU-VNCINtRQjJ6Ne6ErA0Yyrzs`.
- El `Code.gs` está **commiteado en un repo público**. Cualquiera que:
  1. lea el repo (token visible), y
  2. obtenga la URL del Web App (se expone en el tráfico del navegador / localStorage de cualquier dispositivo donde se haya usado),

  puede hacer `getAll`, `insert`, `update`, `delete` sobre **todos** los datos financieros, y disparar `callClaude` (gastando tu cuota de API de Anthropic).

**Esto viola directamente CLAUDE.md**: *"No hardcodear URLs ni credenciales — usar variables de configuración"* y *"No commitear el token"* (PROYECTO.md).

### Mitigación recomendada (orden de prioridad)
1. **Rotar el token YA**: generá uno nuevo y cambialo en la app (campo Token) y en el Apps Script.
2. **Mover el token a Script Properties** (igual que `CLAUDE_API_KEY`):
   ```js
   var API_TOKEN = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
   ```
   Así nunca queda en el código versionado.
3. **Sacar el `SPREADSHEET_ID` del código** → también a Script Properties.
4. **Limpiar el historial de Git** si se quiere borrar el token viejo del pasado (git filter-repo / BFG). El token viejo ya está comprometido aunque se rote; por eso el paso 1 es lo importante.
5. Confirmar que `.gitignore` cubre cualquier archivo con secretos. (Hoy `Code.gs` **sí** se versiona y contiene el secreto — ese es el problema).

> ⚠️ Como esto toca producción/credenciales, según CLAUDE.md **requiere tu confirmación explícita** antes de que yo modifique `Code.gs`, rote tokens o reescriba historial. Lo dejo señalado, no lo ejecuto.

---

## Privacidad

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Datos solo en Sheet personal | ✅ | No hay backend de terceros salvo Anthropic (solo recibe el **texto del extracto**, no se almacena del lado de la app). |
| Leak de datos sensibles | 🟡 | El extracto bancario completo se envía a la API de Claude. Es funcional y necesario, pero conviene avisar al usuario ("tu extracto se procesa con IA"). |
| `localStorage` con secretos | 🟡 | `ff_script_token` y `ff_script_url` viven en localStorage en claro. En un dispositivo compartido, otro usuario del navegador los ve. Riesgo bajo para uso personal. |
| Exportaciones | n/a | No hay exportación implementada todavía (roadmap). |

---

## Validaciones de entrada

| Validación | Estado | Detalle |
|-----------|--------|---------|
| Campos obligatorios | 🟡 | `saveGasto`/`saveIng` validan desc+monto. `saveInv` valida de más (bloquea 0, BUG-INV1). |
| XSS / inyección HTML | 🔴 | **`escHTML` existe pero casi no se usa** (8 ocurrencias). La mayoría de los textos del usuario (`g.desc`, `i.desc`, `m.nom`, `g.notas`, `i.tipo`, `inv.activo`) se interpolan directo en `innerHTML`. Un valor con `<` rompe el render; con `<img onerror=...>` ejecuta JS. Para 2 usuarios de confianza el riesgo es bajo, pero **los datos importados vienen de un extracto + IA** (entrada semi-externa), así que conviene escapar todo lo que se renderiza. |
| Montos negativos | 🟡 | Permitidos en gastos (se usan para bonificaciones, intencional). No hay guardia donde no corresponde (p. ej. ingreso negativo, objetivo de meta negativo). |
| Fechas futuras | 🟡 | No se validan. Un gasto en 2099 entra sin aviso y descuadra proyecciones/cuotas. |
| División por cero | 🟡 | Protegida en varios lugares (`tInv>0`, `ingT>0`, `capT>0`) pero **no** en metas (`obj=0`) ni en la leyenda de la dona (`tA=0`). |

### 🔴 Recomendación XSS
Envolver con `escHTML()` toda interpolación de texto libre del usuario en plantillas: `${escHTML(g.desc)}`, `${escHTML(i.desc)}`, `${escHTML(m.nom)}`, `${escHTML(g.notas)}`, `${escHTML(inv.activo)}`, nombres de categorías y `cfg.u1/u2/app`.

---

## Autenticación / transporte

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| HTTPS | ✅ | GitHub Pages y Apps Script son HTTPS. |
| CORS | ✅ (de facto) | El proxy `callClaude` server-side evita CORS con Anthropic. El POST a Apps Script no usa preflight (content-type text/plain implícito en fetch sin headers). |
| Token en cada request | ✅ | `handleRequest` valida `token !== API_TOKEN` → `No autorizado`. Bien, pero el token está comprometido (ver arriba). |
| Rate limiting | 🔴 | No hay. Cualquiera con el token puede agotar la cuota de Anthropic o saturar el Sheet. Apps Script tiene cuotas propias que actúan como límite tosco. |
| Autorización por usuario | n/a | No hay login; un solo token para todo. Aceptable para uso familiar, no para producto. |

---

## Prioridad de fixes de seguridad

| # | Severidad | Acción | Esfuerzo |
|---|-----------|--------|----------|
| 1 | 🔴 Crítica | **Rotar token** + moverlo a Script Properties | 30 min (requiere tu OK) |
| 2 | 🔴 Crítica | Mover `SPREADSHEET_ID` a Script Properties | 15 min |
| 3 | 🔴 Alta | Escapar HTML (`escHTML`) en todos los render | 2–3 h |
| 4 | 🟡 Media | Validar fechas (rango razonable) y montos según contexto | 1–2 h |
| 5 | 🟡 Baja | Aviso de privacidad al usar IA con extractos | 30 min |
| 6 | 🟡 Baja | Considerar limpiar historial de Git del token viejo | 1 h |
