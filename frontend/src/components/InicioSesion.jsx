import './FormularioSesion.css';
import React from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Alert, button } from 'react-bootstrap';
import { useState, useEffect } from 'react';


function InicioSesion() {
  const navigate = useNavigate();
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState("danger")
  useEffect(() => {
    // Verificar si la sesión ha expirado
    const Cookie = Cookies.get('sessionId');
    if (Cookie==='usuario_expirado') {
      // La sesión ha expirado, muestra la alerta
      setMostrarAlerta(true);
      setMensaje('Servidor: Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      setTipoMensaje('info');
      console.log('Sesión expirada');
      // Limpia la cookie de sesión expirada
      Cookies.remove('sessionId');
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        //credentials: 'include',
      });
      const data = await response.json();
      const sessionId = data.sessionId;

      // Crear una fecha que expire en 5 horas
      const expirationDate = new Date();
      //console.log(expirationDate);
      expirationDate.setTime(expirationDate.getTime() + (5 * 60 * 60 * 1000)); // 5 horas en milisegundos
      //expirationDate.setTime(expirationDate.getTime() + ( 1 * 60 * 1000)); // 2 minutos en milisegundos
      // Almacena el sessionId en una cookie con la fecha de expiracion personalizada
      Cookies.set('sessionId', sessionId, { expires: expirationDate });
      Cookies.set('sessionExpiration', expirationDate, { expires: expirationDate });
      console.log(data);
      console.log('fecha de expiracion:',expirationDate);
      navigate('/menu');
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="error-message">
      {mostrarAlerta && (
        <Alert variant={tipoMensaje} onClose={() => setMostrarAlerta(false)} >
          {mensaje}
        </Alert>
      )}
      </div>
      {/* Header */}
      <header className='header'>
        <h1 className="formulario-title">VISUALIZACIÓN DE ARCHIVOS
        NETCDF EMPLEANDO MAPAS WEB
        INTERACTIVOS
        </h1>
      </header>

      {/* Formulario de inicio de sesión */}
      <div className="formulario-container">
        
      <img src="/UBB.png" alt="Mi Imagen" style={{ maxWidth: '400px', height: 'auto' }}/>


        <h2>Haga clic para abrir el menú de visualización de archivos NetCDF</h2>
        <div className="formulario-content">
          <button onClick={handleLogin}>Iniciar</button>
        </div>
      </div>

      {/* Footer */}
      <footer className='footer'>
        <p>Nombre: Joaquin Alonso Bustos Torres.</p>
        <p>Profesor guía: Clemente Rubio Manzano.</p>
      </footer>
    </div>
  );

 
}

export default InicioSesion;

