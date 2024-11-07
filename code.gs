/**
*
* Gestor de asistencia de alumnos 
* 
*
* Version: 3.2
*
* Aplicación de Google Apps Script y Google Sheets -desarrollado por Gonzalo Reynoso, DDW -
* https://ddw.com.ar - gonzita@gmail.com
*
* licencia MIT: podés darle cualquier uso sin garantías y bajo tu responsabilidad, 
* no podés eliminar los créditos del autor ni el copyright en los archivos
*
**/
function doGet(e) {

  if (e.parameter && e.parameter.page) {
    if (e.parameter.page === 'Escaner') {
      return HtmlService.createHtmlOutputFromFile('Escaner')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } else {
      return HtmlService.createHtmlOutput("Página no encontrada.");
    }
  }
  
  if (e.parameter.nombre && e.parameter.codigo && e.parameter.materia) {
    return handleAttendance(e.parameter.nombre, e.parameter.codigo, e.parameter.materia);
  }
  
  return HtmlService.createHtmlOutputFromFile('Pagina')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function saveQRData(url) {
  try {
    var nombre = getQueryParameter(url, 'nombre');
    var codigo = getQueryParameter(url, 'codigo');
    var materia = getQueryParameter(url, 'materia');

    if (!codigo) {
      return {
        status: 'invalid',
        message: 'Código inválido: no se encontró el código en el QR.',
        nombre: '',
        codigo: '',
        materia: '',
        timestamp: '',
        asistencia: ''
      };
    }

    var sheetQR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alumnos');
    var dataQR = sheetQR.getRange('A2:E32').getValues();

    var isValid = false;
    var hasExpired = false;
    var rowToClear = -1;
    var fechaCreacion;

    for (var i = 0; i < dataQR.length; i++) {
      var codigoVerificacion = dataQR[i][4]; 
      fechaCreacion = new Date(dataQR[i][2]); 

      if (!codigoVerificacion) {
        continue;
      }

      if (codigo === codigoVerificacion) {
        isValid = true;
        nombre = dataQR[i][1]; 
        materia = dataQR[i][3];
        rowToClear = i + 2;

        var now = new Date();
        var differenceInHours = (now - fechaCreacion) / (1000 * 60 * 60);

        if (differenceInHours > 24) {
          hasExpired = true;
        }
        break;
      }
    }

    if (!isValid) {
      return {
        status: 'invalid',
        message: 'Código inválido.',
        nombre: '',
        codigo: codigo,
        materia: '',
        timestamp: '',
        asistencia: ''
      };
    }

    if (hasExpired) {
      return {
        status: 'expired',
        message: 'El código expiró.',
        nombre: nombre,
        codigo: codigo,
        materia: materia,
        timestamp: '',
        asistencia: ''
      };
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('registro-asistencias');
    var now = new Date();
    var asistencia = calculateAsistencia(now);

    sheet.appendRow([nombre, now, materia, codigo, asistencia]);


    if (rowToClear !== -1) {
      sheetQR.getRange('C' + rowToClear + ':G' + rowToClear).clearContent();
    }

    return {
      status: 'success',
      message: 'La información fue registrada exitosamente.',
      nombre: nombre,
      codigo: codigo,
      materia: materia,
      timestamp: Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
      asistencia: asistencia
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Ocurrió un error al procesar el código QR: ' + error.message,
      nombre: '',
      codigo: '',
      materia: '',
      timestamp: '',
      asistencia: ''
    };
  }
}

function getData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alumnos');
  var fechaCell = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('clases').getRange('G11');
  var fechaRaw = fechaCell.getValue();
  
  var fecha;
  if (fechaRaw instanceof Date) {
    fecha = fechaRaw;
  } else if (typeof fechaRaw === 'string') {
    var partes = fechaRaw.split(' ')[0].split('/');
    var hora = fechaRaw.split(' ')[1];
    if (partes.length === 3) {
      fecha = new Date(partes[2], partes[1] - 1, partes[0], 
                      hora.split(':')[0], hora.split(':')[1]);
    }
  }
  
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    fecha = fechaCell.getDisplayValue();
    fecha = new Date(fecha);
  }

  var nombres = sheet.getRange('B2:B32').getValues().flat().filter(String);
  var materiaArray = sheet.getRange('D2:D32').getValues().flat().filter(String);
  var codigosQR = sheet.getRange('F2:F32').getValues().flat();
  var enlacesAsistencia = sheet.getRange('G2:G32').getValues().flat();

  var porcentajesAsistencia = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('asistencia').getRange('AG3:AG32').getValues().flat();
  var mensajesPersonalizados = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('asistencia').getRange('AJ3:AJ32').getValues().flat();
  
  var materiaSet = new Set(materiaArray);
  var materia = materiaSet.size === 1 ? Array.from(materiaSet)[0] : 'error';
  
  var fechaFormateada = fecha instanceof Date && !isNaN(fecha.getTime()) ?
    Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') :
    'Fecha inválida';

  return {
    fecha: fechaFormateada,
    nombres: nombres,
    materia: materia,
    codigosQR: codigosQR,
    enlacesAsistencia: enlacesAsistencia,
    porcentajesAsistencia: porcentajesAsistencia,
    mensajesPersonalizados: mensajesPersonalizados
  };
}


