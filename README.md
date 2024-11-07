# gestor-de-asistencia-de-alumnos-a-clases
Aplicación desarrollada en Google Apps Script y Google Sheets es un sistema sencillo de gestión de asistencia a clases para colegios o institutos educativos
DESCRIPCIÓN - 			
Esta aplicación desarrollada en Google Apps Script y Google Sheets es un sistema sencillo de gestión de asistencia a clases para colegios o institutos educativos			
El mismo es utilizado en el curso anual de marketing digital del Instituto Superior Patagónico de Bariloche, en las clases de analítica web.			
Permite al alumno ver sus inasistencias y el porcentaje total de asistencias, y también obtener el código QR desde su celular, para escanear en la clase (con el celular / tablet / notebook del profesor) y dar el presente.			
Una vez cargados estos datos, el sistema generará los códigos QR o enlaces (links) para que los alumnos puedan dar el "presente" cuando llegan a clases. El escaneo registra la fecha y hora, materia, y nivel de asistencia ("0","1/2", o "1"). Por defecto viene configurado asignar "1/2" asistencia si el alumno/a llega 15 minutos tarde, y "0" asistencia si llega más de 30 minutos tarde (aunque esto es configurable desde el código fuente)			
Este registro se almacena en una hoja de cálculo y con estos datos se completa automáticamente una grilla con las asistencias de alumnos para todo el curso o bien por materia.			
			
Posee licencia MIT: podés usarlo sin cargo, modificarlo, etc, sin garantías y bajo tu propia responsabilidad, no podés eliminar ni editar los créditos del autor (Gonzalo Reynoso, DDW) ni el copyright			
			
			
SETUP  - INSTRUCCIONES PARA IMPLEMENTAR LA APLICACIÓN			
1) crea una copia de esta hoja de cálculo https://docs.google.com/spreadsheets/d/1chcjD4CCj0B83VZ00PxrR43jVcmEWA-okZePZGT7ICE/edit?usp=sharing en tu espacio de Google Drive: archivo >> crear una copia  (guarda el archivo y envía su link al escritorio o a favoritos de tu navegador para tenerlo siempre a mano. Tiene que tener esta forma: https://docs.google.com/spreadsheets/d/id_de_la_hoja_de_calculo/)			
2) edita la hoja de cálculo copiada para personalizar los datos en las pestañas 'alumnos' y 'clases' (solo edita las celdas amarillas: completa tu agenda de clases, materias, y alumnos)			
3) en el menú superior de la hoja andá a Extensiones >> Google Apps Script: Implementar >> Nueva Implementación (selecciona "Aplicación Web, Ejecutar como: Yo, Quien tiene acceso: cualquier usuario) >> implementar			
sigue los pasos, acepta los permisos, al finalizar copia la url de la aplicación web (tiene esta forma: https://script.google.com/macros/s/ID_DE_IMPLEMENTACION_DE_TU_APLICACION/exec)			
4) en el editor de Google Apps Script edita el archivo 'code.gs' en la linea 280 (y coloca la url obtenida en el paso anterior)			
5) en el editor de Google Apps Script edita el archivo 'Escaner.html' en la linea 56 (reemplaza allí la url del archivo mp3 "beep" que se reproduce cuando el escaner detecta un código)			
6) tus alumnos deben acceder siempre a https://script.google.com/macros/s/ID_DE_IMPLEMENTACION_DE_TU_APLICACION/exec (reemplaza "ID_DE_IMPLEMENTACION_DE_TU_APLICACION" por el id que obtienes en el paso 3), para ver la información de su asistencia y para obtener el código QR para dar el presente			
como cada código QR es único y puede utilizarse una sola vez -para evitar fraude-, antes de cada clase podés generar los códigos QR para tus alumnos desde la pestaña "alumnos" (en la hoja de cálculo), presionando el botón "generar QRs", o bien podés crear una tarea programada para automatizar la generación de QRs de clases			
7) vos (profesor) para acceder al escaner de QR en tu dispositivo  con cámara (tablet/celular/notebook) vas a a https://script.google.com/macros/s/ID_DE_IMPLEMENTACION_DE_TU_APLICACION/exec?page=Escaner (reemplaza "ID_DE_IMPLEMENTACION_DE_TU_APLICACION" por el id que obtienes en el paso 3), debes darle permiso a la app para acceder a la cámara de tu dispositivo			
es recomendable que realices varias pruebas antes de utilizar esta aplicación en un ámbito real			
NOTA: si la lectura del código QR falla (necesitas tener internet en el dispositivo de escaneo) podés agregar registros manualmente o editarlos en la pestaña 'registro-asistencia'			
Tarea programada para automatizar la creación de QRs:			
desde el editor de Google Apps Script, en el ícono de reloj (activadores) >> añadir activador >>			
Seleccionar qué función ejecutar: "generarEnlacesAsistencia" - Selecciona la fuente del evento: "de una hoja de cálculo" - Selecciona el tipo de evento: "al abrirse"			
			
Si necesitas ayuda ($$) para implementarlo o si encuentras un error y deseas reportarlo, enviame un email a gonzita@gmail.com			
