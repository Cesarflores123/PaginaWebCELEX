const socket = io();

let spinsLeft = 3; // Queremos que gire tres veces
let options = []; // Aquí almacenaremos los números de los alumnos
let apiKey = "6794028e-6203-4449-a850-567dd9d9ee07"; // API Key de Random.org

// Al cargar la página, obtenemos los alumnos del Intensivo
document.addEventListener('DOMContentLoaded', () => {
  socket.emit('getAlumnos', { tipoCurso: 'I' });
});

// Capturamos los eventos de clic en los botones "Intensivo" y "Sabatino"
document.getElementById('intensivo-button').addEventListener('click', () => {
  socket.emit('getAlumnos', { tipoCurso: 'I' });
});

document.getElementById('sabatino-button').addEventListener('click', () => {
  socket.emit('getAlumnos', { tipoCurso: 'S' });
});

// Cuando recibimos los datos de los alumnos
socket.on('alumnosData', (data) => {
  const { alumnos } = data;

  // Limpiamos las secciones antes de agregar nuevos datos
  limpiarSecciones();

  // Creamos un mapa para almacenar los niveles por idioma
  const nivelesPorIdioma = {};

  // Procesamos los alumnos y agrupamos por nivel y idioma
  alumnos.forEach(alumno => {
    const { idioma, boleta, nombre, apellido_paterno, nivel, horario, promedio } = alumno;

    if (!nivelesPorIdioma[idioma]) {
      nivelesPorIdioma[idioma] = {};
    }

    if (!nivelesPorIdioma[idioma][nivel]) {
      nivelesPorIdioma[idioma][nivel] = [];
    }

    nivelesPorIdioma[idioma][nivel].push({ boleta, nombre, apellido_paterno, nivel, horario, promedio });
  });

  // Generamos los botones de nivel para cada idioma
  Object.keys(nivelesPorIdioma).forEach(idioma => {
    generarBotonesDeNiveles(idioma, nivelesPorIdioma[idioma]);
  });
});

// Mostrar fecha y hora desde el servidor
socket.on('mostrarFechaHora', (data) => {
  const fechaCompleta = data.fechaHora; // Formato "YYYY-MM-DDTHH:MM"
  const [fecha, hora] = fechaCompleta.split('T'); 
  localStorage.setItem('fecha', fecha);
  localStorage.setItem('hora', hora);
  console.log('Fecha:', fecha);
  console.log('Hora:', hora);
});

// Verificar si ya hay una fecha y hora almacenada al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const fechaGuardada = localStorage.getItem('fecha');
  const horaGuardada = localStorage.getItem('hora');

  if (fechaGuardada && horaGuardada) {
    console.log('Fecha guardada:', fechaGuardada);
    console.log('Hora guardada:', horaGuardada);
  } else {
    console.log('No se ha recibido ninguna fecha y hora del servidor aún.');
  }
});

// Función para limpiar y restablecer las secciones antes de mostrar nuevos datos
function limpiarSecciones() {
  const idiomas = ['ingles', 'frances', 'aleman', 'italiano'];

  const plantillaHTML = (idioma) => `
    <h1 class="text-2xl mb-4 bg-letra">${idioma.charAt(0).toUpperCase() + idioma.slice(1)}</h1>
    <div id="niveles-${idioma}" class="w-full px-4 py-4 text-center mb-4"></div>
    <div id="horario-${idioma}" class="w-full px-4 py-4 text-center mb-4"></div>
    <div id="estudiantes-ruleta" class="flex w-full py-4 gap-4">
      <div id="estudiantes-${idioma}" class="w-1/2 py-4 text-center"></div>
      <div id="ruleta-${idioma}" class="w-1/2 p-4 flex flex-col items-center text-center">
        <div id="spin-container" class="w-full bg-white bg-opacity-50 rounded-lg flex flex-col items-center justify-start p-5">
          <canvas id="canvas-${idioma}" class="w-1/2 h-auto  bg-slate-600"></canvas>
          <button id="spin-${idioma}" class="mt-1 bg-blue-300 text-white px-2 py-1 rounded-full">Girar</button>
        </div>
        <div id="ganadores" class="w-11/12 h-[150px] mt-4 bg-white bg-opacity-50 rounded-lg">
          <h2 class="text-center font-semibold">GANADORES DE BECAS</h2>
          <div id="winning-values-${idioma}" class="flex justify-between px-4 mt-2">
            <div id="winning-value-0-${idioma}" class="winning-value w-1/3 h-[80px] bg-ganadores rounded-lg flex items-center justify-center">Valor 1</div>
            <div id="winning-value-1-${idioma}" class="winning-value w-1/3 h-[80px] bg-ganadores rounded-lg mx-1 flex items-center justify-center">Valor 2</div>
            <div id="winning-value-2-${idioma}" class="winning-value w-1/3 h-[80px] bg-ganadores rounded-lg flex items-center justify-center">Valor 3</div>
          </div>
        </div>
      </div>
    </div>`;

  idiomas.forEach(idioma => {
    document.getElementById(idioma).innerHTML = plantillaHTML(idioma);
  });
}

// Función para generar botones de nivel para cada idioma
function generarBotonesDeNiveles(idioma, niveles) {
  const sectionId = `niveles-${idioma.toLowerCase()}`;
  const section = document.getElementById(sectionId);

  const nivelesOrdenados = Object.keys(niveles).sort((a, b) => obtenerNivel(a) - obtenerNivel(b));

  nivelesOrdenados.forEach(nivel => {
    const boton = document.createElement('button');
    boton.textContent = nivel;
    boton.className = 'bg-niveles text-white px-4 py-2 m-2 rounded';

    boton.addEventListener('click', () => {
      mostrarHorariosPorNivel(idioma, niveles[nivel], section);
    });

    section.appendChild(boton);
  });
}

