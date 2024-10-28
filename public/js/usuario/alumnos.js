const socket = io();
const apiKey = "561a7023-5e35-40df-b6bd-45dfdc149ae8"; // Tu clave de API de Random.org
const urlRandomOrg = "https://api.random.org/json-rpc/4/invoke";
let alumnosClasificados = {};

// Variable global para almacenar el tipo de curso seleccionado
let tipoCursoSeleccionado = null;

let idsTablas = [];
let idsRuletas = [];
let idsCanvas = []; 
let ganadores = [];

document.getElementById('resultados-button').addEventListener('click', async () => {
  try {
    // Emitir evento para obtener los últimos ganadores
    socket.emit('obtenerUltimosGanadores');

    // Escuchar los datos de los ganadores desde el servidor
    socket.on('ultimosGanadores', (ganadores) => {
      if (ganadores.length > 0) {
        // Crear la tabla de ganadores en HTML con un campo de búsqueda
        let tablaGanadores = `
          <div class="mb-4">
            <input type="text" id="buscarBoleta" placeholder="Buscar por boleta..." class="w-full px-4 py-2 border border-gray-300 rounded mb-4" />
          </div>
          <div class="overflow-x-auto"> <!-- Habilitar scroll horizontal en dispositivos pequeños -->
            <table id="tablaGanadores" class="min-w-full table-auto w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr class="bg-guinda text-white uppercase text-xs sm:text-sm">
                  <th class="px-8 py-2 min-w-[200px] whitespace-nowrap">Boleta</th> <!-- Ancho más amplio -->
                  <th class="px-8 py-2 min-w-[220px] whitespace-nowrap">Nombre</th> <!-- Ancho más amplio -->
                  <th class="px-8 py-2 min-w-[160px] whitespace-nowrap">Idioma</th>
                  <th class="px-8 py-2 min-w-[160px] whitespace-nowrap">Nivel</th>
                  <th class="px-8 py-2 min-w-[180px] whitespace-nowrap">Horario</th>
                </tr>
              </thead>
              <tbody>
        `;

        ganadores.forEach((ganador) => {
          tablaGanadores += `
            <tr class="text-xs sm:text-sm md:text-base">
              <td class="border px-4 py-2 whitespace-nowrap">${ganador.boleta}</td>
              <td class="border px-4 py-2 whitespace-nowrap">${ganador.nombre} ${ganador.apellido_paterno}</td>
              <td class="border px-4 py-2 whitespace-nowrap">${ganador.idioma}</td>
              <td class="border px-4 py-2 whitespace-nowrap">${ganador.nivel}</td>
              <td class="border px-4 py-2 whitespace-nowrap">${ganador.horario}</td>
            </tr>
          `;
        });

        tablaGanadores += `
            </tbody>
          </table>
        </div>
        `;

        // Mostrar la tabla en un SweetAlert2 modal
        Swal.fire({
          title: '🎉 ¡Felicidades a los Ganadores! 🎉',
          html: tablaGanadores,
          width: '80%',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#7b1e26', // Botón de cerrar guinda
          didOpen: () => {
            lanzarConfeti(); // Lanzar confeti cuando se abra el modal

            // Buscar boleta en tiempo real
            const buscarBoletaInput = document.getElementById('buscarBoleta');
            buscarBoletaInput.addEventListener('input', function () {
              const filter = buscarBoletaInput.value.toUpperCase();
              const table = document.getElementById('tablaGanadores');
              const tr = table.getElementsByTagName('tr');

              // Recorrer todas las filas de la tabla y ocultar las que no coincidan
              for (let i = 1; i < tr.length; i++) { // Comienza desde 1 para saltar el encabezado
                const td = tr[i].getElementsByTagName('td')[0]; // Columna de la boleta
                if (td) {
                  const txtValue = td.textContent || td.innerText;
                  if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = '';
                  } else {
                    tr[i].style.display = 'none';
                  }
                }
              }
            });
          }
        });
      } else {
        Swal.fire({
          title: 'No hay ganadores recientes.',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#7b1e26',
        });
      }
    });
  } catch (error) {
    console.error('Error al obtener los ganadores:', error);
    Swal.fire({
      title: 'Error al obtener los ganadores.',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#7b1e26',
    });
  }
});
// Función para lanzar confeti
function lanzarConfeti() {
  var end = Date.now() + (2 * 1000); // Duración del confeti: 2 segundos

  // Configuración de confeti para disparar constantemente durante 2 segundos
  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#bb0000', '#ffffff']
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#bb0000', '#ffffff']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('JavaScript cargado correctamente.');

  // Obtener datos almacenados en localStorage
  const fechaGuardada = localStorage.getItem('fecha');
  const horaGuardada = localStorage.getItem('hora');
  const tipoCursoGuardado = localStorage.getItem('tipoCurso') || 'Intensivo';
  const tipoCursoGuardadoMinusculas = tipoCursoGuardado.toLowerCase();
  console.log('Tipo de curso guardado:', tipoCursoGuardadoMinusculas);

  // Referencias a las secciones
  const seccionIntensivo = document.getElementById('intensivo');
  const seccionSabatino = document.getElementById('sabatino');
  const idiomas = ['ingles', 'frances', 'aleman', 'italiano'];

  // Función para ocultar todas las secciones de idiomas
  const ocultarTodosLosIdiomas = () => {
    console.log('Ocultando todos los idiomas.');
    idiomas.forEach(idioma => {
      document.getElementById(`${idioma}-intensivo`).style.display = 'none';
      document.getElementById(`${idioma}-sabatino`).style.display = 'none';
    });
  };

  // Función para mostrar un idioma específico
  const mostrarIdioma = (idioma) => {
    ocultarTodosLosIdiomas();
    if (tipoCursoGuardadoMinusculas === 'intensivo') {
      seccionIntensivo.style.display = 'block';
      document.getElementById(`${idioma}-intensivo`).style.display = 'block';
      console.log(`Mostrando ${idioma}-intensivo`);
    } else if (tipoCursoGuardadoMinusculas === 'sabatino') {
      seccionSabatino.style.display = 'block';
      document.getElementById(`${idioma}-sabatino`).style.display = 'block';
      console.log(`Mostrando ${idioma}-sabatino`);
    }
  };

  // Mostrar inglés por defecto al cargar la página
  mostrarIdioma('ingles');

  // Verifica si los elementos se seleccionan y los eventos se agregan correctamente.
  const enlaces = document.querySelectorAll('a[data-idioma]');
    console.log('Enlaces de idiomas encontrados:', enlaces);

    enlaces.forEach(link => {
      console.log('Agregando evento a:', link);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const idiomaSeleccionado = link.getAttribute('data-idioma');
        console.log('Idioma seleccionado:', idiomaSeleccionado);
        mostrarIdioma(idiomaSeleccionado);
      });
    });


  // Emitir datos de acuerdo al tipo de curso
  if (typeof alumnosClasificados !== 'undefined' && tipoCursoGuardado) {
    generarTablasYRuletas(alumnosClasificados, tipoCursoGuardado);
    if (fechaGuardada && horaGuardada) {
      iniciarGirosTodos(fechaGuardada, horaGuardada);
    }
  } else {
    console.error('No se encontraron alumnos clasificados o tipo de curso.');
  }

  if (typeof socket !== 'undefined') {
    if (tipoCursoGuardadoMinusculas === 'intensivo') {
      socket.emit('getAlumnos', { tipoCurso: 'I' });
    } else if (tipoCursoGuardadoMinusculas === 'sabatino') {
      socket.emit('getAlumnos', { tipoCurso: 'S' });
    }
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

async function obtenerNumerosAleatorios(cantidad, min = 1, max = 100) {
  const requestData = {
    jsonrpc: "2.0",
    method: "generateIntegers",
    params: {
      apiKey: apiKey,
      n: cantidad,    // Cantidad de números aleatorios
      min: min,       // Valor mínimo del rango
      max: max,       // Valor máximo del rango
      replacement: false // No permitir duplicados
    },
    id: 1
  };

  try {
    const response = await fetch(urlRandomOrg, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });
    const data = await response.json();
    return data.result ? data.result.random.data : null;
  } catch (error) {
    console.error("Error al hacer la solicitud a Random.org:", error);
    return null;
  }
}

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

      //enviarGanadoresAlServidor();

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
          <div id="${divId}" class="flex flex-col md:flex-row w-full py-4 gap-4">
            <div id="${estudiantesId}" class="w-full md:w-1/2 py-4 text-center"></div>
            <div id="${ruletaId}" class="relative w-full md:w-1/2 p-4 flex flex-col items-center text-center">
              <div id="spin-container" class="relative w-full h-[300px] bg-white bg-opacity-50 rounded-lg flex flex-col items-center justify-start">
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
    <div class="overflow-x-auto">
    <table class="table-auto w-full bg-negro-tranparencia">
      <thead>
        <tr class="bg-guinda text-white uppercase text-xs sm:text-sm">
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
  </div>
  `;

  section.innerHTML = tablaHtml;
}

async function dibujarRuleta(numeros, canvasId, shouldSpin = false, tablaId, girosRestantes = 3) {
  return new Promise(async (resolve) => {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const arc = Math.PI / (numeros.length / 2);
    
    // Obtén los números aleatorios para spinAngleStart y spinTimeTotal
    const aleatorios = await obtenerNumerosAleatorios(2, 10, 20); // Para angle y time
    // Modificar el tiempo de giro para estar entre 5 y 10 segundos
    const tiempoGiro = await obtenerNumerosAleatorios(1, 5, 10);
    
    if (!aleatorios) {
      console.error("No se pudieron obtener los números aleatorios");
      resolve();
      return;
    }
    
    let spinAngleStart = aleatorios[0]; // Ángulo inicial de giro
    let spinTime = 0;
    let spinTimeTotal = tiempoGiro[0] * 1000; // Tiempo total de giro (en milisegundos)
    let startAngle = 0;

    if (shouldSpin) {
      rotateWheel();
    } else {
      drawStaticWheel();
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
      const degrees = startAngle * 180 / Math.PI + 90;
      const arcd = arc * 180 / Math.PI;
      const index = Math.floor((360 - degrees % 360) / arcd);
      const ganador = numeros[index];
      marcarGanadorEnTabla(tablaId, ganador);
      guardarGanadorEnArreglo(tablaId, ganador);
      numeros.splice(index, 1);

      if (girosRestantes > 1 && numeros.length > 0) {
        setTimeout(() => {
          dibujarRuleta(numeros, canvasId, true, tablaId, girosRestantes - 1).then(resolve);
        }, 1000);
      } else {
        resolve();
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

function enviarGanadoresAlServidor() {
  socket.emit('guardarGanadores', ganadores); // Emitir el arreglo de ganadores al servidor
}