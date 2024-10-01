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

// Exportar la conexión para ser utilizada en otros módulos
export { connection };