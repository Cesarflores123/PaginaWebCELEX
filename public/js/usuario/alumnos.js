const socket = io();

let alumnosClasificados = {};

// Variable global para almacenar el tipo de curso seleccionado
let tipoCursoSeleccionado = null;

let idsTablas = [];
let idsRuletas = [];
let idsCanvas = []; 
let ganadores = [];

document.addEventListener('DOMContentLoaded', () => {
  const fechaGuardada = localStorage.getItem('fecha');
  const horaGuardada = localStorage.getItem('hora');
  console.log('Fecha guardada:', fechaGuardada);
  console.log('Hora guardada:', horaGuardada);

  const tipoCursoGuardado = localStorage.getItem('tipoCurso');

  if (alumnosClasificados && tipoCursoGuardado) {
    generarTablasYRuletas(alumnosClasificados, tipoCursoGuardado);
    if (fechaGuardada && horaGuardada) {
      iniciarGirosTodos(fechaGuardada, horaGuardada);
    }
  } else {
    console.error('No se encontraron alumnos clasificados o tipo de curso.');
  }

  if (tipoCursoGuardado === 'INTENSIVO') {
    socket.emit('getAlumnos', { tipoCurso: 'I' });
  } else if (tipoCursoGuardado === 'SABATINO') {
    socket.emit('getAlumnos', { tipoCurso: 'S' });
  } else {
    socket.emit('getAlumnos', { tipoCurso: 'I' });
    socket.emit('getAlumnos', { tipoCurso: 'S' });
  }
});

socket.on('mostrarFechaHora', (data) => {
  const { fechaHora, tipoCurso } = data;

  // Verificar lo que llega del servidor
  console.log('Datos recibidos del servidor:', fechaHora, tipoCurso);

  if (!tipoCurso) {
    console.error('Error: tipoCurso es undefined');
    return;
  }

  // Guardar el tipo de curso en localStorage
  localStorage.setItem('tipoCurso', tipoCurso);

  // Separar la fecha y la hora
  const [fecha, hora] = fechaHora.split('T');

  // Guardar la fecha y la hora en localStorage
  localStorage.setItem('fecha', fecha);
  localStorage.setItem('hora', hora);

  // Dependiendo del tipo de curso, realizar la solicitud para obtener los alumnos
  if (tipoCurso === 'INTENSIVO') {
    socket.emit('getAlumnos', { tipoCurso: 'I' });
  } else if (tipoCurso === 'SABATINO') {
    socket.emit('getAlumnos', { tipoCurso: 'S' });
  }
});

// Cuando recibimos los datos de los alumnos
socket.on('alumnosData', (data) => {
  const { alumnos, tipoCurso } = data;
  console.log("Tipo de curso recibido:", tipoCurso);

  if (!tipoCurso) {
    console.error('Error: tipoCurso no definido en la respuesta del servidor');
  }

  // Reinicializamos el objeto de alumnos clasificados
  alumnosClasificados = {};

  // Procesamos los alumnos y agrupamos por idioma, nivel y horario
  alumnos.forEach(alumno => {
    const { idioma, boleta, nombre, apellido_paterno, nivel, horario, promedio } = alumno;

    // Si el idioma no existe en el objeto, lo creamos
    if (!alumnosClasificados[idioma]) {
      alumnosClasificados[idioma] = {};
    }

    // Si el nivel no existe dentro del idioma, lo creamos
    if (!alumnosClasificados[idioma][nivel]) {
      alumnosClasificados[idioma][nivel] = {};
    }

    // Si el horario no existe dentro del nivel, lo creamos
    if (!alumnosClasificados[idioma][nivel][horario]) {
      alumnosClasificados[idioma][nivel][horario] = [];
    }

    // Finalmente, agregamos los datos del alumno dentro del horario
    alumnosClasificados[idioma][nivel][horario].push({ boleta, nombre, apellido_paterno, nivel, horario, promedio });
  });

  // Llamamos a la función para generar dinámicamente las tablas y ruletas
  generarTablasYRuletas(alumnosClasificados, tipoCurso);
});

