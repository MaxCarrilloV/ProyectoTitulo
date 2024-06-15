const express = require('express');
const app = express();
const IndicesRHidricos = require('./IndicesRHidricos.js');
const TemperaturasTmaxTmin = require('./temperaturasTmaxTmin.js');
const Precipitaciones = require('./precipitaciones.js');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Para gestionar la subida de archivos
const upload = multer({ dest: 'uploads/' }); // Directorio donde se guardarán los archivos subidos
const PORT = 3001; // Puerto en el que se ejecutará el servidor
const cors = require('cors');
app.use(cors()); //para la comunicacion front-back
const bodyParser = require('body-parser'); //para recibir bien datos desde front
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const { v4: uuidv4 } = require('uuid');

// Almacén para guardar los SessionIDs válidos
const activeSessions = new Map();

// Middleware para habilitar CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // IMPORTANTE: Habilitar el manejo de credenciales
  next();
});

// Función para crear una nueva carpeta con el ID de sesión y su tiempo de creación
function crearCarpeta(sessionId) {
  const nombreCarpeta = sessionId;
  const rutaEspecifica = 'uploads/';
  const rutaCompleta = path.join(rutaEspecifica, nombreCarpeta);

  // Verificar si la carpeta ya existe antes de crearla
  if (!fs.existsSync(rutaCompleta)) {
    fs.mkdirSync(rutaCompleta);
    console.log(`Carpeta "${rutaCompleta}" creada correctamente.`);
  } else {
    console.log(`La carpeta "${rutaCompleta}" ya existe.`);
  }

  // Guardar el ID de sesión junto con su tiempo de creación en el almacén
  activeSessions.set(sessionId, Date.now());
}

// Configurar un mecanismo para verificar y eliminar las carpetas caducadas
const tiempoMaximoDuracionCarpeta = 5 * 60 * 60 * 1000; // Tiempo máximo de 5 horas (en milisegundos)
//const tiempoMaximoDuracionCarpeta = 1 * 60 * 1000; // Tiempo máximo de 1min (en milisegundos)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, creationTime] of activeSessions.entries()) {
    if (now - creationTime >= tiempoMaximoDuracionCarpeta) {
      const rutaCarpeta = path.join('uploads/', sessionId);
      if (fs.existsSync(rutaCarpeta)) {
        fs.rmdirSync(rutaCarpeta, { recursive: true });
        activeSessions.delete(sessionId);
        console.log(`Carpeta "${rutaCarpeta}" eliminada automáticamente debido a la expiración.`);
      }
    }
  }
}, 60 * 60 * 1000); // Verificar cada hora (en milisegundos)

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
  req.sessionID = uuidv4();
  const sessionId = req.sessionID;
  crearCarpeta(sessionId); // Crear la carpeta y almacenar el tiempo de creación en el mapa activeSessions
  res.status(200).json({ sessionId });
});

// Para subir el archivo
app.post('/api/subir-archivo',  upload.single('archivo'), (req, res) => { 
  Precipitaciones.subirArchivoPrecipitaciones( req, res);
});
  
  
// Para recibir el tiempo
app.post('/api/enviar-tiempo', cors(), (req, res) => {
  Precipitaciones.enviarTiempoPrecipitaciones( req, res);
});   

//Para borrar los archivos
app.delete('/api/borrar-archivos', (req, res) => {
  Precipitaciones.borrarArchivosPrecipitaciones( req, res);
});

//Indices de riesgo hidrico
// Para subir el archivo
app.post('/api/subir-archivo-indicerh',  upload.single('archivo'), (req, res) => { 
  IndicesRHidricos.subirArchivoIndicerh( req, res);
});

// Para recibir el tiempo
app.post('/api/enviar-tiempo-indicerh', cors(), (req, res) => {
  IndicesRHidricos.enviarTiempoIndicerh( req, res);
}); 

//Para borrar los archivos
app.delete('/api/borrar-archivos-indicerh', (req, res) => {
  IndicesRHidricos.borrarArchivosIndicerh( req, res);
});
//temperaturas
// Para subir el archivo
app.post('/api/subir-archivo-temperatura',  upload.single('archivo'), (req, res) => { 
  TemperaturasTmaxTmin.subirArchivoTemperatura( req, res);
});

// Para recibir el tiempo
app.post('/api/enviar-tiempo-temperatura', cors(), (req, res) => {
  TemperaturasTmaxTmin.enviarTiempoTemperatura( req, res);
}); 

//Para borrar los archivos
app.delete('/api/borrar-archivos-temperatura', (req, res) => {
  TemperaturasTmaxTmin.borrarArchivosTemperatura( req, res);
});

/*    
//envia archivo json al navegador(test)
app.get('/json', (req, res) => {
    // Define la ruta del archivo JSON que deseas enviar
    const archivoJSON = path.join(__dirname, './Lectura_netcdf.json');

    
    // Enviar el archivo JSON al navegador
    res.sendFile(archivoJSON, (error) => {
        if (error) {
            res.status(500).send('Error al enviar el archivo JSON');
        }
    });
});*/


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Express ejecutándose en el puerto ${PORT}`);
  });