function testGetData() {
  var data = getData(); 
  Logger.log(data);     
}


function getQueryParameter(url, parameterName) {
  var parameterValue = '';
  var regex = new RegExp('[?&]' + parameterName + '=([^&#]*)');
  var match = regex.exec(url);
  if (match != null) {
    parameterValue = decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
  return parameterValue;
}


function calculateAsistencia(date) {
  var baseTimeCell = SpreadsheetApp.getActiveSpreadsheet()
    .getRange('clases!G11')
    .getValue();
  
  var baseTime = new Date(baseTimeCell);
  var baseHour = baseTime.getHours();
  var baseMinute = baseTime.getMinutes();
  
  Logger.log("Hora base:" + baseHour);
  Logger.log("Minutos base:" + baseMinute);
  

  var startHighHour = baseHour === 0 ? 23 : baseHour - 1;
  var startHighMinute = baseMinute;  
  var endHighHour = baseHour;
  var endHighMinute = baseMinute;  
  var endMediumHour = baseHour;
  var endMediumMinute = baseMinute; 
  
  endHighMinute += 15;
  if (endHighMinute >= 60) {
    endHighHour = (endHighHour + 1) % 24;
    endHighMinute = endHighMinute - 60;
  }
  
  endMediumMinute = baseMinute + 30;
  if (endMediumMinute >= 60) {
    endMediumHour = (endMediumHour + 1) % 24;
    endMediumMinute = endMediumMinute - 60;
  }

  var startHigh = startHighHour * 60 + startHighMinute;
  var endHigh = endHighHour * 60 + endHighMinute;
  var endMedium = endMediumHour * 60 + endMediumMinute;
  
  Logger.log("Rango alto inicio:" + startHighHour + ":" + (startHighMinute < 10 ? "0" : "") + startHighMinute);
  Logger.log("Rango alto fin:" + endHighHour + ":" + (endHighMinute < 10 ? "0" : "") + endHighMinute);
  Logger.log("Rango medio fin:" + endMediumHour + ":" + (endMediumMinute < 10 ? "0" : "") + endMediumMinute);

  var hour = date.getHours();
  var minute = date.getMinutes();
  var totalMinutes = hour * 60 + minute;


  var fechaActual = new Date(date);
  fechaActual.setHours(0,0,0,0); 
  var fechaBase = new Date(baseTime);
  fechaBase.setHours(0,0,0,0); 

  if (fechaActual.getTime() !== fechaBase.getTime()) {
    return '0';
  } else if (totalMinutes > startHigh && totalMinutes <= endHigh) {
    return '1';
  } else if (totalMinutes > endHigh && totalMinutes <= endMedium) {
    return '0.5';
  } else {
    return '0';
  }
}


function generarEnlacesAsistencia() {
  limpiarRangoGenerarQR();
  
  var sheetGeneracionQR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alumnos');
  var lastRow = sheetGeneracionQR.getRange("A:A").getValues().filter(String).length;
  var sheetClases = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('clases');
  var fechaGeneracion = sheetClases.getRange("G11").getValue(); 
  var materia = sheetClases.getRange("H11").getValue(); 
  
  //var scriptUrl = "https://script.google.com/macros/s/AKfycbwMZY8hz9KvK88KhSoOUaR6i-0-rYAXBLnIjOcMttNuBifrUNigd_hhHyIZAbkbsagsKQ/exec";
var scriptUrl = "https://script.google.com/macros/s/AKfycbwo872Ld7T4PMo-g47m6rXHUpLBYW4lNZR5ta5fM-DV/dev";
  
  if (!scriptUrl) {
    throw new Error('El script debe estar desplegado como aplicación web para generar los enlaces.');
  }

  for (var i = 2; i <= lastRow; i++) {
    var nombre = sheetGeneracionQR.getRange(i, 1).getValue(); 
    
    var codigo = generarCodigoVerificacion();
    
    sheetGeneracionQR.getRange(i, 3).setValue(fechaGeneracion); 
    sheetGeneracionQR.getRange(i, 4).setValue(materia);         
    sheetGeneracionQR.getRange(i, 5).setValue(codigo);       
    
    var textoQR = "nombre=" + encodeURIComponent(nombre) + "&codigo=" + encodeURIComponent(codigo) + "&materia=" + encodeURIComponent(materia);
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&qzone=5&data=" + encodeURIComponent(textoQR);
    
    var enlaceDirecto = scriptUrl + "?" + textoQR;
    
    sheetGeneracionQR.getRange(i, 6).setValue(qrUrl);          
    sheetGeneracionQR.getRange(i, 7).setValue(enlaceDirecto);  
  }
}



function handleAttendance(nombre, codigo, materia) {
  try {
    if (!nombre || !codigo || !materia) {
      return HtmlService.createHtmlOutput("Error: Nombre, materia, y código son requeridos.");
    }

    var sheetQR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alumnos');
    var dataQR = sheetQR.getRange('A2:E32').getValues();

    var isValid = false;
    var hasExpired = false;
    var rowToClear = -1;
    var fechaCreacion;

    for (var i = 0; i < dataQR.length; i++) {
      var codigoVerificacion = dataQR[i][4]; 
      fechaCreacion = new Date(dataQR[i][2]); 

      if (!codigoVerificacion) {
        continue;
      }

      if (codigo === codigoVerificacion) {
        isValid = true;
        nombre = dataQR[i][1]; 
        materia = dataQR[i][3];
        rowToClear = i + 2;

        var now = new Date();
        var differenceInHours = (now - fechaCreacion) / (1000 * 60 * 60);

        if (differenceInHours > 24) {
          hasExpired = true;
        }
        break;
      }
    }

    if (!isValid) {
      return HtmlService.createHtmlOutput("Código inválido.");
    }

    if (hasExpired) {
      return HtmlService.createHtmlOutput("El código ha expirado.");
    }


    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('registro-asistencias');
    var now = new Date();

    var asistencia = calculateAsistencia(now);

    sheet.appendRow([nombre, now, materia, codigo, asistencia]);

    if (rowToClear !== -1) {
      sheetQR.getRange('C' + rowToClear + ':G' + rowToClear).clearContent();
    }

    var response = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .success { color: green; }
            .info { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2 class="success">Asistencia registrada exitosamente</h2>
          <div class="info">
            <p>Nombre: ${nombre}</p>
            <p>Materia: ${materia}</p>
            <p>Fecha y hora: ${Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')}</p>
            <p>Asistencia Registrada: ${asistencia}</p>
          </div>
        </body>
      </html>
    `;

    return HtmlService.createHtmlOutput(response)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    return HtmlService.createHtmlOutput("Error al procesar la asistencia: " + error.message);
  }
}


function generarCodigoVerificacion() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var codigo = '';
  for (var i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function limpiarRangoGenerarQR() {
   var sheetGeneracionQR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alumnos');
  var rangoborrar = sheetGeneracionQR.getRange("C2:G32");
  rangoborrar.clearContent();
}


function limpiarRegistroDeAsistencia() {
   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('registro-asistencias');
  var rangoborrar = sheet.getRange("A2:E");
  rangoborrar.clearContent();
}
