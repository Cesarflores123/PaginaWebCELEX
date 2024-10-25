import { connection } from './config/db.mjs'; // Conexión a la base de datos
import util from 'util'; // Utilizamos util para promisificar las consultas

export function initializeWebSocketAlumnos(io) {
  const query = util.promisify(connection.query).bind(connection);
  // Variable para almacenar el tipo de curso
  let tipoCursoGlobal = null;
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

      tipoCursoGlobal = tipoCurso;

      try {
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCurso);

        const alumnos = await obtenerAlumnos(query, ultimoCiclo, ultimoCurso);

        // Verificamos que tenemos los alumnos y el tipo de curso antes de enviarlo al cliente
        console.log("Enviando los datos al cliente con ultimo id_ciclo:", ultimoCiclo);
        console.log("Enviando los datos al cliente con ultimo curso:", ultimoCurso);
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

    // Capturar el evento 'guardarGanadores' para almacenar los ganadores en la base de datos
    socket.on('guardarGanadores', async (ganadores) => {
      console.log('Ganadores recibidos:', ganadores);
    
      try {
        // Comprobar si tipoCursoGlobal tiene un valor antes de continuar
        if (!tipoCursoGlobal) {
          console.error("Error: tipoCurso no definido en el contexto de 'guardarGanadores'.");
          return;
        }
    
        // Obtener el último ciclo y curso
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCursoGlobal);
    
        for (const ganador of ganadores) {
          const { boleta, idioma, nivel, horario } = ganador;
    
          // Convertir el idioma a mayúsculas
          const idiomaMayusculas = idioma.toUpperCase();
    
          // Obtener el id_idioma usando el valor del idioma en mayúsculas
          const idiomaResult = await query(`
            SELECT id_idioma 
            FROM Idiomas 
            WHERE UPPER(idioma) = ?
          `, [idiomaMayusculas]);
    
          if (idiomaResult.length === 0) {
            console.error(`Error: Idioma ${idioma} no encontrado.`);
            continue; // Saltar al siguiente ganador si el idioma no existe
          }
    
          const id_idioma = idiomaResult[0].id_idioma;
    
          // Buscar la inscripción correspondiente a este ganador con la boleta, id_idioma, ciclo y curso
          const inscripcion = await query(`
            SELECT id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta 
            FROM Inscripciones 
            WHERE boleta = ? AND id_idioma = ? AND id_ciclo = ? AND id_curso = ?
          `, [boleta, id_idioma, ultimoCiclo, ultimoCurso]);
    
          if (inscripcion.length > 0) {
            // Obtener el último id_ganador
            const result = await query(`SELECT MAX(id_ganador) as ultimoGanador FROM Ganadores`);
            const nuevoIdGanador = (result[0].ultimoGanador || 0) + 1;
    
            // Insertar en la tabla Ganadores
            await query(`
              INSERT INTO Ganadores (id_ganador, id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [nuevoIdGanador, inscripcion[0].id_idioma, inscripcion[0].id_nivel, inscripcion[0].id_horario, inscripcion[0].id_ciclo, inscripcion[0].id_curso, boleta]);
    
            console.log(`Ganador guardado: ${boleta}, Idioma: ${idioma}, Nivel: ${inscripcion[0].id_nivel}`);
          } else {
            console.log(`La boleta ${boleta} no está inscrita en el idioma, ciclo o curso actual.`);
          }
        }
    
        console.log('Todos los ganadores han sido procesados.');
      } catch (err) {
        console.error('Error al guardar los ganadores:', err);
      }
    });    

    // Evento para obtener los últimos ganadores
    socket.on('obtenerUltimosGanadores', async () => {
      try {
        // Obtener el último ciclo y curso para el tipo de curso global
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCursoGlobal);

        // Consulta para obtener los últimos ganadores
        const ganadores = await query(`
          SELECT g.boleta, e.nombre, e.apellido_paterno, i.idioma, n.nivel, h.horario 
          FROM Ganadores g
          JOIN Estudiantes e ON e.boleta = g.boleta
          JOIN Idiomas i ON i.id_idioma = g.id_idioma
          JOIN Niveles n ON n.id_nivel = g.id_nivel
          JOIN Horarios h ON h.id_horario = g.id_horario
          WHERE g.id_ciclo = ? AND g.id_curso = ?
        `, [ultimoCiclo, ultimoCurso]);

        // Emitir los datos de los ganadores al cliente
        socket.emit('ultimosGanadores', ganadores);
      } catch (err) {
        console.error('Error al obtener los últimos ganadores:', err);
        socket.emit('dbConnection', 'Error al obtener los ganadores');
      }
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
