import React from 'react';
import { Link } from 'react-router-dom';
import './Menu.css';


const Menu = () => {
  return (
    <div className="menu-container">
      <header className="menu-header">
        <h1 className="menu-title">Visualización de archivos NetCDF</h1>
      </header>
      <nav className="menu-nav">
        <ul className="menu-list">  
          <li className="menu-item">
            <Link to="/precipitaciones" className="menu-link">-Visualización de Precipitaciones</Link>
          </li>
          <li className="menu-item">
            <Link to="/IndicesRH" className="menu-link">-Visualización de Índice de Riesgo Hídrico</Link>
          </li>
          <li className="menu-item">
            <Link to="/temperaturas" className="menu-link">-Visualización de Temperaturas mínimas y máximas</Link>
          </li>
          
        </ul>
      </nav>
      <footer className="menu-footer">
        <p>Nombre: Joaquin Alonso Bustos Torres.</p>
        <p>Profesor guía: Clemente Rubio Manzano.</p>
      </footer>
    </div>
  );
};

export default Menu;

