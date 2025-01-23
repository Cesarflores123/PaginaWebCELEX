const socket = io();
const apiKey = "04101b23-e033-493c-abb5-12f5b6933fdd";
const urlRandomOrg = "https://api.random.org/json-rpc/4/invoke";
let alumnosClasificados = {};

let estadoRuletas = {}; 
let tipoCursoSeleccionado = null;

let idsTablas = [];
let idsRuletas = [];
let idsCanvas = []; 
let ganadores = [];

window.addEventListener('beforeunload', () => {
  if (socket) {
    console.log('Desconectando socket antes de cerrar la ventana.');
    socket.disconnect();
  }
});

document.getElementById('resultados-button').addEventListener('click', async () => {
  try {
    socket.emit('obtenerUltimosGanadores');
    socket.on('ultimosGanadores', (ganadores) => {
      if (ganadores.length > 0) {
        let tablaGanadores = `
          <div class="mb-4">
            <input type="text" id="buscarBoleta" placeholder="Buscar por boleta..." class="w-full px-4 py-2 border border-gray-300 rounded mb-4" />
          </div>
          <div class="overflow-x-auto"> <!-- Habilitar scroll horizontal en dispositivos pequeños -->
            <table id="tablaGanadores" class="min-w-full table-auto w-full bg-white rounded-lg shadow-lg border-separate">
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

        Swal.fire({
          title: '🎉 ¡Felicidades a los Ganadores! 🎉',
          html: tablaGanadores,
          width: '80%',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#7b1e26',
          didOpen: () => {
            lanzarConfeti(); 

            const buscarBoletaInput = document.getElementById('buscarBoleta');
            buscarBoletaInput.addEventListener('input', function () {
              const filter = buscarBoletaInput.value.toUpperCase();
              const table = document.getElementById('tablaGanadores');
              const tr = table.getElementsByTagName('tr');

              for (let i = 1; i < tr.length; i++) { 
                const td = tr[i].getElementsByTagName('td')[0]; 
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

function lanzarConfeti() {
  var end = Date.now() + (2 * 1000); 
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

  const fechaGuardada = localStorage.getItem('fecha');
  const horaGuardada = localStorage.getItem('hora');
  const tipoCursoGuardado = localStorage.getItem('tipoCurso') || 'Intensivo';
  const tipoCursoGuardadoMinusculas = tipoCursoGuardado.toLowerCase();
  console.log('Tipo de curso guardado:', tipoCursoGuardadoMinusculas);

  const seccionIntensivo = document.getElementById('intensivo');
  const seccionSabatino = document.getElementById('sabatino');
  const idiomas = ['ingles', 'frances', 'aleman', 'italiano'];

  const ocultarTodosLosIdiomas = () => {
    console.log('Ocultando todos los idiomas.');
    idiomas.forEach(idioma => {
      document.getElementById(`${idioma}-intensivo`).style.display = 'none';
      document.getElementById(`${idioma}-sabatino`).style.display = 'none';
    });
  };

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

  mostrarIdioma('ingles');

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

  console.log('Datos recibidos del servidor:', fechaHora, tipoCurso);

  if (!tipoCurso) {
    console.error('Error: tipoCurso es undefined');
    return;
  }

  localStorage.setItem('tipoCurso', tipoCurso);

  const [fecha, hora] = fechaHora.split('T');

  localStorage.setItem('fecha', fecha);
  localStorage.setItem('hora', hora);
  if (tipoCurso === 'INTENSIVO') {
    socket.emit('getAlumnos', { tipoCurso: 'I' });
  } else if (tipoCurso === 'SABATINO') {
    socket.emit('getAlumnos', { tipoCurso: 'S' });
  }
});

socket.on('alumnosData', (data) => {
  const { alumnos, tipoCurso } = data;
  console.log("Tipo de curso recibido:", tipoCurso);

  if (!tipoCurso) {
    console.error('Error: tipoCurso no definido en la respuesta del servidor');
  }

  alumnosClasificados = {};

  alumnos.forEach(alumno => {
    const { idioma, boleta, nombre, apellido_paterno, nivel, horario, promedio } = alumno;

    if (!alumnosClasificados[idioma]) {
      alumnosClasificados[idioma] = {};
    }

    if (!alumnosClasificados[idioma][nivel]) {
      alumnosClasificados[idioma][nivel] = {};
    }

    if (!alumnosClasificados[idioma][nivel][horario]) {
      alumnosClasificados[idioma][nivel][horario] = [];
    }

    alumnosClasificados[idioma][nivel][horario].push({ boleta, nombre, apellido_paterno, nivel, horario, promedio });
  });

  generarTablasYRuletas(alumnosClasificados, tipoCurso);
});

async function iniciarGirosTodos(fecha, hora) {
  const ahora = new Date();
  const fechaHoraObjetivo = new Date(`${fecha}T${hora}`);
  const tiempoRestante = fechaHoraObjetivo - ahora;

  if (tiempoRestante > 0) {
    console.log(`Iniciando giros en ${tiempoRestante / 1000} segundos...`);
    setTimeout(async () => {
      const promesasGiros = idsCanvas.map(async (canvasId, index) => {
        const tablaId = idsTablas[index];
        const numeros = obtenerNumerosDeTabla(tablaId);

        if (numeros.length <= 3) {
          console.log(`No se necesita giro para la tabla ${tablaId} con solo ${numeros.length} estudiantes.`);
          return;
        }

        const ruletaId = idsRuletas[index];
        const primerGiro = 1;

        socket.emit('solicitarValoresRuleta', { ruletaId, giro: primerGiro });

        return new Promise((resolve) => {
          socket.once(`valoresRuleta-${ruletaId}-giro${primerGiro}`, ({ angulo, tiempo }) => {
            console.log(`Iniciando ruleta con ID ${canvasId} en giro inicial con ángulo: ${angulo} y tiempo: ${tiempo}`);
            dibujarRuleta(numeros, canvasId, angulo, tiempo, true, tablaId, 3).then(resolve);
          });
        });
      });

      await Promise.all(promesasGiros);
      console.log("Todas las ruletas han terminado de girar.");
      enviarGanadoresAlServidor();

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

   for (let i = 1; i < filas.length; i++) {
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
  const filas = tabla.getElementsByTagName('tr');
  for (let i = 1; i < filas.length; i++) { 
    const celdaNumero = filas[i].getElementsByTagName('td')[0]; 
    if (celdaNumero && celdaNumero.textContent === ganador) {
      filas[i].classList.add('bg-resultados', 'text-white'); 
    }
  }
}

function generarTablasYRuletas(alumnosClasificados, tipoCurso) {
  const startVisualizationTime = performance.now(); 
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

              llenarTablaDeAlumnos(estudiantesId, alumnos);

              const numeros = alumnos.map((_, index) => (index + 1).toString());
              ajustarCanvas(canvasId);

              const giroInicial = 1;
              socket.emit('solicitarValoresRuleta', { ruletaId, giro: giroInicial });

              socket.on(`valoresRuleta-${ruletaId}-giro${giroInicial}`, ({ angulo, tiempo }) => {
                  console.log("RULETA: " + ruletaId);
                  console.log("Angulo: " + angulo);
                  console.log("Tiempo: " + tiempo);
                  dibujarRuleta(numeros, canvasId, angulo, tiempo, false);
              });

              if (numeros.length <= 3) {
                  alumnos.forEach((alumno, index) => {
                      marcarGanadorEnTabla(estudiantesId, (index + 1).toString());
                      guardarGanadorEnArreglo(estudiantesId, (index + 1).toString());
                  });
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

  // Contar e imprimir los IDs de las ruletas generadas
  console.log(`Total de ruletas generadas: ${idsRuletas.length}`);
  idsRuletas.forEach((id, index) => {
      console.log(`ID de la ruleta ${index + 1}: ${id}`);
  });

  const endVisualizationTime = performance.now(); // Marca de tiempo final
    const totalVisualizationTime = endVisualizationTime - startVisualizationTime; // Calcula el tiempo total
    console.log(`Tiempo total para visualizar todas las ruletas: ${totalVisualizationTime.toFixed(2)} ms`);

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
    <table class="table-auto w-full bg-negro-tranparencia border-separate">
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

async function dibujarRuleta(numeros, canvasId, angulo, tiempo, shouldSpin = false, tablaId, girosRestantes = 3) {
  return new Promise(async (resolve) => {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const arc = Math.PI / (numeros.length / 2);

    if (!canvas || !ctx) {
      console.error(`No se encontró el canvas con ID: ${canvasId} o no se pudo obtener su contexto`);
      return;
    }

    console.log(`Iniciando ruleta con ID ${canvasId}, shouldSpin: ${shouldSpin}, ángulo: ${angulo}, tiempo: ${tiempo}`);

    let spinAngleStart = angulo || 10;
    let spinTime = 0;
    let spinTimeTotal = (tiempo || 5) * 1000;
    let startAngle = 0;

    if (shouldSpin) {
      rotateWheel();
    } else {
      drawStaticWheel();
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
        const siguienteGiro = 4 - girosRestantes + 1;
        socket.emit('solicitarValoresRuleta', { ruletaId: canvasId, giro: siguienteGiro });
        
        socket.once(`valoresRuleta-${canvasId}-giro${siguienteGiro}`, ({ angulo, tiempo }) => {
          setTimeout(() => {
            dibujarRuleta(numeros, canvasId, angulo, tiempo, true, tablaId, girosRestantes - 1).then(resolve);
          }, 1000);
        });
      } else {
        if (girosRestantes === 1) {
          //socket.emit('limpiarValoresRuleta', { ruletaId: canvasId });
          console.log(`Solicitando al servidor que limpie los valores de la ruleta ${canvasId}.`);
        }
        resolve();
      }
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
        ctx.fillStyle = i % 2 === 0 ? "#460000" : "#62152d";

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
        ctx.fillStyle = "white";
        ctx.font = '12px Helvetica';
        const text = numeros[i];
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();
      }

      drawArrow(centerX, centerY, outsideRadius);
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
  const partes = tablaId.replace('estudiantes-', '').split('-');

  const idioma = partes[0];
  const nivel = partes[1];
  const horario = partes.slice(2).join('-').replace('-tabla', ''); 

  const tabla = document.getElementById(tablaId);
  if (tabla) {
    const filas = tabla.getElementsByTagName('tr');
    for (let i = 1; i < filas.length; i++) { 
      const celdaNumero = filas[i].getElementsByTagName('td')[0];
      if (celdaNumero && celdaNumero.textContent === ganador) {
        const boleta = filas[i].getElementsByTagName('td')[1].textContent;
        const nombre = filas[i].getElementsByTagName('td')[2].textContent;

        ganadores.push({idioma,nivel,horario,boleta,nombre});
        break;
      }
    }
  }
}

function enviarGanadoresAlServidor() {
  socket.emit('guardarGanadores', ganadores); 
}
