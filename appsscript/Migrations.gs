// ============================================================
// Finanzas Familia — Migrations
// Cada función migra de una versión a la siguiente.
// Correr manualmente desde el editor de Apps Script.
// ============================================================

// Plantilla para futuras migraciones:
//
// function migrateV4toV5() {
//   var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
//   var sh = ss.getSheetByName('Gastos');
//   // Agregar columna nueva al final
//   var lastCol = sh.getLastColumn();
//   sh.getRange(1, lastCol + 1).setValue('nueva_columna');
//   // Rellenar registros existentes con valor por defecto
//   var lastRow = sh.getLastRow();
//   if (lastRow > 1) {
//     sh.getRange(2, lastCol + 1, lastRow - 1, 1).setValue('');
//   }
//   Logger.log('Migración v4→v5 completada');
// }
