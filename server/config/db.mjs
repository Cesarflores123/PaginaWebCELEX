import mysql from 'mysql2';

// Crear conexión a la base de datos
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'celexbd',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para cerrar todas las conexiones del pool
function disconnect() {
  connection.end((err) => {
    if (err) {
      console.error('Error al cerrar la conexión:', err);
    } else {
      console.log('Conexión a la base de datos cerrada.');
    }
  });
}


// Exportar la conexión para ser utilizada en otros módulos
export { connection, disconnect };