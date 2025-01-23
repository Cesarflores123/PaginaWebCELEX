// Inicializamos la conexión WebSocket
const socket = io();

// Capturar el botón y el campo de fecha y hora
const btnProgramar = document.getElementById('btnProgramar');
const fechaHoraInput = document.getElementById('fechaHora');
const tipoCursoRadios = document.querySelectorAll('input[name="tipoCurso"]');

// Función para manejar el procesamiento de archivos de Excel
function handleFileUpload(buttonId, fileInputId) {
  const button = document.getElementById(buttonId);
  const fileInput = document.getElementById(fileInputId);

  // Detectar cuando se selecciona un archivo
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      // Cambiar el botón a color verde y texto "SUBIR ARCHIVO"
      button.classList.remove('bg-guinda', 'hover:bg-gray-700'); // Elimina clases anteriores
      button.classList.add('bg-resultados', 'hover:bg-green-700', 'text-white'); // Agrega clases para verde
      button.innerText = 'SUBIR ARCHIVO';
    } else {
      // Revertir el botón al estado original si se deselecciona
      button.classList.remove('bg-resultados', 'hover:bg-green-700'); // Elimina las clases de verde
      button.classList.add('bg-guinda', 'hover:bg-gray-700'); // Agrega las clases originales
      button.innerText = 'Selecciona un archivo';
    }
  });


  button.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
      Swal.fire({
        title: 'Archivo no seleccionado',
        text: 'Por favor selecciona un archivo antes de continuar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        customClass: {
          confirmButton: 'bg-guinda text-white rounded-md px-4 py-2 text-lg hover:bg-gray-700',
          popup: 'bg-gray-100 border-2 border-guinda rounded-lg text-guinda'
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = () => {
      const startTime = performance.now(); // Tiempo inicial
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
        const procedencia   = sheet[`H${rowIndex}`] ? String(sheet[`H${rowIndex}`].v).toUpperCase() : null;

        if (boleta === null && nombre === null && apellidop === null && apellidom === null && promedio === null && nivel === null && horario === null && procedencia === null) {
          break;
        }

        datos.push({
          A: boleta, B: nombre, C: apellidop, D: apellidom, 
          E: promedio, F: nivel, G: horario, H: procedencia
        });

        rowIndex++;
      }

      // Emitimos los datos procesados al servidor a través de WebSocket
      socket.emit('fileData', { curso: curso, ciclo: ciclo, idioma: idioma, filas: datos });

      const endTime = performance.now(); // Tiempo final
      const totalTime = endTime - startTime; // Tiempo total
      console.log(`Tiempo total de procesamiento: ${totalTime.toFixed(2)} ms`);

      Swal.fire({
        title: '¡Éxito!',
        text: 'El archivo se procesó con éxito.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        customClass: {
          confirmButton: 'bg-guinda text-white rounded-md px-4 py-2 text-lg hover:bg-gray-700',
          popup: 'bg-gray-100 border-2 border-guinda rounded-lg text-guinda',
        },
      });
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


// Enviar fecha, hora y tipo de curso al servidor cuando se presione el botón "Programar Ruleta"
btnProgramar.addEventListener('click', () => {
  const fechaHora = fechaHoraInput.value;
  
  let tipoCursoSeleccionado = null;
  tipoCursoRadios.forEach(radio => {
    if (radio.checked) {
      tipoCursoSeleccionado = radio.value.toUpperCase();  // Asegúrate de que sea en mayúsculas
    }
  });

  // Verificar el valor de tipoCurso antes de enviarlo
  console.log('Fecha y hora:', fechaHora, 'Tipo de curso seleccionado:', tipoCursoSeleccionado);

  if (!fechaHora) {
    Swal.fire({
      title: 'Fecha y hora no seleccionadas',
      text: 'Por favor selecciona una fecha y hora antes de programar.',
      icon: 'warning',
      confirmButtonText: 'Entendido',
      customClass: {
        confirmButton: 'bg-guinda text-white rounded-md px-4 py-2 text-lg hover:bg-gray-700',
        popup: 'bg-gray-100 border-2 border-guinda rounded-lg text-guinda',
      },
    });
    return;
  }

  if (!tipoCursoSeleccionado) {
    Swal.fire({
      title: 'Tipo de curso no seleccionado',
      text: 'Por favor selecciona un tipo de curso.',
      icon: 'warning',
      confirmButtonText: 'Entendido',
      customClass: {
        confirmButton: 'bg-guinda text-white rounded-md px-4 py-2 text-lg hover:bg-gray-700',
        popup: 'bg-gray-100 border-2 border-guinda rounded-lg text-guinda',
      },
    });
    return;
  }

  // Emitir un evento con la fecha, hora y tipo de curso al servidor
  socket.emit('programarRuleta', { fechaHora, tipoCurso: tipoCursoSeleccionado });

  Swal.fire({
    title: '¡Guardado con éxito!',
    text: `El curso "${tipoCursoSeleccionado}" ha sido programado para ${fechaHora}.`,
    icon: 'success',
    confirmButtonText: 'Entendido',
    customClass: {
      confirmButton: 'bg-guinda text-white rounded-md px-4 py-2 text-lg hover:bg-gray-700',
      popup: 'bg-gray-100 border-2 border-guinda rounded-lg text-guinda',
    },
  });
});

