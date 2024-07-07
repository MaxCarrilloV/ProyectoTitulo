import React from 'react';
import './InfoControl.css';

const IhControl = ({pr_max,units}) => {

  pr_max = pr_max.toFixed(2);
  let pr_nivel = pr_max/6;
  pr_nivel = pr_nivel.toFixed(2);
  let pr_nivel1 = pr_nivel*2;
  pr_nivel1 = pr_nivel1.toFixed(2);
  let pr_nivel2 = pr_nivel*3;
  pr_nivel2 = pr_nivel2.toFixed(2);
  let pr_nivel3 = pr_nivel*4;
  pr_nivel3 = pr_nivel3.toFixed(2);
  let pr_nivel4 = pr_nivel*5;
  pr_nivel4 = pr_nivel4.toFixed(2);
  
  const colorRanges = [
    { color: '#ff0000', range: `0 - ${pr_nivel}` },
    { color: '#ff7f00', range: `${pr_nivel} - ${pr_nivel1}` },
    { color: '#ffff00', range: `${pr_nivel1} - ${pr_nivel2}` },
    { color: '#00ff00', range: `${pr_nivel2} - ${pr_nivel3}` },
    { color: '#0000ff', range: `${pr_nivel3} - ${pr_nivel4}` },
    { color: '#8b00ff', range: `${pr_nivel4} - ${pr_max}` }
  ];

  return (
    <div className="info-control">
      <h4>Indice hidrico</h4>
      <ul>
        {colorRanges.map((item, index) => (
          <li key={index}>
            <span
              style={{
                backgroundColor: item.color,
                display: 'inline-block',
                width: '20px',
                height: '20px',
                marginRight: '5px',
                opacity: 0.5
              }}
            ></span>
            {item.range}{units === 'mm' ? ' mm/mes' : ' mm/días'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IhControl;
