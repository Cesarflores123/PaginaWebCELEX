// Inicializamos la conexión WebSocket
const socket = io();

// Función para manejar el procesamiento de archivos de Excel
function handleFileUpload(buttonId, fileInputId) {
  const button = document.getElementById(buttonId);
  const fileInput = document.getElementById(fileInputId);

  button.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
      alert('Por favor selecciona un archivo antes de continuar.');
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = () => {
      const workbook = XLSX.read(reader.result, { type: 'array' });
      const sheet = workbook.Sheets['Sheet1'];
      const curso  = sheet['B1'] ? String(sheet['B1'].v).toUpperCase() : null;
      const ciclo  = sheet['D1'] ? String(sheet['D1'].v).toUpperCase() : null;
      const idioma = sheet[`F1`] ? normalizeString(sheet[`F1`].v) : null;
      console.log(`B1: ${curso}, D1: ${ciclo}, F1: ${idioma}`);

      let rowIndex = 4;
      const datos = [];

      while (true) {
        const boleta    = sheet[`A${rowIndex}`] ? String(sheet[`A${rowIndex}`].v).toUpperCase() : null;
        const nombre    = sheet[`B${rowIndex}`] ? normalizeString(sheet[`B${rowIndex}`].v) : null;
        const apellidop = sheet[`C${rowIndex}`] ? normalizeString(sheet[`C${rowIndex}`].v) : null;
        const apellidom = sheet[`D${rowIndex}`] ? normalizeString(sheet[`D${rowIndex}`].v) : null;
        const promedio  = sheet[`E${rowIndex}`] ? String(sheet[`E${rowIndex}`].v).toUpperCase() : null;
        const nivel     = sheet[`F${rowIndex}`] ? normalizeString(sheet[`F${rowIndex}`].v) : null;
        const horario   = sheet[`G${rowIndex}`] ? String(sheet[`G${rowIndex}`].v).toUpperCase() : null;

        if (boleta === null && nombre === null && apellidop === null && apellidom === null && promedio === null && nivel === null && horario === null) {
          break;
        }

        datos.push({
          A: boleta, B: nombre, C: apellidop, D: apellidom, 
          E: promedio, F: nivel, G: horario
        });

        rowIndex++;
      }

      // Emitimos los datos procesados al servidor a través de WebSocket
      socket.emit('fileData', { curso: curso, ciclo: ciclo, idioma: idioma, filas: datos });

      alert('Archivo procesado con éxito!');
    };
  });
}

// Llamamos a la función para los 4 botones de subir archivos
handleFileUpload('btnUpload1', 'file1');
handleFileUpload('btnUpload2', 'file2');
handleFileUpload('btnUpload3', 'file3');
handleFileUpload('btnUpload4', 'file4');

// Escuchar el mensaje de la conexión a la base de datos desde el servidor
socket.on('dbConnection', (message) => {
  console.log('Mensaje del servidor:', message);
  alert(message);
});

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// --- NUEVA SECCIÓN: Envío de la fecha y hora al servidor ---

// Capturar el botón y el campo de fecha y hora
const btnProgramar = document.getElementById('btnProgramar');
const fechaHoraInput = document.getElementById('fechaHora');

// Enviar fecha y hora al servidor cuando se presione el botón "Programar Ruleta"
btnProgramar.addEventListener('click', () => {
  const fechaHora = fechaHoraInput.value;

  if (fechaHora) {
    // Emitir un evento con la fecha y hora al servidor
    socket.emit('programarRuleta', { fechaHora });
    console.log('Fecha y hora programadas enviadas:', fechaHora);
  } else {
    alert('Por favor selecciona una fecha y hora antes de programar.');
  }
});
