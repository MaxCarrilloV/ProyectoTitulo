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

colors = ['#00000000',  
          '#8b00ff40',
          '#0000ff40', 
          '#00ff0040',
          '#ffff0040', 
          '#ff7f0040', 
          '#ff000040' 
          ]  

cmap = ListedColormap(colors)

# Especificar el tiempo deseado (por ejemplo, el primer tiempo)(restamos 1 por ser una posicion
desired_time = numero_time - 1

# Abrir el archivo NetCDF
dataset = nc.Dataset(file_path)
if 'tmax' in dataset.variables:
    if 'time' in dataset.variables:
        # Obtener las variables necesarias
        tmax_var = dataset.variables['tmax']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        time_var = dataset.variables['time']


        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]
        time_values = time_var[:]
        num_times = len(time_values)
        

        # Obtener la fecha correspondiente al tiempo deseado
        time_units = time_var.units
        if '360_day' in time_units:
            desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')
            available_dates = [nc.num2date(time, units=time_units, calendar='360_day').strftime('%Y-%m-%d') for time in time_values]
            day = min(desired_date.day, 30)  # Asegurarse de que el día no sea mayor a 30
            desired_date = desired_date.replace(day=day)
            available_dates = [date.replace(day=min(date.day, 30)) for date in available_dates]
        else:
            desired_date = nc.num2date(time_values[desired_time], units=time_units)
            available_dates = [nc.num2date(time, units=time_units).strftime('%Y-%m-%d') for time in time_values]

        # creamos listas para almacenar coordenadas y temperaturas por separado
        features = []
        tmax_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
        tmax_min = float('inf')  # Inicializar tmax_m con un valor muy pequeño
        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de temperatura para este tiempo
                tmax_value = tmax_var[t, :, :]
                tmax_value = tmax_value[::-1, :]
                lat_values = lat_values[::-1]
                for j in range(len(lat_values)):
                    for k in range(len(lon_values)):
                        tmax = tmax_value[j, k]
                        if np.ma.is_masked(tmax):
                            # Valor enmascarado, asignar un valor predeterminado
                            tmax = -9999.0
                        else:
                            # Convertir a float
                            tmax = float(tmax)
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
        bounds = [-9999,tmax_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,tmax_max]
        norm = BoundaryNorm(bounds,cmap.N)
        pr_values = tmax_value.filled(-9999)
        pr_colored = cmap(norm(tmax_value))

        t_units = tmax_var.units
        tiempos = num_times
        nombre_largo = tmax_var.long_name
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
        tmax_var = dataset.variables['tmax']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]    
        
        features = []
        tmax_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
        tmax_min = float('inf')   # Inicializar tmax_min con un valor muy grande

        tmax_value = tmax_var[ :, :]
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
        bounds = [-9999,tmax_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,tmax_max]
        norm = BoundaryNorm(bounds,cmap.N)
        pr_values = tmax_value.filled(-9999)
        pr_colored = cmap(norm(tmax_value))

        t_units = tmax_var.units
        tiempos = 1
        nombre_largo = tmax_var.long_name
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
elif 'tmin' in dataset.variables:
    if 'time' in dataset.variables:
        # Obtener las variables necesarias
        tmin_var = dataset.variables['tmin']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        time_var = dataset.variables['time']

        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]
        time_values = time_var[:]
        num_times = len(time_values)

        # Obtener la fecha correspondiente al tiempo deseado
        time_units = time_var.units
        if '360_day' in time_units:
            desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')
            available_dates = [nc.num2date(time, units=time_units, calendar='360_day').strftime('%Y-%m-%d') for time in time_values]
            day = min(desired_date.day, 30)  # Asegurarse de que el día no sea mayor a 30
            desired_date = desired_date.replace(day=day)
            available_dates = [date.replace(day=min(date.day, 30)) for date in available_dates]
        else:
            desired_date = nc.num2date(time_values[desired_time], units=time_units)
            available_dates = [nc.num2date(time, units=time_units).strftime('%Y-%m-%d') for time in time_values]

        # creamos listas para almacenar coordenadas y temperaturas por separado
        features = []

        tmin_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
        tmin_min = float('inf')  # Inicializar tmax_m con un valor muy pequeño

        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de temperatura para este tiempo
                tmin_value = tmin_var[t, :, :]
                tmin_value = tmin_value[::-1, :]
                lat_values = lat_values[::-1]
                for j in range(len(lat_values)):
                    for k in range(len(lon_values)):
                        tmin = tmin_value[j, k]
                        if np.ma.is_masked(tmin):
                            # Valor enmascarado, asignar un valor predeterminado
                            tmin = -9999.0
                        else:
                            # Convertir a float
                            tmin = float(tmin)
                        if tmin > tmin_max:
                            tmin_max = tmin
                        if tmin < tmin_min and tmin != -9999.0:
                            tmin_min = tmin
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [float(lon_values[k]), float(lat_values[j])]
                            },
                            "properties": {
                                "temperatura": tmin,
                            }
                        } 
                        features.append(feature)
        # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
        res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
        transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
        # Crear una matriz de colores aplicando el colormap
        t_nivel = tmin_max/6
        t_nivel1 = t_nivel*2
        t_nivel2 = t_nivel*3
        t_nivel3 = t_nivel*4
        t_nivel4 = t_nivel*5
        bounds = [-9999,tmin_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,tmin_max]
        norm = BoundaryNorm(bounds,cmap.N)
        pr_values = tmin_value.filled(-9999)
        pr_colored = cmap(norm(tmin_value))                

        t_units = tmin_var.units
        tiempos = num_times
        nombre_largo = tmin_var.long_name
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
                't_max': float(tmin_max),
                't_min': float(tmin_min),
                'units': t_units,
                'tiempos': tiempos,
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
        tmin_var = dataset.variables['tmin']
        #print(tmax_var)
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]    
        # Crear una lista para almacenar los datos
        features = []
        
        # Inicializar tmax_max con un valor muy pequeño
        tmin_max = -float('inf')  
        tmin_min = float('inf')
        tmin_value = tmin_var[ :, :]
        tmin_value = tmin_value[::-1, :]
        lat_values = lat_values[::-1]
        for j in range(len(lat_values)):
            for k in range(len(lon_values)):
                tmin = tmin_value[j, k]
                if np.ma.is_masked(tmin):
                    # Valor enmascarado, asignar un valor predeterminado
                    tmin = -9999.0
                else:
                    # Convertir a float
                    tmin = float(tmin)
                if tmin > tmin_max:
                    t_max = tmin      
                if tmin < tmin_min and tmin != -9999.0:
                    tmin_min = tmin
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(lon_values[k]), float(lat_values[j])]
                    },
                    "properties": {
                        "temperatura": tmin,
                    }
                }
                features.append(feature)
        # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
        res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
        transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
        # Crear una matriz de colores aplicando el colormap
        t_nivel = tmin_max/6
        t_nivel1 = t_nivel*2
        t_nivel2 = t_nivel*3
        t_nivel3 = t_nivel*4
        t_nivel4 = t_nivel*5
        bounds = [-9999,tmin_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,tmin_max]
        norm = BoundaryNorm(bounds,cmap.N)
        pr_values = tmin_value.filled(-9999)
        pr_colored = cmap(norm(tmin_value))

        t_units = tmin_var.units
        tiempos = 1
        nombre_largo = tmin_var.long_name
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


        # Guardar los datos en el archivo TIF
        with rasterio.open(output_file, 'w', **metadata) as dst:
            for i in range(4):  # Escribir cada canal RGBA
                dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)
        

        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times}"
        output_data = {
            'result': result,
            'mapa': {
                't_max': float(tmin_max),
                't_min': float(tmin_min),
                'units': t_units,
                'tiempos': tiempos,
                'mensaje': mensaje,
                'coordenadas': features,
                'file': output_file,
                'available_dates':  "No time variable available",
                'nombre_largo': nombre_largo,
            }
        }
