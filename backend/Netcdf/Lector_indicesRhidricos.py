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
ih_variable = input_obj['ih_variable']
lon_variable = input_obj['lon_variable']
lat_variable = input_obj['lat_variable']

# Colores para el mapa
colors = ['#00000000',  
          '#ff000040',  
          '#ff7f0040',  
          '#ffff0040',  
          '#00ff0040',  
          '#0000ff40',  
          '#8b00ff40']    
cmap = ListedColormap(colors)

# Especificar el tiempo deseado (por ejemplo, el primer tiempo)(restamos 1 por ser una posicion)
desired_time = numero_time - 1

# Abrir el archivo NetCDF
dataset = nc.Dataset(file_path)
if ih_variable in dataset.variables and lon_variable in dataset.variables and lat_variable in dataset.variables:
    ih_var = dataset.variables[ih_variable]

    # Verificar si long_name contiene "precipitation"
    try:
        long_name = ih_var.long_name
    except AttributeError:
        long_name = ""

    if 'ih' in long_name or 'Indice de riesgo hidrico' in long_name or "h" in long_name:
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


            # Crear una lista para almacenar los datos
            features = []
            
            ih_max = -float('inf')  # Inicializar ih_max con un valor muy pequeño


            # Recorrer los tiempos
            for t in range(num_times):
                if t == desired_time:
                    # Obtener los valores de la variable de ih para este tiempo
                    ih_value = ih_var[t, :, :]
                    if 'obs_file' in dataset.ncattrs():
                        atributo_obs_file = dataset.getncattr('obs_file')
                        if "CR2stn" in atributo_obs_file:
                            ih_value = ih_value[::-1, :]
                            lat_values = lat_values[::-1]
                    for j in range(len(lat_values)):
                        for k in range(len(lon_values)):
                            ih = ih_value[j, k]
                            if np.ma.is_masked(ih):
                                # Valor enmascarado, asignar un valor predeterminado
                                ih = -9999.0
                            else:
                                # Convertir a float
                                ih = float(ih)

                            if ih > ih_max:
                                ih_max = ih

            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])   


            ih_nivel = ih_max/6
            ih_nivel1 = ih_nivel*2
            ih_nivel2 = ih_nivel*3
            ih_nivel3 = ih_nivel*4
            ih_nivel4 = ih_nivel*5
            bounds = [-9999, 0, ih_nivel, ih_nivel1, ih_nivel2, ih_nivel3,ih_nivel4 ,ih_max]
            norm = BoundaryNorm(bounds,cmap.N)
            ih_value  =ih_value.filled(-9999)
            pr_colored = cmap(norm(ih_value))               
                            

            try:
                ih_units = ih_var.units
            except AttributeError:
                ih_units = "unknown"
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
                'units': ih_units
            }

            # Especificar la ruta y nombre del archivo de salida
            formatted_date = desired_date.strftime('%Y-%m-%d')
            output_file = 'uploads/' + session_id + '/Lectura_indicesRHidrico_' + session_id + '.tif'
            
            # Guardar los datos en el archivo GeoTIFF
            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)
            


            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{numero_time}/{num_times} Fecha: {formatted_date}"
            output_data = {
                'result': result,
                'mapa': {
                    'ih_max': float(ih_max),
                    'units': ih_units,
                    'tiempos': tiempos,
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
            # Crear una lista para almacenar los datos
            features = []
            
            # Inicializar ih_max con un valor muy pequeño
            ih_max = -float('inf')  
            ih_value = ih_var[ :, :]
            if 'obs_file' in dataset.ncattrs():
                atributo_obs_file = dataset.getncattr('obs_file')
                if "CR2stn" in atributo_obs_file:
                    ih_value = ih_value[::-1, :]
                    lat_values = lat_values[::-1]
            for j in range(len(lat_values)):
                for k in range(len(lon_values)):
                    ih = ih_value[j, k]
                    if np.ma.is_masked(ih):
                        # Valor enmascarado, asignar un valor predeterminado
                        ih = -9999.0
                    else:
                        # Convertir a float
                        ih = float(ih)

                    if ih > ih_max:
                        ih_max = ih
            
            res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
            transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])   
            
                    
            ih_nivel = ih_max/6
            ih_nivel1 = ih_nivel*2
            ih_nivel2 = ih_nivel*3
            ih_nivel3 = ih_nivel*4
            ih_nivel4 = ih_nivel*5
            bounds = [-9999, 0, ih_nivel, ih_nivel1, ih_nivel2, ih_nivel3,ih_nivel4 ,ih_max]
            norm = BoundaryNorm(bounds,cmap.N)
            ih_value  =ih_value.filled(-9999)
            pr_colored = cmap(norm(ih_value))            
                    
            

            try:
                ih_units = ih_var.units
            except AttributeError:
                ih_units = "unknown"
            tiempos = 1
            # Crear un diccionario con las coordenadas y los valores
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
                'units': ih_units
            }
            formatted_date = 1
            output_file = 'uploads/' + session_id + '/Lectura_indicesRHidrico_' + session_id + '.tif'


            # Guardar los datos en el archivo GeoTIFF
            with rasterio.open(output_file, 'w', **metadata) as dst:
                for i in range(4):  # Escribir cada canal RGBA
                    dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)


            # Enviar el resultado al proceso padre (Express) a través de la salida estándar
            result = f"{numero_time}/{num_times}"
            output_data = {
                'result': result,
                'mapa': {
                    'pr_max': ih_max,
                    'units': ih_units,
                    'tiempos': tiempos,
                    'mensaje': mensaje,
                    'coordenadas': features,
                    'file': output_file,
                    'available_dates': "No time variable available"
                }
            }
    else:
        mensaje = 'variable incorrecta, porfavor carge un archivo netcdf de Indices de riesgo hidrico' 
        mapa_data = {
                'mensaje': mensaje ,
            }
            
        output_file = 'uploads/' + session_id + '/Lectura_indicesRHidrico_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = 'variable incorrecta, porfavor carge un archivo netcdf de Indices de riesgo hidrico'
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