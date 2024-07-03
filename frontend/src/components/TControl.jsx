import React from "react";
import "./InfoControl.css";

const TControl = ({ t_max, t_min, units,nombre }) => {
  t_min = t_min.toFixed(2);
  t_max = t_max.toFixed(2);
  let t_nivel = t_max / 6;
  t_nivel = t_nivel.toFixed(2);
  let t_nivel1 = t_nivel * 2;
  t_nivel1 = t_nivel1.toFixed(2);
  let t_nivel2 = t_nivel * 3;
  t_nivel2 = t_nivel2.toFixed(2);
  let t_nivel3 = t_nivel * 4;
  t_nivel3 = t_nivel3.toFixed(2);
  let t_nivel4 = t_nivel * 5;
  t_nivel4 = t_nivel4.toFixed(2);

  const colorRanges = [
    { color: "#8b00ff", range: `${t_min} - ${t_nivel}` },
    { color: "#0000ff", range: `${t_nivel} - ${t_nivel1}` },
    { color: "#00ff00", range: `${t_nivel1} - ${t_nivel2}` },
    { color: "#ffff00", range: `${t_nivel2} - ${t_nivel3}` },
    { color: "#ff7f00", range: `${t_nivel3} - ${t_nivel4}` },
    { color: "#ff0000", range: `${t_nivel4} - ${t_max}` },
  ];

  return (
    <div className="info-control">
      <h4>Temperatura {nombre}</h4>
      <ul>
        {colorRanges.map((item, index) => (
          <li key={index}>
            <span
              style={{
                backgroundColor: item.color,
                display: "inline-block",
                width: "20px",
                height: "20px",
                marginRight: "5px",
                opacity: 0.5,
              }}
            ></span>
            {item.range}
            {units === "Celsius" ? " grados/mes" : " grados/días"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TControl;