async function iniciarGirosTodos(fecha, hora) {
  const ahora = new Date();
  const fechaHoraObjetivo = new Date(`${fecha}T${hora}`);

  // Calcular el tiempo restante hasta la fecha y hora objetivo
  const tiempoRestante = fechaHoraObjetivo - ahora;

  if (tiempoRestante > 0) {
    console.log(`Iniciando giros en ${tiempoRestante / 1000} segundos...`);

    // Programar el inicio del giro
    setTimeout(async () => {
      const promesasGiros = idsCanvas.map(async (canvasId, index) => {
        const tablaId = idsTablas[index];  // Obtener el ID de la tabla correspondiente
        const numeros = obtenerNumerosDeTabla(tablaId);  // Obtener los números de la tabla

        // Verificar si la tabla tiene 3 o menos estudiantes
        if (numeros.length <= 3) {
          console.log(`No se necesita giro para la tabla ${tablaId} con solo ${numeros.length} estudiantes.`);
          return; // No giramos la ruleta si hay 3 o menos estudiantes
        }

        // Esperar que cada ruleta termine antes de marcar el resultado
        await dibujarRuleta(numeros, canvasId, true, tablaId, 3);
      });

      // Esperar que todas las ruletas giren al mismo tiempo
      await Promise.all(promesasGiros);
      console.log("Todas las ruletas han terminado de girar.");

      // Imprimir el arreglo de ganadores en consola
      console.log("Ganadores:", ganadores);

    }, tiempoRestante);
  } else {
    console.error('La fecha y hora del giro ya pasaron.');
  }
}

function obtenerNumerosDeTabla(tablaId) {
  const tabla = document.getElementById(tablaId);
  if (!tabla) {
    console.error(`No se encontró la tabla con ID: ${tablaId}`);
    return [];
  }

  const filas = tabla.getElementsByTagName('tr');
  const numeros = [];

  // Obtener los números (el índice de las filas) de la tabla
  for (let i = 1; i < filas.length; i++) { // Saltar el encabezado
    numeros.push(i.toString());
  }

  return numeros;
}

function marcarGanadorEnTabla(tablaId, ganador) {
  const tabla = document.getElementById(tablaId);

  if (!tabla) {
    console.error(`No se encontró la tabla con ID: ${tablaId}`);
    return;
  }

  // Buscar la fila con el número ganador y agregar una clase para resaltarla
  const filas = tabla.getElementsByTagName('tr');
  for (let i = 1; i < filas.length; i++) { // Saltar el encabezado
    const celdaNumero = filas[i].getElementsByTagName('td')[0]; // Primer columna con el número
    if (celdaNumero && celdaNumero.textContent === ganador) {
      filas[i].classList.add('bg-green-500', 'text-white'); // Mantener marcado
    }
  }
}

