import React from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { Nav } from "react-bootstrap";
import "./Formulario.css";
const SidebarMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleSelect = (selectedKey) => {
    navigate(selectedKey);
  };

  return (
    <Nav  defaultActiveKey={location.pathname} variant="pills"  className="mt-5 flex-column" onSelect={handleSelect}>
      <Nav.Item>
        <Nav.Link eventKey="/">Home</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/precipitaciones">Precipitaciones</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/IndicesRH">Índice de Riesgo Hídrico</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/temperaturas">
          Temperaturas mínimas y máximas
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default SidebarMenu;
