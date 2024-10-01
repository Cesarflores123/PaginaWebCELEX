import { connection } from './config/db.mjs'; // Conexión a la base de datos
import util from 'util'; // Utilizamos util para promisificar las consultas

export function initializeWebSocketAlumnos(io) {
  const query = util.promisify(connection.query).bind(connection);

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado vía WebSocket');
    
    // Manejo del evento 'getAlumnos' para obtener los alumnos
    socket.on('getAlumnos', async (data) => {
      const { tipoCurso } = data;
      try {
        // Obtener el último ciclo
        const ultimoCiclo = await obtenerUltimoCiclo(query);

        // Obtener el curso más alto (ya sea Intensivo o Sabatino)
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCurso);

        // Obtener los alumnos con promedio >= 8.5 del último ciclo y curso
        const alumnos = await obtenerAlumnos(query, ultimoCiclo, ultimoCurso);

        // Enviar los datos de vuelta al cliente
        socket.emit('alumnosData', { alumnos });
      } catch (err) {
        console.error('Error al obtener los alumnos:', err);
        socket.emit('dbConnection', 'Error al obtener los alumnos');
      }
    });

    // Manejo del evento 'programarRuleta' para recibir la fecha y hora programada
    socket.on('programarRuleta', (data) => {
      const { fechaHora } = data;
      console.log('Fecha y hora programadas recibidas:', fechaHora);

      // Enviar la fecha y hora a todos los clientes conectados
      io.emit('mostrarFechaHora', { fechaHora });
    });
  });
}

// Función para obtener el último ciclo
async function obtenerUltimoCiclo(query) {
  const result = await query('SELECT MAX(id_ciclo) as ultimoCiclo FROM inscripciones');
  return result[0].ultimoCiclo;
}

// Función para obtener el último curso (Intensivo o Sabatino) del último ciclo
async function obtenerUltimoCurso(query, ciclo, tipoCurso) {
  const result = await query(
    'SELECT MAX(id_curso) as ultimoCurso FROM inscripciones WHERE id_ciclo = ? AND id_curso LIKE ?',
    [ciclo, `${tipoCurso}%`]
  );
  return result[0].ultimoCurso;
}

// Función para obtener los alumnos con promedio >= 8.5
async function obtenerAlumnos(query, ciclo, curso) {
  const result = await query(`
    SELECT e.boleta, e.nombre, e.apellido_paterno, e.promedio, n.nivel, h.horario, i.idioma 
    FROM inscripciones ins
    JOIN estudiantes e ON e.boleta = ins.boleta
    JOIN niveles n ON n.id_nivel = ins.id_nivel
    JOIN horarios h ON h.id_horario = ins.id_horario
    JOIN idiomas i ON i.id_idioma = ins.id_idioma
    WHERE ins.id_ciclo = ? AND ins.id_curso = ? AND e.promedio >= 8.5
  `, [ciclo, curso]);

  return result;
}
