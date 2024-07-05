//import logo from './logo.svg';
//import './App.css';
import InicioSesion from './components/InicioSesion';
import IndicesRHN from './components/IndicesRHN';
import Temperaturas from './components/Temperaturas';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Menu from './components/Menu';
import Precipitacion from './components/Precipitaciones';




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
        <Route path="/indicesrh" element={<IndicesRHN />} />
        {/* Ruta para el componente Temperaturas */}
        <Route path="/temperaturas" element={<Temperaturas />} />
      </Routes>
    </Router>
  );
}

export default App;
