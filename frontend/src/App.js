//import logo from './logo.svg';
//import './App.css';
import Precipitacion from './components/Precipitaciones';
import InicioSesion from './components/InicioSesion';
import IndicesRH from './components/IndicesRH';
import Temperaturas from './components/Temperaturas';
import MapView from './components/MapView'
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Menu from './components/Menu';





function App() {
  
// Configura axios para enviar automáticamente el sessionId en las solicitudes.
axios.defaults.headers.common['Authorization'] = `Bearer ${Cookies.get('sessionId')}`;


  return (
    <Router>
      {/* Define tus rutas dentro de un Routes */}
      <Routes>
        {/* Ruta para el componente InicioSesion */}
        <Route path="/" element={<InicioSesion />} />
        {/* Ruta para el componente Menu */}
        <Route path='/menu' element={<Menu/>}/>
        {/* Ruta para el componente Precipitaciones */}
        <Route path="/precipitaciones" element={<Precipitacion />} />
        {/* Ruta para el componente Indices */}
        <Route path="/indicesrh" element={<IndicesRH />} />
        {/* Ruta para el componente Temperaturas */}
        <Route path="/temperaturas" element={<Temperaturas />} />
        {/* Agrega otras rutas aquí */}
      </Routes>
    </Router>
  );
}

export default App;
