import connect from './server/config/bd.mjs'; // Asegúrate de que la ruta sea correcta

async function testDBConnection() {
  try {
    const connection = await connect(); // Llama a la función para conectarse a la base de datos
    console.log('Conexión exitosa a la base de datos.');

    // Realiza una consulta simple
    const [rows] = await connection.query('SELECT 1');
    console.log('Consulta de prueba exitosa:', rows);

    // Cierra la conexión después de la prueba
    await connection.end();
  } catch (error) {
    console.error('Error al intentar conectarse a la base de datos:', error);
  }
}

testDBConnection();