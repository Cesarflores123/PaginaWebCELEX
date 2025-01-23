import { connection } from './config/db.mjs';
import { disconnect } from './config/db.mjs'; 
import util from 'util'; 
import fetch from 'node-fetch'; 

const apiKey = "dda60f9d-20d0-4876-9631-7a78c9876b5f";
const urlRandomOrg = "https://api.random.org/json-rpc/4/invoke";

let totalConexiones = 0; 
let solicitud = 0;
const resultadosRuletas = {}; 

export function initializeWebSocketAlumnos(io) {
  const query = util.promisify(connection.query).bind(connection);

  let tipoCursoGlobal = null;
  io.on('connection', (socket) => {
    totalConexiones++;
    console.log('Nuevo cliente conectado vía WebSocket');
    
     // Evento de desconexión
    socket.on('disconnect', () => {
      totalConexiones--;
      console.log(`Un usuario se ha desconectado. Total de conexiones: ${totalConexiones}`);

      // Si no hay usuarios conectados, liberar los valores de las ruletas
      if (totalConexiones === 0) {
        console.log('No hay usuarios conectados. Liberando los valores de las ruletas.');
        for (const ruletaId in resultadosRuletas) {
          delete resultadosRuletas[ruletaId];
          solicitud = 0;
        }
      }
    });

    socket.on('getAlumnos', async (data) => {
      const { tipoCurso } = data;
      console.log("Tipo de curso recibido del cliente en el servidor:", tipoCurso);
    
      if (!tipoCurso) {
        console.error("Error: tipoCurso no recibido del cliente.");
        return;
      }

      tipoCursoGlobal = tipoCurso;

      try {
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCurso);

        const alumnos = await obtenerAlumnos(query, ultimoCiclo, ultimoCurso);
        socket.emit('alumnosData', { alumnos, tipoCurso });
      } catch (err) {
        console.error('Error al obtener los alumnos:', err);
        socket.emit('dbConnection', 'Error al obtener los alumnos');
      }
    });

    socket.on('programarRuleta', (data) => {
      const { fechaHora, tipoCurso } = data;
    
      if (!tipoCurso) {
        console.error('Error: tipoCurso no recibido en el servidor.');
        return;
      }
 
      io.emit('mostrarFechaHora', { fechaHora, tipoCurso });
    });

    socket.on('solicitarValoresRuleta', async ({ ruletaId, giro }) => {
      solicitud++;
      if (solicitud == 1){
        if (!resultadosRuletas[ruletaId]) {
          const angulos = await obtenerNumerosAleatorios(3, 20, 360); 
          const tiempos = await obtenerNumerosAleatorios(3, 5, 10);   
          resultadosRuletas[ruletaId] = { angulos, tiempos };
          console.log(`Ruleta ID: ${ruletaId}`);
          for (let i = 0; i < angulos.length; i++) {
            console.log(`Ángulo ${i + 1}: ${angulos[i]}, Tiempo ${i + 1}: ${tiempos[i]}`);
          }
        }
      }

      const angulo = resultadosRuletas[ruletaId].angulos[giro - 1];
      const tiempo = resultadosRuletas[ruletaId].tiempos[giro - 1];
    
      if (angulo !== undefined && tiempo !== undefined) {
        io.emit(`valoresRuleta-${ruletaId}-giro${giro}`, { angulo, tiempo });
      } else {
        console.error("No se recibieron valores válidos para el ángulo o el tiempo.");
      }
    });
    
    socket.on('limpiarValoresRuleta', ({ ruletaId }) => {
      if (resultadosRuletas[ruletaId]) {
        delete resultadosRuletas[ruletaId];
      } else {
        console.error(`No se encontraron valores para la ruleta ${ruletaId} al intentar limpiar.`);
      }
    });

    socket.on('guardarGanadores', async (ganadores) => {
      try {
        if (!tipoCursoGlobal) {
          console.error("Error: tipoCurso no definido en el contexto de 'guardarGanadores'.");
          return;
        }

        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCursoGlobal);

        for (const ganador of ganadores) {
          const { boleta, idioma, nivel, horario } = ganador;

          const idiomaMayusculas = idioma.toUpperCase();
          const idiomaResult = await query(`SELECT id_idioma FROM Idiomas WHERE UPPER(idioma) = ?`, [idiomaMayusculas]);

          if (idiomaResult.length === 0) {
            console.error(`Error: Idioma ${idioma} no encontrado.`);
            continue;
          }

          const id_idioma = idiomaResult[0].id_idioma;
          const inscripcion = await query(`SELECT id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta 
                                          FROM Inscripciones 
                                          WHERE boleta = ? AND id_idioma = ? AND id_ciclo = ? AND id_curso = ?`, 
                                          [boleta, id_idioma, ultimoCiclo, ultimoCurso]);

          if (inscripcion.length > 0) {
            const existeGanador = await query(`
              SELECT 1 FROM Ganadores 
              WHERE boleta = ? AND id_idioma = ? AND id_nivel = ? AND id_horario = ? AND id_ciclo = ? AND id_curso = ?
            `, [boleta, id_idioma, inscripcion[0].id_nivel, inscripcion[0].id_horario, inscripcion[0].id_ciclo, inscripcion[0].id_curso]);

            if (existeGanador.length === 0) {
              const result = await query(`SELECT MAX(id_ganador) as ultimoGanador FROM Ganadores`);
              const nuevoIdGanador = (result[0].ultimoGanador || 0) + 1;

              await query(`INSERT INTO Ganadores (id_ganador, id_idioma, id_nivel, id_horario, id_ciclo, id_curso, boleta)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                          [nuevoIdGanador, inscripcion[0].id_idioma, inscripcion[0].id_nivel, inscripcion[0].id_horario, inscripcion[0].id_ciclo, inscripcion[0].id_curso, boleta]);
            } else {
              console.log(`El ganador con boleta ${boleta} ya está registrado en el ciclo y curso actual.`);
            }
          } else {
            console.log(`La boleta ${boleta} no está inscrita en el idioma, ciclo o curso actual.`);
          }
        }

        console.log('Todos los ganadores han sido procesados.');
      } catch (err) {
        console.error('Error al guardar los ganadores:', err);
      }
    });

    socket.on('obtenerUltimosGanadores', async () => {
      try {
        const ultimoCiclo = await obtenerUltimoCiclo(query);
        const ultimoCurso = await obtenerUltimoCurso(query, ultimoCiclo, tipoCursoGlobal);
        const ganadores = await query(`
          SELECT g.boleta, e.nombre, e.apellido_paterno, i.idioma, n.nivel, h.horario 
          FROM Ganadores g
          JOIN Estudiantes e ON e.boleta = g.boleta
          JOIN Idiomas i ON i.id_idioma = g.id_idioma
          JOIN Niveles n ON n.id_nivel = g.id_nivel
          JOIN Horarios h ON h.id_horario = g.id_horario
          WHERE g.id_ciclo = ? AND g.id_curso = ?
        `, [ultimoCiclo, ultimoCurso]);
        
        socket.emit('ultimosGanadores', ganadores);
      } catch (err) {
        console.error('Error al obtener los últimos ganadores:', err);
        socket.emit('dbConnection', 'Error al obtener los ganadores');
      }
    });

    
  });
}

async function obtenerUltimoCiclo(query) {
  const result = await query('SELECT MAX(id_ciclo) as ultimoCiclo FROM inscripciones');
  return result[0].ultimoCiclo;
}

async function obtenerUltimoCurso(query, ciclo, tipoCurso) {
  const result = await query(
    'SELECT MAX(id_curso) as ultimoCurso FROM inscripciones WHERE id_ciclo = ? AND id_curso LIKE ?',
    [ciclo, `${tipoCurso}%`]
  );
  return result[0].ultimoCurso;
}

async function obtenerAlumnos(query, ciclo, curso) {
  const result = await query(`
    SELECT e.boleta, e.nombre, e.apellido_paterno, e.promedio, n.nivel, h.horario, i.idioma 
    FROM inscripciones ins
    JOIN estudiantes e ON e.boleta = ins.boleta
    JOIN niveles n ON n.id_nivel = ins.id_nivel
    JOIN horarios h ON h.id_horario = ins.id_horario
    JOIN idiomas i ON i.id_idioma = ins.id_idioma
    WHERE ins.id_ciclo = ? AND ins.id_curso = ? 
  `, [ciclo, curso]);

  return result;
}

async function obtenerNumerosAleatorios(cantidad, min = 1, max = 360) {
  const requestData = {
    jsonrpc: "2.0",
    method: "generateIntegers",
    params: {
      apiKey: apiKey,
      n: cantidad,
      min: min,
      max: max,
      replacement: false
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

    // Verificar si la respuesta tiene el encabezado correcto de JSON antes de parsear
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      // Validar que el JSON contenga los datos esperados
      if (data && data.result && data.result.random && data.result.random.data) {
        return data.result.random.data;
      } else {
        console.error("Respuesta JSON no válida de Random.org:", data);
        return null;
      }
    } else {
      console.error("La respuesta no es JSON, es probable que sea HTML:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error al hacer la solicitud a Random.org:", error);
    return null;
  }
}