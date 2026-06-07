// ============================================================
// Finanzas Familia — Apps Script API
// Versión: v4
// Hojas: Gastos, Ingresos, Inversiones, Metas, Deudas,
//        Configuracion, Categorias
// ============================================================

var SPREADSHEET_ID = 'REEMPLAZAR_CON_ID_DEL_SHEET';

// Cabeceras por hoja — orden exacto de columnas en el Sheet
var HEADERS = {
  Gastos:       ['id','fecha','desc','cat','amb','quien','medio','cuotas','monto','notas'],
  Ingresos:     ['id','fecha','desc','tipo','quien','monto','rec'],
  Inversiones:  ['id','activo','tipo','plat','mon','qty','pe','pa','fe'],
  Metas:        ['id','nom','tipo','obj','act','fecha','color','done'],
  Deudas:       ['id','nom','tipo','cap','tna','plazo','pag','ent','own'],
  Configuracion:['clave','valor'],
  Categorias:   ['nombre','color','amb']
};

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var action = params.action || body.action;
    var sheet  = params.sheet  || body.sheet;
    var data   = body.data;
    var id     = params.id     || body.id;

    var result;

    switch (action) {
      case 'getAll':        result = getAll(sheet);            break;
      case 'insert':        result = insert(sheet, data);      break;
      case 'update':        result = update(sheet, id, data);  break;
      case 'delete':        result = remove(sheet, id);        break;
      case 'getCfg':        result = getCfg();                 break;
      case 'setCfg':        result = setCfg(data);             break;
      case 'initSheets':    result = initSheets();             break;
      default:
        result = { ok: false, error: 'Acción desconocida: ' + action };
    }

    return jsonResponse(result);

  } catch(err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
// CRUD GENÉRICO
// ============================================================

function getAll(sheetName) {
  var sh = getSheet(sheetName);
  var rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return { ok: true, data: [] };

  var headers = rows[0];
  var records = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return { ok: true, data: records };
}

function insert(sheetName, data) {
  var sh = getSheet(sheetName);
  var headers = HEADERS[sheetName];

  // Auto-incrementar id si la hoja lo usa
  if (headers[0] === 'id') {
    var rows = sh.getDataRange().getValues();
    var maxId = rows.length > 1
      ? Math.max.apply(null, rows.slice(1).map(function(r){ return Number(r[0]) || 0; }))
      : 0;
    data.id = maxId + 1;
  }

  var row = headers.map(function(h) {
    var v = data[h];
    return v === undefined ? '' : v;
  });

  sh.appendRow(row);
  return { ok: true, id: data.id };
}

function update(sheetName, id, data) {
  var sh = getSheet(sheetName);
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(id)) {
      var allHeaders = HEADERS[sheetName];
      allHeaders.forEach(function(h, col) {
        if (data[h] !== undefined) {
          sh.getRange(i + 1, col + 1).setValue(data[h]);
        }
      });
      return { ok: true };
    }
  }
  return { ok: false, error: 'Registro no encontrado: id=' + id };
}

function remove(sheetName, id) {
  var sh = getSheet(sheetName);
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(id)) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Registro no encontrado: id=' + id };
}

// ============================================================
// CONFIGURACIÓN (clave-valor)
// ============================================================

function getCfg() {
  var sh = getSheet('Configuracion');
  var rows = sh.getDataRange().getValues();
  var cfg = {};
  rows.slice(1).forEach(function(row) {
    cfg[row[0]] = row[1];
  });
  return { ok: true, data: cfg };
}

function setCfg(data) {
  var sh = getSheet('Configuracion');
  var rows = sh.getDataRange().getValues();

  Object.keys(data).forEach(function(clave) {
    var found = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === clave) {
        sh.getRange(i + 1, 2).setValue(data[clave]);
        rows[i][1] = data[clave];
        found = true;
        break;
      }
    }
    if (!found) {
      sh.appendRow([clave, data[clave]]);
      rows.push([clave, data[clave]]);
    }
  });

  return { ok: true };
}

// ============================================================
// INICIALIZAR HOJAS (correr una sola vez)
// ============================================================

function initSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var log = [];

  Object.keys(HEADERS).forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      log.push('Creada: ' + name);
    } else {
      log.push('Ya existía: ' + name);
    }

    var firstRow = sh.getRange(1, 1, 1, HEADERS[name].length).getValues()[0];
    var isEmpty = firstRow.every(function(c){ return c === ''; });

    if (isEmpty) {
      sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
      sh.getRange(1, 1, 1, HEADERS[name].length)
        .setBackground('#1D9E75')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      log.push('  → cabeceras escritas');
    }
  });

  // Datos iniciales: Configuracion
  var cfgSheet = ss.getSheetByName('Configuracion');
  var cfgData = cfgSheet.getDataRange().getValues();
  if (cfgData.length <= 1) {
    var defaults = [
      ['u1_nombre',   'VH'],
      ['u2_nombre',   'MG'],
      ['tc',          '1200'],
      ['dist_modo',   'gastos_primero'],
      ['dist_inv',    '500000'],
      ['dist_gu1',    '200000'],
      ['dist_gu2',    '200000'],
      ['app_nombre',  'finanzas familia']
    ];
    cfgSheet.getRange(2, 1, defaults.length, 2).setValues(defaults);
    log.push('Configuracion: valores por defecto cargados');
  }

  // Datos iniciales: Categorias
  var catSheet = ss.getSheetByName('Categorias');
  var catData = catSheet.getDataRange().getValues();
  if (catData.length <= 1) {
    var cats = [
      ['Supermercado',      '#1D9E75', 'fam'],
      ['Restaurantes',      '#EF9F27', 'fam'],
      ['Transporte',        '#378ADD', 'fam'],
      ['Salud',             '#E24B4A', 'fam'],
      ['Educación',         '#7F77DD', 'fam'],
      ['Entretenimiento',   '#D85A30', 'fam'],
      ['Servicios',         '#888780', 'fam'],
      ['Hogar',             '#639922', 'fam'],
      ['Ropa',              '#D4537E', 'ind'],
      ['Belleza/cuidado',   '#FA8072', 'ind'],
      ['Gustos personales', '#9B59B6', 'ind'],
      ['Regalos',           '#E67E22', 'ind'],
      ['Otros',             '#5F5E5A', 'fam']
    ];
    catSheet.getRange(2, 1, cats.length, 3).setValues(cats);
    log.push('Categorias: 13 categorías cargadas');
  }

  return { ok: true, log: log };
}

// ============================================================
// HELPER
// ============================================================

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Hoja no encontrada: ' + name + '. Corré initSheets primero.');
  return sh;
}
