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
numero_time = input_obj['numero_time']
session_id = input_obj['session_id']
# Ruta al archivo NetCDF
file_path = input_obj['archivo']
t_variable = input_obj['t_variable']
lon_variable = input_obj['lon_variable']
lat_variable = input_obj['lat_variable']
colors = ['#00000000',  
          '#8b00ff60',
          '#0000ff60', 
          '#00ff0060',
          '#ffff0060', 
          '#ff7f0060', 
          '#ff000060' 
          ]  

cmap = ListedColormap(colors)

# Especificar el tiempo deseado (por ejemplo, el primer tiempo)(restamos 1 por ser una posicion
desired_time = numero_time - 1

# Abrir el archivo NetCDF
dataset = nc.Dataset(file_path)
if t_variable in dataset.variables and lon_variable in dataset.variables and lat_variable in dataset.variables:
    t_var = dataset.variables[t_variable]

    # Verificar si long_name contiene "precipitation"
    try:
        long_name = t_var.long_name
    except AttributeError:
        long_name = ""

    if 'tem' in long_name or "Tem" in long_name or "tem" in t_variable:
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

            # creamos listas para almacenar coordenadas y temperaturas por separado
            features = []
            tmax_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
            tmax_min = float('inf')  # Inicializar tmax_m con un valor muy pequeño
            # Recorrer los tiempos
            for t in range(num_times):
                if t == desired_time:
                    # Obtener los valores de la variable de temperatura para este tiempo
                    tmax_value = t_var[t, :, :]
                    if 'obs_file' in dataset.ncattrs():
                        atributo_obs_file = dataset.getncattr('obs_file')
                        if "CR2stn" in atributo_obs_file:
                            tmax_value = tmax_value[::-1, :]
                            lat_values = lat_values[::-1]
                    for j in range(len(lat_values)):
                        for k in range(len(lon_values)):
                            tmax = tmax_value[j, k]
                            if np.ma.is_masked(tmax):
                                # Valor enmascarado, asignar un valor predeterminado
                                tmax = -9999
                            else:
                                # Convertir a float
                                tmax = float(tmax)
                            if tmax > tmax_max:
                                tmax_max = tmax
                            if tmax < tmax_min and tmax != -9999:
                                tmax_min = tmax    
                            feature = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [float(lon_values[k]), float(lat_values[j])]
                                },
                                "properties": {
                                    "temperatura": tmax,
                                }
                            } 
                            features.append(feature)

            # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
            # Crear una matriz de colores aplicando el colormap
            t_nivel = tmax_max/6
            t_nivel1 = t_nivel*2
            t_nivel2 = t_nivel*3
            t_nivel3 = t_nivel*4
            t_nivel4 = t_nivel*5

            bounds = sorted([-9999, tmax_min, t_nivel, t_nivel1, t_nivel2, t_nivel3, t_nivel4, tmax_max])
            norm = BoundaryNorm(bounds,cmap.N)
            tmax_value = tmax_value.filled(-9999)
            pr_colored = cmap(norm(tmax_value))
            if tmax_max >60:
                t_units = "K"
            # Especificar los metadatos del raster
            try:
                t_units = t_var.units
            except AttributeError:
                t_units = "unknown"
            tiempos = num_times
            try:
                nombre_largo = t_var.long_name
            except AttributeError:
                nombre_largo = "unknown"
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
                'units': t_units
            }

            # Especificar la ruta y nombre del archivo de salida
            formatted_date = desired_date.strftime('%Y-%m-%d')
            output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.tif'


            # Guardar los datos en el archivo TIF
            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)


            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{numero_time}/{num_times} Fecha: {formatted_date}"
            output_data = {
                'result': result,
                'mapa': {
                    't_max': float(tmax_max),
                    't_min': float(tmax_min),
                    'units': t_units,
                    'tiempos': tiempos,
                    'time': time_units,
                    'mensaje': mensaje,
                    'coordenadas': features,
                    'file': output_file,
                    'available_dates': available_dates,
                    'nombre_largo': nombre_largo,
                }
            }
        else:
            num_times = 1
            desired_time = 0
            # Obtener las variables necesarias
            lon_var = dataset.variables[lon_variable]
            lat_var = dataset.variables[lat_variable]
            # Obtener los valores de las variables
            lon_values = lon_var[:]
            lat_values = lat_var[:]    
            
            features = []
            tmax_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
            tmax_min = float('inf')   # Inicializar tmax_min con un valor muy grande

            
            
            # Invertir los valores de latitud y los datos correspondientes
            tmax_value = t_var[ :, :]
            if 'obs_file' in dataset.ncattrs():
                atributo_obs_file = dataset.getncattr('obs_file')
                if "CR2stn" in atributo_obs_file:
                    tmax_value = tmax_value[::-1, :]
                    lat_values = lat_values[::-1]

            for j in range(len(lat_values)):
                for k in range(len(lon_values)):
                    tmax = tmax_value[j, k]
                    if np.ma.is_masked(tmax):
                        # Valor enmascarado, asignar un valor predeterminado
                        tmax = -9999.0
                    else:
                        tmax = float(tmax) # Convertir a float
                    if tmax > tmax_max:
                        tmax_max = tmax
                    if tmax < tmax_min and tmax != -9999.0:
                        tmax_min = tmax    
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(lon_values[k]), float(lat_values[j])]
                        },
                        "properties": {
                            "temperatura": tmax,
                        }
                    } 
                    features.append(feature)    
                    
            # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
            # Crear una matriz de colores aplicando el colormap
            t_nivel = tmax_max/6
            t_nivel1 = t_nivel*2
            t_nivel2 = t_nivel*3
            t_nivel3 = t_nivel*4
            t_nivel4 = t_nivel*5
            bounds = sorted([-9999, tmax_min, t_nivel, t_nivel1, t_nivel2, t_nivel3, t_nivel4, tmax_max])
            norm = BoundaryNorm(bounds,cmap.N)
            tmax_value = tmax_value.filled(-9999)
            pr_colored = cmap(norm(tmax_value))

            try:
                t_units = t_var.units
            except AttributeError:
                t_units = "unknown"
            tiempos = 1
            nombre_largo = t_var.long_name
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
                'units': t_units
            }
            formatted_date = 1
            output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.tif'

            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)


            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{numero_time}/{num_times}"
            output_data = {
                'result': result,
                'mapa': {
                    't_max': float(tmax_max),
                    't_min': float(tmax_min),
                    'units': t_units,
                    'tiempos': tiempos,
                    'mensaje': mensaje,
                    'coordenadas': features,
                    'file': output_file,
                    'available_dates':  "No time variable available",
                    'nombre_largo': nombre_largo,
                }
            }
    else:
        mensaje = 'variable incorrecta, porfavor carge un archivo netcdf de temperatura' 
        mapa_data = {
                'mensaje': mensaje ,
            }
            
        output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = 'variable incorrecta, porfavor carge un archivo netcdf de temperatura' 
        output_data = {
            'result': result,
            'mapa': mapa_data
        }
# Convertir el objeto de resultado a JSON
output_json = json.dumps(output_data)

# Enviar el resultado al proceso padre (Express) a través de la salida estándar
sys.stdout.write(output_json)
sys.stdout.flush()

# Cerrar el archivo NetCDF
dataset.close()