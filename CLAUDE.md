# Instrucciones para Claude Code — Finanzas Familia

## Contexto del proyecto
Este es un proyecto de finanzas personales para una pareja.
Siempre leer PROYECTO.md al inicio de cada sesión para retomar el contexto completo.
El archivo principal es finanzas_v5.3.html (o la versión más reciente disponible en la carpeta).

## Permisos generales — no pedir confirmación para estas acciones
- Leer, crear y editar archivos dentro de esta carpeta y sus subcarpetas
- Ejecutar comandos de Git: commit, push, pull, branch, merge, tag
- Crear carpetas y subcarpetas dentro del proyecto
- Ejecutar scripts de Node.js y Python dentro del proyecto
- Instalar dependencias (npm install, pip install) cuando el proyecto lo requiera
- Correr servidores locales de desarrollo (localhost)
- Renombrar archivos dentro del proyecto

## Siempre pedir confirmación explícita antes de
- Cualquier acción fuera de esta carpeta del proyecto
- Eliminar archivos o carpetas (borrado permanente)
- Resetear o revertir commits que puedan afectar historial
- Publicar, deployar o subir a producción
- Operaciones sobre la base de datos de producción (Google Sheets PROD)
- Compartir, imprimir o exponer credenciales o API keys

## Reglas de versionado
- Antes de cada cambio significativo, hacer commit del estado actual
- Mensajes de commit en español, descriptivos, con número de versión cuando corresponda
  - Ejemplo: "v5 — agrega exportación PDF del resumen mensual"
  - Ejemplo: "fix — corrige cálculo de cuotas pendientes en importar"
- Cada versión estable lleva un tag de Git: v4, v5, v6…
- Desarrollar cambios nuevos en rama `dev`, mergear a `main` solo cuando funciona

## Reglas para cambios en Google Sheets
- Nunca renombrar ni eliminar columnas existentes en ninguna hoja
- Solo agregar columnas nuevas al final de la hoja correspondiente
- Toda nueva columna debe tener un valor por defecto para registros anteriores
- Antes de cualquier cambio en el Sheet de producción, probar primero en el Sheet de TEST
- Si un cambio requiere migración de datos, generar primero el script de migración en /migrations/

## Estilo de trabajo
- Leer PROYECTO.md al inicio de cada sesión nueva antes de cualquier acción
- Si algo puede romper datos existentes, avisar y proponer alternativa antes de proceder
- Mantener PROYECTO.md actualizado cuando se completen ítems del roadmap o se agreguen funcionalidades nuevas
- Guardar cada versión del HTML con número incremental: finanzas_v5.html, finanzas_v6.html…
- No hardcodear URLs ni credenciales en el código — usar variables de configuración

## Estructura de carpetas esperada
```
finanzas-familia/
├── CLAUDE.md              ← este archivo
├── PROYECTO.md            ← contexto y documentación del proyecto
├── finanzas_v5.3.html     ← versión actual del frontend
├── appsscript/
│   ├── Code.gs            ← API Google Apps Script (pendiente)
│   └── Migrations.gs      ← scripts de migración por versión (pendiente)
└── migrations/            ← historial de migraciones de datos (pendiente)
```
