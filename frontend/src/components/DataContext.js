import React, { createContext, useState, useContext } from 'react';

// Crear el contexto para los datos de temperatura
const TemperatureContext = createContext();
// Crear el contexto para los datos de precipitación
const PrecipitationContext = createContext();

// Proveedor del contexto de temperatura
export const TemperatureProvider = ({ children }) => {
  const [temperatureData, setTemperatureData] = useState(null);
  return (
    <TemperatureContext.Provider value={{ temperatureData, setTemperatureData }}>
      {children}
    </TemperatureContext.Provider>
  );
};

// Proveedor del contexto de precipitación
export const PrecipitationProvider = ({ children }) => {
  const [precipitationData, setPrecipitationData] = useState(null);
  return (
    <PrecipitationContext.Provider value={{ precipitationData, setPrecipitationData }}>
      {children}
    </PrecipitationContext.Provider>
  );
};

// Hook para usar el contexto de temperatura
export const useTemperatureData = () => {
  return useContext(TemperatureContext);
};

// Hook para usar el contexto de precipitación
export const usePrecipitationData = () => {
  return useContext(PrecipitationContext);
};