// Función para obtener un número de nivel según el tipo y número
function obtenerNivel(nivel) {
  const partes = nivel.split(' ');
  const tipo = partes[0];
  const numero = parseInt(partes[1]);

  const orden = {
    'Básico': 1,
    'Intermedio': 2,
    'Avanzado': 3
  };

  return orden[tipo] * 10 + numero;
}

// Función para mostrar los horarios de un nivel debajo de los botones de nivel
function mostrarHorariosPorNivel(idioma, alumnos, section) {
  const horariosSectionId = `horario-${idioma.toLowerCase()}`;
  const horariosSection = document.createElement('div');
  horariosSection.id = horariosSectionId;

  const prevHorarios = document.getElementById(horariosSectionId);
  if (prevHorarios) {
    prevHorarios.remove();
  }

  const horarios = {};
  alumnos.forEach(alumno => {
    if (!horarios[alumno.horario]) {
      horarios[alumno.horario] = [];
    }
    horarios[alumno.horario].push(alumno);
  });

  Object.keys(horarios).forEach(horario => {
    const botonHorario = document.createElement('button');
    botonHorario.textContent = horario;
    botonHorario.className = 'bg-horarios text-white px-4 py-2 m-2 rounded';

    botonHorario.addEventListener('click', () => {
      mostrarAlumnosPorHorario(`estudiantes-${idioma.toLowerCase()}`, horarios[horario]);
    });

    horariosSection.appendChild(botonHorario);
  });

  section.appendChild(horariosSection);
}

// Función para mostrar los alumnos por horario en el div correspondiente
function mostrarAlumnosPorHorario(sectionId, alumnos) {
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

  const numeros = alumnos.map((_, index) => (index + 1).toString());
  const idioma = sectionId.split('-')[1];
  dibujarRuleta(numeros, idioma);
}

  // Función para mostrar la ruleta con números
  function dibujarRuleta(numeros, idioma) {
    ajustarCanvas(idioma); // Ajusta el tamaño del canvas dinámicamente
    
    let startAngle = 0;
    let arc = Math.PI / (numeros.length / 2);
    let spinTimeout = null;
    let spinAngleStart = Math.random() * 10 + 10; 
    let spinTime = 0;
    let spinTimeTotal = Math.random() * 3 + 4 * 1000;

    const canvas = document.getElementById(`canvas-${idioma}`);
    const ctx = canvas.getContext("2d");

    function rotateWheel() {
      spinTime += 30;
      if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
      }
      const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
      startAngle += (spinAngle * Math.PI / 180);
      dibujar(startAngle, arc, numeros, canvas, ctx);
      spinTimeout = setTimeout(rotateWheel, 30);
    }

    function stopRotateWheel() {
      clearTimeout(spinTimeout);
      const degrees = startAngle * 180 / Math.PI + 90;
      const arcd = arc * 180 / Math.PI;
      const index = Math.floor((360 - degrees % 360) / arcd);
      ctx.save();
      ctx.font = 'bold 30px Helvetica, Arial';
      const text = numeros[index];
      ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 10);
      ctx.restore();
    }

    rotateWheel();
  }

// Función de desaceleración
function easeOut(t, b, c, d) {
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

// Función para dibujar la ruleta (similar a la implementación original)
function dibujar(startAngle, arc, options, canvas, ctx) {
  const outsideRadius = (canvas.width / 2) * 0.9; // Radio externo al 90% del ancho del canvas
  const insideRadius = outsideRadius * 0.6;
  const textRadius = outsideRadius * 0.85;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar todo el canvas antes de redibujar

  for (let i = 0; i < options.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = i % 2 === 0 ? "#d3d3d3" : "#808080"; // Alternar colores grises

    ctx.beginPath();
    ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false); // Arco exterior
    ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);  // Arco interior
    ctx.fill();
    ctx.stroke();
    ctx.save();

    ctx.fillStyle = "black"; // Color del texto
    ctx.translate(
      centerX + Math.cos(angle + arc / 2) * textRadius,
      centerY + Math.sin(angle + arc / 2) * textRadius
    );
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    const text = options[i];
    ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    ctx.restore();
  }

  // Dibujar la flecha
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(centerX - 4, centerY - (outsideRadius + 5));
  ctx.lineTo(centerX + 4, centerY - (outsideRadius + 5));
  ctx.lineTo(centerX + 4, centerY - (outsideRadius - 5));
  ctx.lineTo(centerX + 0, centerY - (outsideRadius - 13));
  ctx.lineTo(centerX - 4, centerY - (outsideRadius - 5));
  ctx.closePath();
  ctx.fill();
}

function agregarEventoDeGiro(idioma) {
  const spinButton = document.getElementById(`spin-${idioma}`);
  
  spinButton.addEventListener('click', () => {
    // Recogemos los números de los alumnos del idioma seleccionado
    const numeros = options.map((_, index) => (index + 1).toString()); // Usamos los números de los alumnos como opciones
    iniciarGiroRuleta(numeros, idioma); // Iniciar el giro de la ruleta
  });
}

// Agregar el evento de giro a cada idioma (Ejemplo para inglés)
agregarEventoDeGiro('ingles');
agregarEventoDeGiro('frances');
agregarEventoDeGiro('aleman');
agregarEventoDeGiro('italiano');


function ajustarCanvas(idioma) {
  const canvas = document.getElementById(`canvas-${idioma}`);
  const container = canvas.parentElement;

  // Asegurar que el canvas tenga el mismo ancho y alto
  const canvasSize = Math.min(container.clientWidth, container.clientHeight);
  canvas.width = canvasSize;
  canvas.height = canvasSize;
}