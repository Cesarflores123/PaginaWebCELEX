import { connection } from './config/db.mjs'; // Conexión a la base de datos
import util from 'util'; // Utilizamos util para promisificar las consultas

export function initializeWebSocket(io) {
  // Promisificamos la consulta para poder utilizar async/await
  const query = util.promisify(connection.query).bind(connection);

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado vía WebSocket');
    
    socket.on('fileData', async (data) => {
      const { curso, ciclo, idioma, filas } = data;

      try {
        // Procesar el curso
        const idCurso = await processEntity('cursos', 'curso', curso, generateCursoID(curso));
        // Procesar el ciclo
        const idCiclo = await processEntity('ciclos', 'ciclo', ciclo, await getNewIdCiclo());
        // Procesar el idioma
        const idIdioma = await processEntity('idiomas', 'idioma', idioma, generateIdiomaID(idioma));

        // Procesar cada fila
        for (const fila of filas) {
          const { A: boleta, B: nombre, C: apellidop, D: apellidom, E: promedio, F: nivel, G: horario } = fila;

          // Procesar estudiante
          await processStudent(boleta, nombre, apellidop, apellidom, promedio);

          // Procesar nivel
          const idNivel = await processEntity('niveles', 'nivel', nivel, generateNivelID(nivel));
          console.log(`Nivel generado: ${idNivel}`);
          // Procesar horario
          const idHorario = await processEntity('horarios', 'horario', horario, await getNewIdHorario());
          console.log(`Horario: ${horario}`);

          // Insertar inscripción
          await query(
            'INSERT INTO inscripciones (id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta) VALUES (?, ?, ?, ?, ?, ?)', 
            [idIdioma, idNivel, idHorario, idCiclo, idCurso, boleta]
          );
          console.log(`La inscripción de la boleta "${boleta}" fue insertada con éxito.`);
        }

        socket.emit('dbConnection', 'Datos procesados con éxito');
      } catch (err) {
        socket.emit('dbConnection', 'Error al procesar los datos');
        console.error('Error al procesar los datos:', err);
      }
    });
    
  });

  // Función para procesar una entidad (curso, ciclo, idioma, etc.)
  async function processEntity(table, column, value, idGenerator) {
    const results = await query(`SELECT * FROM ${table} WHERE ${column} = ?`, [value]);

    if (results.length > 0) {
      console.log(`El ${column} "${value}" ya existe en la base de datos.`);
      return results[0][`id_${column}`];
    } else {
      const id = idGenerator;
      await query(`INSERT INTO ${table} (id_${column}, ${column}) VALUES (?, ?)`, [id, value]);
      console.log(`El ${column} "${value}" fue insertado con éxito con ID "${id}".`);
      return id;
    }
  }

  // Función para procesar estudiantes
  async function processStudent(boleta, nombre, apellidop, apellidom, promedio) {
    const results = await query('SELECT * FROM estudiantes WHERE boleta = ?', [boleta]);

    if (results.length > 0) {
      await query('UPDATE estudiantes SET promedio = ? WHERE boleta = ?', [promedio, boleta]);
      console.log(`El promedio de la boleta "${boleta}" fue actualizado.`);
    } else {
      await query('INSERT INTO estudiantes (boleta, nombre, apellido_paterno, apellido_materno, promedio) VALUES (?, ?, ?, ?, ?)', 
      [boleta, nombre, apellidop, apellidom, promedio]);
      console.log(`El estudiante con boleta "${boleta}" fue insertado con éxito.`);
    }
  }

  // Obtener el nuevo ID de ciclo
  async function getNewIdCiclo() {
    const results = await query('SELECT id_ciclo FROM ciclos ORDER BY id_ciclo DESC LIMIT 1');
    return results.length > 0 ? results[0].id_ciclo + 1 : 1;
  }

  // Obtener el nuevo ID de horario
  async function getNewIdHorario() {
    const results = await query('SELECT id_horario FROM horarios ORDER BY id_horario DESC LIMIT 1');
    return results.length > 0 ? results[0].id_horario + 1 : 1;
  }
}

// Funciones para generar IDs
function generateCursoID(curso) {
  const words = curso.split(' ');
  const prefix = words[0].substring(0, 1).toUpperCase(); 
  const number = words[words.length - 1]; 
  return `${prefix}${number}`;
}

function generateIdiomaID(idioma) {
  switch (idioma.toUpperCase()) {
    case 'INGLES': return 'ENG';
    case 'FRANCES': return 'FRN';
    case 'ALEMAN': return 'GER';
    case 'ITALIANO': return 'ITL';
    default: return idioma.substring(0, 3).toUpperCase();
  }
}

function generateNivelID(nivel) {
  const words = nivel.split(' ');
  const firstLetter = words[0].substring(0, 1).toUpperCase();
  const lastPart = words[words.length - 1]; // El último valor debe ser el número o la letra adicional (ej. "1", "1A")
  return `${firstLetter}${lastPart.toUpperCase()}`;
}
