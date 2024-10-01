import express from 'express';
import http from 'http';
import { Server as WebSocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeWebSocket } from './sockets.js'; // Importamos la lógica de WebSocket
import { initializeWebSocketAlumnos } from './socketAlumno.js'; // Importamos la lógica de WebSocket
import util from 'util'; // Para utilizar util.promisify con consultas MySQL
import { connection } from './config/db.mjs'; // Conexión a la base de datos

const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server); // Configura el servidor WebSocket

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Inicializa la lógica del WebSocket
initializeWebSocket(io);
initializeWebSocketAlumnos(io);

// Ruta para obtener estudiantes del curso y ciclo más recientes
const query = util.promisify(connection.query).bind(connection);

// Inicia el servidor en el puerto 5500
server.listen(5500, () => {
  console.log('Servidor escuchando en el puerto 5500');
});
