import React from 'react';
import { MapContainer as Map, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'

const MapView = ({ coordenadas, valores }) => {
  return (
    <Map  center={{ lat: -36.2809888, lng: -72.5468136 }} zoom={13}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap'
      />

      {coordenadas && valores && coordenadas.map((coordenada, index) => (
        <Marker position={[coordenada.lat, coordenada.lng]} key={index}>
          <Popup>
            Valor: {valores[index]}
          </Popup>
        </Marker>
      ))}

    </Map>
  );
};

export default MapView;