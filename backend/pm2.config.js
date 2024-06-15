module.exports = {
    apps: [
      {
        name: 'backend',  // Nombre del proceso
        script: 'index.js',  // Nombre del archivo de entrada
        instances: 1,  // Número de instancias a ejecutar
        autorestart: true,  // Reiniciar automáticamente en caso de fallos
        watch: false,  // Vigilar cambios en los archivos para reiniciar
        max_memory_restart: '1G',  // Reiniciar si se supera la memoria máxima
        env: {
          NODE_ENV: 'production',  // Entorno de producción
        },
      },
    ],
  };
  