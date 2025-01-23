import { connection } from './config/db.mjs'; // Conexión a la base de datos
import util from 'util'; // Utilizamos util para promisificar las consultas

export function initializeWebSocket(io) {
  const query = util.promisify(connection.query).bind(connection);

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado vía WebSocket');
    
    socket.on('fileData', async (data) => {
      const startTime = performance.now(); 
      const { curso, ciclo, idioma, filas } = data;

      try {
        const idCurso = await processEntity('cursos', 'curso', curso, generateCursoID(curso));
        const idCiclo = await processEntity('ciclos', 'ciclo', ciclo, await getNewIdCiclo());
        const idIdioma = await processEntity('idiomas', 'idioma', idioma, generateIdiomaID(idioma));

        for (const fila of filas) {
          const { A: boleta, B: nombre, C: apellidop, D: apellidom, E: promedio, F: nivel, G: horario, H: procedencia } = fila;
          if (procedencia === 'INTERNO' && parseFloat(promedio) >= 8.5) {
            await processStudent(boleta, nombre, apellidop, apellidom, promedio, procedencia);
            const idNivel = await processEntity('niveles', 'nivel', nivel, generateNivelID(nivel));
            console.log(`Nivel generado: ${idNivel}`);
            const idHorario = await processEntity('horarios', 'horario', horario, await getNewIdHorario());
            console.log(`Horario: ${horario}`);
            await query(
              'INSERT INTO inscripciones (id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta) VALUES (?, ?, ?, ?, ?, ?)', 
              [idIdioma, idNivel, idHorario, idCiclo, idCurso, boleta]
            );
            console.log(`La inscripción de la boleta "${boleta}" fue insertada con éxito.`);
          } else {
            console.log(`El estudiante con boleta "${boleta}" no cumple con los criterios para ser almacenado.`);
          }
        }

        const endTime = performance.now(); 
        const totalTime = endTime - startTime; 
        console.log(`Tiempo total en el servidor: ${totalTime.toFixed(2)} ms`);

        socket.emit('dbConnection', 'Datos procesados con éxito');
      } catch (err) {
        socket.emit('dbConnection', 'Error al procesar los datos');
        console.error('Error al procesar los datos:', err);
      }
    });
    
  });

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

  async function processStudent(boleta, nombre, apellidop, apellidom, promedio, procedencia) {
    const results = await query('SELECT * FROM estudiantes WHERE boleta = ?', [boleta]);

    if (results.length > 0) {
      await query('UPDATE estudiantes SET promedio = ?, procedencia = ? WHERE boleta = ?', [promedio, procedencia, boleta]);
      console.log(`El promedio y procedencia de la boleta "${boleta}" fue actualizado.`);
    } else {
      await query('INSERT INTO estudiantes (boleta, nombre, apellido_paterno, apellido_materno, promedio, procedencia) VALUES (?, ?, ?, ?, ?, ?)', 
      [boleta, nombre, apellidop, apellidom, promedio, procedencia]);
      console.log(`El estudiante con boleta "${boleta}" fue insertado con éxito.`);
    }
  }

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
  const lastPart = words[words.length - 1]; 
  return `${firstLetter}${lastPart.toUpperCase()}`;
}
