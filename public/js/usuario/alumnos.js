// Conectamos con el servidor WebSocket
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

    // Creamos un objeto para almacenar los niveles por idioma
    if (!nivelesPorIdioma[idioma]) {
      nivelesPorIdioma[idioma] = {};
    }

    // Si el nivel no existe en el idioma, lo agregamos
    if (!nivelesPorIdioma[idioma][nivel]) {
      nivelesPorIdioma[idioma][nivel] = [];
    }

    // Agregamos al alumno en su nivel correspondiente
    nivelesPorIdioma[idioma][nivel].push({ boleta, nombre, apellido_paterno, nivel, horario, promedio });
  });

  // Generamos los botones de nivel para cada idioma
  Object.keys(nivelesPorIdioma).forEach(idioma => {
    generarBotonesDeNiveles(idioma, nivelesPorIdioma[idioma]);
  });
});

// ** Nuevo evento para recibir la fecha y hora de la ruleta desde el servidor **
socket.on('mostrarFechaHora', (data) => {
  const fechaCompleta = data.fechaHora; // Supongamos que el formato es "YYYY-MM-DD HH:MM:SS"
  const [fecha, hora] = fechaCompleta.split(' '); // Divide la cadena por el espacio en blanco
  console.log('Fecha:', fecha); // Mostrará solo la fecha
  console.log('Hora:', hora); // Mostrará solo la hora
});

