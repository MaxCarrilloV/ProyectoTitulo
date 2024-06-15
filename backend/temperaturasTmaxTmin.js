const Netcdf_temperatura = require('./Netcdf/Netcdf_temperaturas.js');
const path = require('path');
const fs = require('fs');

const subirArchivoTemperatura = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
  
    if (req.file && authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const sessionId = authorizationHeader.split(' ')[1];
        // Aquí puedes utilizar el sessionId como lo necesites
        console.log('ID de sesión:', sessionId);
  
        console.log('Archivo recibido:', req.file.originalname);
        
        // Ruta y nombre del archivo de destino
        const rutaActual = req.file.path;
        console.log('id pa nombre: ', sessionId)
        const nuevoNombre = 'temperatura_'+sessionId+'.nc';
        const nuevaRuta = 'uploads/'+sessionId+'/'+ nuevoNombre;
        console.log(nuevaRuta)
        try {
          if (fs.existsSync(nuevaRuta)) {
            fs.unlinkSync(nuevaRuta); // Eliminar archivo existente si existe
          }
          
          fs.renameSync(rutaActual, nuevaRuta);
          console.log('Archivo reemplazado exitosamente.',nuevoNombre);
          let tiempo = 1;
          if (tiempo) {
        
            const data = {
                archivo: path.join(__dirname, nuevaRuta),
                numero_time: tiempo,
                session_id: sessionId
            };
        
            
            Netcdf_temperatura.procesarDatos(data, res);
            console.log('Tiempo recibido:', tiempo);
          } else {
            res.status(400).send('Error: No se ha recibido el tiempo');
          }
  
        } catch (error) {
          console.error('Error al reemplazar el archivo:', error);
          res.status(500).send('Error al reemplazar el archivo');
        }
      } else {
        res.status(400).send('Error: No se ha recibido ningún archivo');
      }
};

const enviarTiempoTemperatura = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const sessionId = authorizationHeader.split(' ')[1];
      // Aquí puedes utilizar el sessionId como lo necesites
      console.log('ID de sesión:', sessionId);
      console.log('body: ',req.body);
      const { tiempo } = req.body;
      const tiempoEntero = parseInt(tiempo,10); // Convertir a número entero con base 10
      console.log(tiempoEntero); // Output: 10 (como número entero)
  
      if (tiempo) {
        const data = {
            archivo: path.join(__dirname, './uploads/',sessionId,'/temperatura_'+sessionId+'.nc'),
            numero_time: tiempoEntero,
            session_id: sessionId
        };
     
        Netcdf_temperatura.procesarDatos(data, res);
        console.log('Tiempo recibido:', tiempo);
      } else {
        res.status(400).send('Error: No se ha recibido el tiempo');
      }
    }
};
    
const borrarArchivosTemperatura = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const sessionId = authorizationHeader.split(' ')[1];
      // Aquí puedes utilizar el sessionId como lo necesites
      console.log('ID de sesión:', sessionId);
    
      const rutaArchivoNetcdf = path.join(__dirname, './uploads/',sessionId,'/temperatura_'+sessionId+'.nc');
      const rutaArchivoJSON = path.join(__dirname, './uploads/',sessionId,'/Lectura_temperatura_'+sessionId+'.json');
  
      try {
        let archivosEliminados = [];
  
        if (fs.existsSync(rutaArchivoNetcdf)) {
          fs.unlinkSync(rutaArchivoNetcdf);
          archivosEliminados.push('temperatura_'+sessionId+'.nc');
        }
  
        if (fs.existsSync(rutaArchivoJSON)) {
          fs.unlinkSync(rutaArchivoJSON);
          archivosEliminados.push('Lectura_temperatura_'+sessionId+'.json');
        }
  
        if (archivosEliminados.length > 0) {
          console.log('Archivos eliminados exitosamente:', archivosEliminados);
          res.status(200).send('Archivos eliminados: ' + archivosEliminados.join(', '));
        } else {
          console.log('No se encontraron archivos para eliminar.');
          res.status(404).send('No se encontraron archivos para eliminar');
        }
      } catch (error) {
        console.error('Error al eliminar los archivos:', error);
        res.status(500).send('Error al eliminar los archivos');
      }
    }
};
    

module.exports = {
    subirArchivoTemperatura,
    enviarTiempoTemperatura,
    borrarArchivosTemperatura
};