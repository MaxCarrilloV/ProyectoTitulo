const Netcdf_precipitaciones = require('./Netcdf/Netcdf_precipitaciones.js');
const path = require('path');
const fs = require('fs');

const subirArchivoPrecipitaciones = (req, res) => {
    const authorizationHeader = req.headers['authorization'];
    const { pr_variable, lon_variable, lat_variable, totalChunks } = req.body;
    const files = req.files;

    if (files && authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const sessionId = authorizationHeader.split(' ')[1];
        console.log('ID de sesión:', sessionId);

        const nuevoNombre = `precipitaciones_${sessionId}.nc`;
        const targetDir = path.join(__dirname, 'uploads', sessionId);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        files.forEach((file, index) => {
            const targetPath = path.join(targetDir, `${nuevoNombre}.part${index + 1}`);
            fs.renameSync(file.path, targetPath);
        });

        if (files.length === parseInt(totalChunks, 10)) {
            const finalPath = path.join(targetDir, nuevoNombre);
            const writeStream = fs.createWriteStream(finalPath);

            const combineFiles = (i) => {
                if (i > totalChunks) {
                    writeStream.end();
                    writeStream.on('finish', () => {
                        const data = {
                            archivo: finalPath,
                            numero_time: 1,
                            session_id: sessionId,
                            pr_variable,
                            lon_variable,
                            lat_variable,
                        };
                        Netcdf_precipitaciones.procesarDatos(data, res);
                    });
                    return;
                }

                const chunkPath = path.join(targetDir, `${nuevoNombre}.part${i}`);
                const readStream = fs.createReadStream(chunkPath);

                readStream.pipe(writeStream, { end: false });
                readStream.on('end', () => {
                    fs.unlinkSync(chunkPath);
                    combineFiles(i + 1);
                });

                readStream.on('error', (err) => {
                    console.error('Error al leer el fragmento:', err);
                    res.status(500).send('Error al combinar los fragmentos');
                });
            };

            combineFiles(1);
        } else {
            res.json({ message: 'Chunks uploaded successfully' });
        }
    } else {
        res.status(400).send('Error: No se ha recibido ningún archivo o la autorización es inválida');
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
            session_id: sessionId,
            pr_variable: req.body.pr_variable,
            lon_variable: req.body.lon_variable,
            lat_variable: req.body.lat_variable,
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