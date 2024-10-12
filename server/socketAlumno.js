import { connection } from './config/db.mjs'; // Conexión a la base de datos
import util from 'util'; // Utilizamos util para promisificar las consultas

export function initializeWebSocketAlumnos(io) {
  const query = util.promisify(connection.query).bind(connection);

  // Manejar las conexiones con los clientes
  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado vía WebSocket');
    
    // Manejo del evento 'getAlumnos' para obtener los alumnos
    socket.on('getAlumnos', async (data) => {
      const { tipoCurso } = data;
      console.log("Tipo de curso recibido del cliente en el servidor:", tipoCurso); // Aquí debería imprimirse 'I' o 'S'
    
      if (!tipoCurso) {
        console.error("Error: tipoCurso no recibido del cliente.");
        return;
      }

      try {
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCurso);

        const alumnos = await obtenerAlumnos(query, ultimoCiclo, ultimoCurso);

        // Verificamos que tenemos los alumnos y el tipo de curso antes de enviarlo al cliente
        console.log("Enviando los datos al cliente con tipoCurso:", tipoCurso);
        socket.emit('alumnosData', { alumnos, tipoCurso });
      } catch (err) {
        console.error('Error al obtener los alumnos:', err);
        socket.emit('dbConnection', 'Error al obtener los alumnos');
      }
    });

    socket.on('programarRuleta', (data) => {
      const { fechaHora, tipoCurso } = data;
    
      // Aseguramos que se reciban correctamente los valores
      console.log('Fecha recibida:', fechaHora); 
      console.log('Tipo de curso recibido en programarRuleta:', tipoCurso); // Agrega este para verificar si llega bien desde el cliente
    
      if (!tipoCurso) {
        console.error('Error: tipoCurso no recibido en el servidor.');
        return;
      }
    
      // Emitir la fecha, hora y tipo de curso a todos los clientes conectados
      io.emit('mostrarFechaHora', { fechaHora, tipoCurso });
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
