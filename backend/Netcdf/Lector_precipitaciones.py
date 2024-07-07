import netCDF4 as nc
import numpy as np
import json
import sys
from rasterio.transform import from_origin
import rasterio
from matplotlib.colors import ListedColormap, BoundaryNorm

# Leer los datos enviados desde Express
input_data = sys.stdin.read()

# Convertir los datos de JSON a objeto Python
input_obj = json.loads(input_data)

# Procesar los datos

# Definir la escala de colores con mayor transparencia
colors = ['#00000000',  
          '#ff000040',  
          '#ff7f0040',  
          '#ffff0040',  
          '#00ff0040',  
          '#0000ff40',  
          '#8b00ff40']  

cmap = ListedColormap(colors)

numero_time = input_obj['numero_time']
session_id = input_obj['session_id']
file_path = input_obj['archivo']
pr_variable = input_obj['pr_variable']
lon_variable = input_obj['lon_variable']
lat_variable = input_obj['lat_variable']

# Especificar el tiempo deseado 
desired_time = numero_time - 1

# Abrir el archivo NetCDF
dataset = nc.Dataset(file_path)

# Comprobar si las variables existen en el archivo NetCDF
if pr_variable in dataset.variables and lon_variable in dataset.variables and lat_variable in dataset.variables:
    pr_var = dataset.variables[pr_variable]

    # Verificar si long_name contiene "precipitation"
    try:
        long_name = pr_var.long_name
    except AttributeError:
        long_name = ""
    
    if "precipitation" in long_name or "pr" in pr_variable:
        if 'time' in dataset.variables:
            # Obtener las variables necesarias
            lon_var = dataset.variables[lon_variable]
            lat_var = dataset.variables[lat_variable]
            time_var = dataset.variables['time']

            # Obtener los valores de las variables
            lon_values = lon_var[:]
            lat_values = lat_var[:]
            time_values = time_var[:]
            num_times = len(time_values)
            # Obtener la fecha correspondiente al tiempo deseado
            time_units = time_var.units
            try:
                desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='365_day')
                available_dates = [nc.num2date(time, units=time_units, calendar='365_day').strftime('%Y-%m-%d') for time in time_values]
            except:
                desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')
                available_dates = [nc.num2date(time, units=time_units, calendar='360_day').strftime('%Y-%m-%d') for time in time_values]

            # Inicializar pr_max con un valor muy pequeño
            pr_max = -float('inf')
            # Invertir los valores de latitud y los datos correspondientes
            features = []
            # Procesar los valores y obtener pr_max
            for t in range(num_times):
                if t == desired_time:
                    pr_values = pr_var[t, :, :]
                    if 'obs_file' in dataset.ncattrs():
                        atributo_obs_file = dataset.getncattr('obs_file')
                        if "CR2stn" in atributo_obs_file:
                            pr_values = pr_values[::-1, :]
                            lat_values = lat_values[::-1]
                    for j in range(len(lat_values)):
                        for k in range(len(lon_values)):
                            pr = pr_values[j, k]
                            if np.ma.is_masked(pr):
                                pr = -9999.0  # Valor enmascarado
                            else:
                                pr = float(pr)  # Asegurar que el valor es un flotante

                            if pr > pr_max:
                                pr_max = pr
                            feature = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [float(lon_values[k]), float(lat_values[j])]
                                },
                                "properties": {
                                    "precipitacion": pr,
                                }
                            }
                            features.append(feature)   

            # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
            # Crear una matriz de colores aplicando el colormap
            pr_nivel = pr_max / 6
            pr_nivel1 = pr_nivel * 2
            pr_nivel2 = pr_nivel * 3
            pr_nivel3 = pr_nivel * 4
            pr_nivel4 = pr_nivel * 5
            bounds = [-9999, 0, pr_nivel, pr_nivel1, pr_nivel2, pr_nivel3, pr_nivel4, pr_max]
            norm = BoundaryNorm(bounds, cmap.N)
            pr_values = pr_values.filled(-9999)
            pr_colored = cmap(norm(pr_values))

            # Especificar los metadatos del raster
            try:
                pr_units = pr_var.units
            except AttributeError:
                pr_units = "unknown"
            
            tiempos = num_times
            mensaje = 'exito'
            metadata = {
                'driver': 'GTiff',
                'dtype': 'uint8',  # Cambiar a uint8 para los colores RGBA
                'nodata': 255,
                'width': len(lon_values),
                'height': len(lat_values),
                'count': 4,  # Cambiar a 4 para RGBA
                'crs': 'EPSG:4326',
                'transform': transform,
                'units': pr_units
            }

            # Especificar la ruta y nombre del archivo de salida
            formatted_date = desired_date.strftime('%Y-%m-%d')
            output_file = 'uploads/' + session_id + '/Lectura_precipitaciones_' + session_id + '.tif'

            # Guardar los datos en el archivo GeoTIFF
            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i + 1)
                
            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{desired_time + 1}/{num_times} Fecha: {formatted_date}"
            output_data = {
                'result': result,
                'mapa': {
                    'pr_max': float(pr_max),
                    'units': pr_units,
                    'tiempos': tiempos,
                    'time': time_units,
                    'mensaje': mensaje,
                    'coordenadas': features,
                    'file': output_file,
                    'available_dates': available_dates,
                }
            }
        else:
            num_times = 1
            # Obtener las variables necesarias
            lon_var = dataset.variables[lon_variable]
            lat_var = dataset.variables[lat_variable]
            # Obtener los valores de las variables
            lon_values = lon_var[:]
            lat_values = lat_var[:]    
            # Inicializar pr_max con un valor muy pequeño
            pr_max = -float('inf')

            # Obtener las variables necesarias
            lon_var = dataset.variables[lon_variable]
            lat_var = dataset.variables[lat_variable]
            # Obtener los valores de las variables
            lon_values = lon_var[:]
            lat_values = lat_var[:]

            # Invertir los valores de latitud y los datos correspondientes
            pr_values = pr_var[ :, :]
            if 'obs_file' in dataset.ncattrs():
                atributo_obs_file = dataset.getncattr('obs_file')
                if "CR2stn" in atributo_obs_file:
                    pr_values = pr_values[::-1, :]
                    lat_values = lat_values[::-1]
            # Procesar los valores y obtener pr_max
            features = []
            for j in range(len(lat_values)):
                for k in range(len(lon_values)):
                    pr = pr_values[j, k]
                    if np.ma.is_masked(pr):
                        pr = -9999.0  # Valor enmascarado
                    else:
                        pr = float(pr)  # Asegurar que el valor es un flotante

                    if pr > pr_max:
                        pr_max = pr
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(lon_values[k]), float(lat_values[j])]
                        },
                        "properties": {
                            "precipitacion": pr,
                        }
                    }
                    features.append(feature)   

            # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
            # Crear una matriz de colores aplicando el colormap
            pr_nivel = pr_max / 6
            pr_nivel1 = pr_nivel * 2
            pr_nivel2 = pr_nivel * 3
            pr_nivel3 = pr_nivel * 4
            pr_nivel4 = pr_nivel * 5
            bounds = [-9999, 0, pr_nivel, pr_nivel1, pr_nivel2, pr_nivel3, pr_nivel4, pr_max]
            norm = BoundaryNorm(bounds, cmap.N)
            pr_values = pr_values.filled(-9999)
            pr_colored = cmap(norm(pr_values))

            # Especificar los metadatos del raster
            try:
                pr_units = pr_var.units
            except AttributeError:
                pr_units = "unknown"
            
            tiempos = num_times
            mensaje = 'exito'
            metadata = {
                'driver': 'GTiff',
                'dtype': 'uint8',  # Cambiar a uint8 para los colores RGBA
                'nodata': 255,
                'width': len(lon_values),
                'height': len(lat_values),
                'count': 4,  # Cambiar a 4 para RGBA
                'crs': 'EPSG:4326',
                'transform': transform,
                'units': pr_units
            }

            # Especificar la ruta y nombre del archivo de salida
            formatted_date = "1"
            output_file = 'uploads/' + session_id + '/Lectura_precipitaciones_' + session_id + '.tif'

            # Guardar los datos en el archivo GeoTIFF
            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i + 1)

            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{tiempos}/{num_times}"
            output_data = {
                'result': result,
                'mapa': {
                    'pr_max': pr_max,
                    'units': pr_units,
                    'tiempos': tiempos,
                    'mensaje': mensaje,
                    'coordenadas': features,
                    'file': output_file,
                    'available_dates': "No time variable available"
                }
            }
    else:
        mensaje = 'variable incorrecta, por favor cargue un archivo netcdf de Precipitaciones' 
        geojson_data = {
            "mensaje": mensaje
        }
        
        output_file = 'uploads/' + session_id + '/Lectura_precipitaciones_' + session_id + '.tif'

        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(geojson_data, file)

        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = 'variable incorrecta, por favor cargue un archivo netcdf de Precipitaciones' 
        output_data = {
            'result': result,
            'mapa': geojson_data
        }

# Convertir el objeto de resultado a JSON
output_json = json.dumps(output_data)

# Enviar el resultado al proceso padre (Express) a través de la salida estándar
sys.stdout.write(output_json)
sys.stdout.flush()

# Cerrar el archivo NetCDF
dataset.close()