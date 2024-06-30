import React, { useEffect } from 'react';
import { useMap  } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as GeoTIFF from 'geotiff';

const GeoTiffMap = ({ tiffUrl, features  }) => {
  const map = useMap();

  useEffect(() => {
    const loadGeoTIFF = async () => {
      const response = await fetch(tiffUrl);
      const arrayBuffer = await response.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();

      const rasters = await image.readRasters();
      const width = image.getWidth();
      const height = image.getHeight();

      const bounds = [
        [image.getOrigin()[1], image.getOrigin()[0]],
        [image.getOrigin()[1] + height * image.getResolution()[1], image.getOrigin()[0] + width * image.getResolution()[0]],
      ];

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      const imageData = context.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < width * height; i++) {
        data[i * 4] = rasters[0][i]; // Red channel
        data[i * 4 + 1] = rasters[1][i]; // Green channel
        data[i * 4 + 2] = rasters[2][i]; // Blue channel
        data[i * 4 + 3] = rasters[3][i]; // Alpha channel
      }

      context.putImageData(imageData, 0, 0);

      const overlay = L.imageOverlay(canvas.toDataURL(), bounds);
      overlay.addTo(map);
    };

    loadGeoTIFF();
  }, [tiffUrl, map, features]);

  return null;
};


export default GeoTiffMap;