// Función para limpiar y restablecer las secciones antes de mostrar nuevos datos
function limpiarSecciones() {
  // Array de idiomas disponibles
  const idiomas = ['ingles', 'frances', 'aleman', 'italiano'];

  // Plantilla HTML básica, con espacios para las secciones dinámicas
  const plantillaHTML = (idioma) => `
    <h1 class="text-2xl mb-4 bg-letra">${idioma.charAt(0).toUpperCase() + idioma.slice(1)}</h1>
    <div id="niveles-${idioma}" class="w-full px-4 py-4 text-center mb-4"></div>
    <div id="horario-${idioma}" class="w-full px-4 py-4 text-center mb-4"></div>
    <div id="estudiantes-ruleta" class="flex w-full py-4 gap-4">
      <div id="estudiantes-${idioma}" class="w-1/2 py-4 text-center"></div>
      <div id="ruleta-${idioma}" class="w-1/2 p-4 flex flex-col items-center text-center">
        <div id="spin-container" class="w-full bg-white bg-opacity-50 rounded-lg flex flex-col items-center justify-start p-5">
          <canvas id="canvas-${idioma}" class="w-1/2 h-auto max-w-[400px] bg-slate-600"></canvas>
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

  // Reemplaza el contenido de cada sección con la plantilla dinámica
  idiomas.forEach(idioma => {
    document.getElementById(idioma).innerHTML = plantillaHTML(idioma);
  });
}

// Función para generar botones de nivel para cada idioma
function generarBotonesDeNiveles(idioma, niveles) {
  const sectionId = `niveles-${idioma.toLowerCase()}`;
  const section = document.getElementById(sectionId);

  // Ordenar niveles: Básico 1-5, Intermedio 1-5, Avanzado 1-5
  const nivelesOrdenados = Object.keys(niveles).sort((a, b) => {
    const nivelA = obtenerNivel(a);
    const nivelB = obtenerNivel(b);
    return nivelA - nivelB;
  });

  // Generar botones en orden
  nivelesOrdenados.forEach(nivel => {
    const boton = document.createElement('button');
    boton.textContent = nivel;
    boton.className = 'bg-niveles text-white px-4 py-2 m-2 rounded';

    // Evento de clic para mostrar los horarios de este nivel
    boton.addEventListener('click', () => {
      mostrarHorariosPorNivel(idioma, niveles[nivel], section);  // Paso la sección para agregar los horarios debajo
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

  // Limpiar las secciones de horarios antes de agregar nuevos datos
  const prevHorarios = document.getElementById(horariosSectionId);
  if (prevHorarios) {
    prevHorarios.remove();
  }

  // Agrupar alumnos por horario
  const horarios = {};
  alumnos.forEach(alumno => {
    if (!horarios[alumno.horario]) {
      horarios[alumno.horario] = [];
    }
    horarios[alumno.horario].push(alumno);
  });

  // Crear botones de horarios debajo de los botones de nivel
  Object.keys(horarios).forEach(horario => {
    const botonHorario = document.createElement('button');
    botonHorario.textContent = horario;
    botonHorario.className = 'bg-horarios text-white px-4 py-2 m-2 rounded';

    // Evento de clic para mostrar los alumnos de ese horario
    botonHorario.addEventListener('click', () => {
      mostrarAlumnosPorHorario(`estudiantes-${idioma.toLowerCase()}`, horarios[horario]);
    });

    horariosSection.appendChild(botonHorario);
  });

  // Insertamos los botones de horarios debajo de los botones de nivel
  section.appendChild(horariosSection);
}
// Función para mostrar los alumnos por horario en el div correspondiente
function mostrarAlumnosPorHorario(sectionId, alumnos) {
  const section = document.getElementById(sectionId);

  // Limpiar la sección antes de mostrar nuevos alumnos
  section.innerHTML = '';

  // Crear una tabla para mostrar a los alumnos
  const tablaHtml = `
    <table class="table-auto w-full bg-negro-tranparencia">
      <thead>
        <tr>
          <th class="px-4 py-2 text-white">#</th> <!-- Columna de enumeración -->
          <th class="px-4 py-2 text-white">Boleta</th>
          <th class="px-4 py-2 text-white">Nombre</th>
          <th class="px-4 py-2 text-white">Nivel</th>
          <th class="px-4 py-2 text-white">Horario</th>
          <th class="px-4 py-2 text-white">Promedio</th>
        </tr>
      </thead>
      <tbody>
        ${alumnos.map((alumno, index) => ` <!-- Enumeramos con el 'index' -->
          <tr>
            <td class="border px-4 py-2 text-white">${index + 1}</td> <!-- Número del alumno -->
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

  // Dibujar la ruleta con los números de los alumnos en lugar de las boletas
  const numeros = alumnos.map((_, index) => (index + 1).toString()); // Generar números como opciones
  const idioma = sectionId.split('-')[1]; // Obtener el idioma del sectionId
  mostrarRuleta(numeros, idioma); // Llamar a la función para mostrar la ruleta con los números
}

// Función para mostrar la ruleta con números
function mostrarRuleta(numeros, idioma) {
  var options = numeros; // Usamos los números de los alumnos como opciones
  var startAngle = 0;
  var arc = Math.PI / (options.length / 2);
  var canvas = document.getElementById(`canvas-${idioma}`);
  var ctx = canvas.getContext("2d");

  // Asegurar que el canvas sea cuadrado
  canvas.width = Math.min(canvas.parentElement.clientWidth, 300);
  canvas.height = canvas.width;

  var outsideRadius = (canvas.width / 2 - 20) * 0.8; // Reducido para dar margen
  var insideRadius = outsideRadius * 0.6;
  var textRadius = outsideRadius * 0.85;
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas antes de redibujar

  // Dibujar la ruleta
  for (var i = 0; i < options.length; i++) {
    var angle = startAngle + i * arc;
    ctx.fillStyle = i % 2 === 0 ? "#d3d3d3" : "#808080"; // Alternar colores grises

    ctx.beginPath();
    ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
    ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);
    ctx.fill();
    ctx.stroke();
    ctx.save();

    ctx.fillStyle = "black"; // Color del texto
    ctx.translate(
      centerX + Math.cos(angle + arc / 2) * textRadius,
      centerY + Math.sin(angle + arc / 2) * textRadius
    );
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    var text = options[i]; // Mostrar el número del alumno
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


