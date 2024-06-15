const Netcdf_precipitaciones = require('./Netcdf/Netcdf_precipitaciones.js');
const path = require('path');
const fs = require('fs');

const subirArchivoPrecipitaciones = (req, res) => {
    const authorizationHeader = req.headers['authorization'];

    if (req.file && authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const sessionId = authorizationHeader.split(' ')[1];
        //para utilizar el sessionId
        console.log('ID de sesión:', sessionId);

        console.log('Archivo recibido:', req.file.originalname);
        
        // Ruta y nombre del archivo de destino
        const rutaActual = req.file.path;
        console.log('id pa nombre: ', sessionId)
        const nuevoNombre = 'precipitaciones_'+sessionId+'.nc';
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
        
            
            Netcdf_precipitaciones.procesarDatos(data, res);
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

const enviarTiempoPrecipitaciones = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const sessionId = authorizationHeader.split(' ')[1];
        //para utilizar el sessionId
        console.log('ID de sesión:', sessionId);
        console.log('body: ',req.body);
        const { tiempo } = req.body;
        const tiempoEntero = parseInt(tiempo,10); // Convertir a número entero con base 10
        console.log(tiempoEntero); // Output: 10 (como número entero)

        if (tiempo) {
        const data = {
            archivo: path.join(__dirname, './uploads/',sessionId,'/precipitaciones_'+sessionId+'.nc'),
            numero_time: tiempoEntero,
            session_id: sessionId
        };
    
        Netcdf_precipitaciones.procesarDatos(data, res);
        console.log('Tiempo recibido:', tiempo);
        } else {
        res.status(400).send('Error: No se ha recibido el tiempo');
        }
    }
};
    
const borrarArchivosPrecipitaciones = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const sessionId = authorizationHeader.split(' ')[1];
        //para utilizar el sessionId
        console.log('ID de sesión:', sessionId);
  
        const rutaArchivoNetcdf = path.join(__dirname, './uploads/',sessionId,'/precipitaciones_'+sessionId+'.nc');
        const rutaArchivoJSON = path.join(__dirname, './uploads/',sessionId,'Lectura_precipitaciones_'+sessionId+'.json');

        try {
            let archivosEliminados = [];

            if (fs.existsSync(rutaArchivoNetcdf)) {
                fs.unlinkSync(rutaArchivoNetcdf);
                archivosEliminados.push('precipitaciones_'+sessionId+'.nc');
            }

            if (fs.existsSync(rutaArchivoJSON)) {
                fs.unlinkSync(rutaArchivoJSON);
                archivosEliminados.push('Lectura_precipitaciones_'+sessionId+'.json');
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
    subirArchivoPrecipitaciones,
    enviarTiempoPrecipitaciones,
    borrarArchivosPrecipitaciones
};