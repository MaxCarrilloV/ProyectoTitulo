const { spawn } = require('child_process');
const path = require('path');

// Ruta relativa al script de Python
const pythonScriptPath = path.join(__dirname, 'Lector_indicesRhidricos.py');

function procesarDatos(data, res) {
    const inputJSON = JSON.stringify(data); // Agrega esta línea para definir inputJSON

    const pythonProcess = spawn('python', [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    pythonProcess.stdin.write(inputJSON);
    pythonProcess.stdin.end();

    let outputJSON = '';
    pythonProcess.stdout.on('data', (data) => {
        outputJSON += data.toString();
    });

    

    pythonProcess.stdout.on('end', () => {
        try {
            const outputData = JSON.parse(outputJSON);
            console.log('Resultado recibido desde Python:', outputData);
            res.send(JSON.stringify(outputData)); // Convertir a cadena JSON
        } catch (error) {
            handleError('Error al analizar la salida JSON:', error);
        }
    });

    pythonProcess.on('error', (error) => {
        handleError('Error al ejecutar el script de Python:', error);
    });

    pythonProcess.stderr.on('data', (data) => {
        handleError('El script de Python:', data.toString());
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            handleError('El script de Python ha terminado con un código de error:', code);
        }
    });

    function handleError(message, error) {
        console.error(message, error);
        if (!res.headersSent) {
            res.status(500).send('Error al procesar los datos');
        }
    }
}



module.exports = {
    procesarDatos
};