elif 't2m' in dataset.variables:
    if 'time' in dataset.variables:
        # Obtener las variables necesarias
        t2m_var = dataset.variables['t2m']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        time_var = dataset.variables['time']

        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]
        time_values = time_var[:]
        num_times = len(time_values)

        # Obtener la fecha correspondiente al tiempo deseado
        time_units = time_var.units
        if '360_day' in time_units:
            desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')
            available_dates = [nc.num2date(time, units=time_units, calendar='360_day').strftime('%Y-%m-%d') for time in time_values]
            day = min(desired_date.day, 30)  # Asegurarse de que el día no sea mayor a 30
            desired_date = desired_date.replace(day=day)
            available_dates = [date.replace(day=min(date.day, 30)) for date in available_dates]
        else:
            desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')
            available_dates = [nc.num2date(time, units=time_units, calendar='360_day').strftime('%Y-%m-%d') for time in time_values]

        # creamos listas para almacenar coordenadas y temperaturas por separado
        features = []

        t2m_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño
        t2m_min = float('inf')

        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de temperatura para este tiempo
                t2m_value = t2m_var[t, :, :]
                t2m_value = t2m_value[::-1, :]
                lat_values = lat_values[::-1]
                for j in range(len(lat_values)):
                    for k in range(len(lon_values)):
                        t2m = t2m_value[j, k]
                        if np.ma.is_masked(t2m):
                            # Valor enmascarado, asignar un valor predeterminado
                            t2m = -9999.0
                        else:
                            # Convertir a float
                            t2m = float(t2m)
                        if t2m > t2m_max:
                            t2m_max = t2m
                        if t2m < t2m_min and t2m != -9999.0:
                            t2m_min = t2m
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [float(lon_values[k]), float(lat_values[j])]
                            },
                            "properties": {
                                "temperatura": t2m,
                            }
                        } 
                        features.append(feature)
        # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
        res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
        transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
        # Crear una matriz de colores aplicando el colormap
        t_nivel = t2m_max/6
        t_nivel1 = t_nivel*2
        t_nivel2 = t_nivel*3
        t_nivel3 = t_nivel*4
        t_nivel4 = t_nivel*5
        bounds = [-9999,t2m_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,t2m_max]
        norm = BoundaryNorm(bounds,cmap.N)
        t2m_value = t2m_value.filled(-9999)
        pr_colored = cmap(norm(t2m_value))

        t_units = t2m_var.units
        tiempos = num_times
        nombre_largo = t2m_var.long_name
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
            for i in range(4):
                dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)

        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times} Fecha: {formatted_date}"
        output_data = {
            'result': result,
            'mapa': {
                't_max': float(t2m_max),
                't_min': float(t2m_min),
                'units': t_units,
                'tiempos': tiempos,
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
        t2m_var = dataset.variables['t2m']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]    
        # Crear una lista para almacenar los datos
        features = []
        
        # Inicializar tmax_max con un valor muy pequeño
        t2m_max = -float('inf')  
        t2m_min = float('inf')
        t2m_value = t2m_var[ :, :]
        t2m_value = t2m_value[::-1, :]
        lat_values = lat_values[::-1]
        for j in range(len(lat_values)):
            for k in range(len(lon_values)):
                t2m = t2m_value[j, k]
                if np.ma.is_masked(t2m):
                    # Valor enmascarado, asignar un valor predeterminado
                    t2m = -9999.0
                else:
                    # Convertir a float
                    t2m = float(t2m)
                if t2m > t2m_max:
                    t_max = t2m      
                if t2m < t2m_min and t2m != -9999.0:
                    t2m_min = t2m
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(lon_values[k]), float(lat_values[j])]
                    },
                    "properties": {
                        "temperatura": t2m,
                    }
                }
                features.append(feature)
        # Crear transform (requiere la resolución y las coordenadas de la esquina superior izquierda)
        res = (lon_values[1] - lon_values[0], lat_values[1] - lat_values[0])
        transform = from_origin(lon_values.min(), lat_values.max(), res[0], res[1])
        # Crear una matriz de colores aplicando el colormap
        t_nivel = t2m_max/6
        t_nivel1 = t_nivel*2
        t_nivel2 = t_nivel*3
        t_nivel3 = t_nivel*4
        t_nivel4 = t_nivel*5
        bounds = [-9999,t2m_min , t_nivel, t_nivel1, t_nivel2, t_nivel3,t_nivel4 ,t2m_max]
        norm = BoundaryNorm(bounds,cmap.N)
        t2m_value = t2m_value.filled(-9999)
        pr_colored = cmap(norm(t2m_value))

        t_units = t2m_var.units
        tiempos = 1
        nombre_largo = t2m_var.long_name
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


        # Guardar los datos en el archivo TIF
        with rasterio.open(output_file, 'w', **metadata) as dst:
            for i in range(4):
                dst.write((pr_colored[:, :, i] * 255).astype(np.uint8), i+1)

        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times}"
        output_data = {
            'result': result,
            'mapa': {
                't_max': float(t2m_max),
                't_min': float(t2m_min),
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