function generarTablasYRuletas(alumnosClasificados, tipoCurso) {
  Object.keys(alumnosClasificados).forEach(idioma => {
    const idiomaLower = idioma.toLowerCase();

    Object.keys(alumnosClasificados[idioma]).forEach(nivel => {
      Object.keys(alumnosClasificados[idioma][nivel]).forEach(horario => {
        const alumnos = alumnosClasificados[idioma][nivel][horario];

        const nivelFormatted = nivel.replace(/\s+/g, '');
        const horarioFormatted = horario.replace(/\s+/g, '');

        const divId = `estudiantes-ruleta-${idiomaLower}-${nivelFormatted}-${horarioFormatted}`;
        const estudiantesId = `estudiantes-${idiomaLower}-${nivelFormatted}-${horarioFormatted}-tabla`;
        const ruletaId = `ruleta-${idiomaLower}-${nivelFormatted}-${horarioFormatted}-ruleta`;
        const canvasId = `canvas-${idiomaLower}-${nivelFormatted}-${horarioFormatted}-ruleta`;
        const botonId = `spin-${idiomaLower}-${nivelFormatted}-${horarioFormatted}-ruleta`;

        const seccion = tipoCurso === 'I' ? `${idiomaLower}-intensivo` : `${idiomaLower}-sabatino`;
        const contenedor = document.getElementById(seccion);

        if (!contenedor) {
          console.error(`El contenedor para el idioma ${idioma} no existe en el DOM.`);
          return;
        }

        const estudiantesRuletaHtml = `
          <div id="${divId}" class="flex w-full py-4 gap-4">
            <div id="${estudiantesId}" class="w-1/2 py-4 text-center"></div>
            <div id="${ruletaId}" class="relative w-1/2 p-4 flex flex-col items-center text-center">
              <div id="spin-container" class="relative w-1/2 h-[300px] bg-white bg-opacity-50 rounded-lg flex flex-col items-center justify-start">
                <canvas id="${canvasId}" class="absolute top-0 left-0 w-full h-full bg-slate-600"></canvas>
                <button id="${botonId}" class="mt-4 bg-green-500 text-white px-4 py-2 rounded-full">Girar</button>
              </div>
            </div>
          </div>`;

        contenedor.insertAdjacentHTML('beforeend', estudiantesRuletaHtml);

        idsTablas.push(estudiantesId);
        idsRuletas.push(ruletaId);
        idsCanvas.push(canvasId);

        // Llenar la tabla con los alumnos
        llenarTablaDeAlumnos(estudiantesId, alumnos);

        const numeros = alumnos.map((_, index) => (index + 1).toString());
        ajustarCanvas(canvasId);

        // Dibujar la ruleta siempre, pero no permitir que gire si hay 3 o menos alumnos
        dibujarRuleta(numeros, canvasId, false); // Dibuja la ruleta siempre

        if (numeros.length <= 3) {
          alumnos.forEach((alumno, index) => {
            marcarGanadorEnTabla(estudiantesId, (index + 1).toString()); // Marcar ganador
            guardarGanadorEnArreglo(estudiantesId, (index + 1).toString()); // Guardar en el arreglo
          });
          // Deshabilitar el botón de giro si hay 3 o menos alumnos
          const botonGirar = document.getElementById(botonId);
          botonGirar.disabled = true;
          botonGirar.classList.add('bg-gray-500', 'cursor-not-allowed');
        } else {
          document.getElementById(botonId).addEventListener('click', () => {
            dibujarRuleta(numeros, canvasId, true);
          });
        }
      });
    });
  });
}

function ajustarCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas con id ${canvasId} no encontrado.`);
    return;
  }

  const fixedSize = 250;
  canvas.width = fixedSize;
  canvas.height = fixedSize;
}

function llenarTablaDeAlumnos(sectionId, alumnos) {
  const section = document.getElementById(sectionId);
  section.innerHTML = '';

  const tablaHtml = `
    <table class="table-auto w-full bg-negro-tranparencia">
      <thead>
        <tr>
          <th class="px-4 py-2 text-white">#</th>
          <th class="px-4 py-2 text-white">Boleta</th>
          <th class="px-4 py-2 text-white">Nombre</th>
          <th class="px-4 py-2 text-white">Nivel</th>
          <th class="px-4 py-2 text-white">Horario</th>
          <th class="px-4 py-2 text-white">Promedio</th>
        </tr>
      </thead>
      <tbody>
        ${alumnos.map((alumno, index) => `
          <tr>
            <td class="border px-4 py-2 text-white">${index + 1}</td>
            <td class="border px-4 py-2 text-white">${alumno.boleta}</td>
            <td class="border px-4 py-2 text-white">${alumno.nombre} ${alumno.apellido_paterno}</td>
            <td class="border px-4 py-2 text-white">${alumno.nivel}</td>
            <td class="border px-4 py-2 text-white">${alumno.horario}</td>
            <td class="border px-4 py-2 text-white">${alumno.promedio}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  section.innerHTML = tablaHtml;
}

function dibujarRuleta(numeros, canvasId, shouldSpin = false, tablaId, girosRestantes = 3) {
  return new Promise((resolve) => {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const arc = Math.PI / (numeros.length / 2);
    let spinAngleStart = Math.random() * 10 + 10;
    let spinTime = 0;
    let spinTimeTotal = Math.random() * 3 + 4 * 1000;
    let startAngle = 0;
    let spinTimeout = null;

    if (shouldSpin) {
      rotateWheel(); // Iniciar el giro si está habilitado
    } else {
      drawStaticWheel(); // Solo dibujar la ruleta estática si no está habilitado el giro
    }

    function drawStaticWheel() {
      const outsideRadius = canvas.width / 2 - 10;
      const insideRadius = outsideRadius * 0.6;
      const textRadius = outsideRadius * 0.85;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numeros.length; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = i % 2 === 0 ? "#d3d3d3" : "#808080";

        ctx.beginPath();
        ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
        ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(
          centerX + Math.cos(angle + arc / 2) * textRadius,
          centerY + Math.sin(angle + arc / 2) * textRadius
        );
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.fillStyle = "black";
        ctx.font = '12px Helvetica';
        const text = numeros[i];
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();
      }

      // Dibuja la flecha en la parte superior de la ruleta
      drawArrow(centerX, centerY, outsideRadius);
    }

    function rotateWheel() {
      spinTime += 30;
      if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
      }
      const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
      startAngle += (spinAngle * Math.PI / 180);
      drawStaticWheel();
      requestAnimationFrame(rotateWheel);
    }

    function stopRotateWheel() {
      clearTimeout(spinTimeout);
      const degrees = startAngle * 180 / Math.PI + 90;
      const arcd = arc * 180 / Math.PI;
      const index = Math.floor((360 - degrees % 360) / arcd);
      const ganador = numeros[index];

      // Marcar la tabla asociada con el número ganador
      marcarGanadorEnTabla(tablaId, ganador);

      // Almacenar el ganador en el arreglo de ganadores
      guardarGanadorEnArreglo(tablaId, ganador);

      // Eliminar el ganador de la lista para el siguiente giro
      numeros.splice(index, 1);

      // Si quedan más giros, volver a llamar la función
      if (girosRestantes > 1 && numeros.length > 0) {
        setTimeout(() => {
          dibujarRuleta(numeros, canvasId, true, tablaId, girosRestantes - 1).then(resolve);
        }, 1000); // Pausa de 1 segundo entre giros
      } else {
        resolve(); // Resolver la promesa cuando termine el último giro
      }
    }

    function drawArrow(centerX, centerY, outsideRadius) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY - (outsideRadius + 5));
      ctx.lineTo(centerX + 4, centerY - (outsideRadius + 5));
      ctx.lineTo(centerX + 4, centerY - (outsideRadius - 5));
      ctx.lineTo(centerX + 9, centerY - (outsideRadius - 5));
      ctx.lineTo(centerX + 0, centerY - (outsideRadius - 13));
      ctx.lineTo(centerX - 9, centerY - (outsideRadius - 5));
      ctx.lineTo(centerX - 4, centerY - (outsideRadius - 5));
      ctx.lineTo(centerX - 4, centerY - (outsideRadius + 5));
      ctx.fill();
    }

    function easeOut(t, b, c, d) {
      const ts = (t /= d) * t;
      const tc = ts * t;
      return b + c * (tc + -3 * ts + 3 * t);
    }
  });
}

function guardarGanadorEnArreglo(tablaId, ganador) {
  // Extraer los elementos del ID, eliminando el prefijo 'estudiantes-' y dividiéndolo correctamente
  const partes = tablaId.replace('estudiantes-', '').split('-');

  // Como el horario contiene un guion, debemos unir las últimas partes para obtener el horario completo, pero eliminando '-tabla'
  const idioma = partes[0];
  const nivel = partes[1];
  const horario = partes.slice(2).join('-').replace('-tabla', ''); // Eliminar el '-tabla' del final

  // Obtener los datos del alumno de la tabla (boleta, nombre, etc.)
  const tabla = document.getElementById(tablaId);
  if (tabla) {
    const filas = tabla.getElementsByTagName('tr');
    for (let i = 1; i < filas.length; i++) { // Saltar el encabezado
      const celdaNumero = filas[i].getElementsByTagName('td')[0];
      if (celdaNumero && celdaNumero.textContent === ganador) {
        const boleta = filas[i].getElementsByTagName('td')[1].textContent;
        const nombre = filas[i].getElementsByTagName('td')[2].textContent;

        // Guardar el ganador en el arreglo global
        ganadores.push({
          idioma,
          nivel,
          horario,
          boleta,
          nombre
        });

        break;
      }
    }
  }
}
