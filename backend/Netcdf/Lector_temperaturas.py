import netCDF4 as nc
import numpy as np
import json
import sys


# Leer los datos enviados desde Express
input_data = sys.stdin.read()

# Convertir los datos de JSON a objeto Python
input_obj = json.loads(input_data)

# Procesar los datos
numero_time = input_obj['numero_time']
session_id = input_obj['session_id']
# Ruta al archivo NetCDF
file_path = input_obj['archivo']



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
        desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')

        # Crear una lista para almacenar los datos
        data_list = []
        # creamos listas para almacenar coordenadas y temperaturas por separado
        coordenadas_list = []
        valores_list = []

        tmax_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño


        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de temperatura para este tiempo
                tmax_value = tmax_var[t, :, :]
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
                    
                        coordenadas = {
                            'lat': float(lat_values[j]),
                            'lon': float(lon_values[k]),
                        }
                        valores = tmax
                        coordenadas_list.append(coordenadas)
                        valores_list.append(valores)


        t_units = tmax_var.units
        tiempos = num_times
        nombre_largo = tmax_var.long_name
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito'
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            't_max': tmax_max,
            'units': t_units,
            'tiempos': tiempos,
            'mensaje': mensaje,
            'nombre_largo': nombre_largo
        }

        # Especificar la ruta y nombre del archivo de salida
        formatted_date = desired_date.strftime('%Y-%m-%d')
        output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times} Fecha: {formatted_date}"
        output_data = {
            'result': result,
            'mapa': mapa_data
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
        # Crear una lista para almacenar los datos
        data_list = []
        # creamos listas para almacenar coordenadas y temperaturas por separado
        coordenadas_list = []
        valores_list = []
        # Inicializar tmax_max con un valor muy pequeño
        t_max = -float('inf')  
        tmax_value = tmax_var[ :, :]
        for j in range(len(lat_values)):
            for k in range(len(lon_values)):
                tmax = tmax_value[j, k]
                if np.ma.is_masked(tmax):
                    # Valor enmascarado, asignar un valor predeterminado
                    tmax = -9999.0
                else:
                    # Convertir a float
                    tmax = float(tmax)

                if tmax > t_max:
                    t_max = tmax
                    
                coordenadas = {
                    'lat': float(lat_values[j]),
                    'lon': float(lon_values[k]),
                }
                valores = tmax
                coordenadas_list.append(coordenadas)
                valores_list.append(valores)

        t_units = tmax_var.units
        tiempos = 1
        nombre_largo = tmax_var.long_name
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito'
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            't_max': t_max,
            'units': t_units,
            'tiempos': tiempos,
            'mensaje': mensaje,
            'nombre_largo': nombre_largo
        }
        formatted_date = 1
        output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times}"
        output_data = {
            'result': result,
            'mapa': mapa_data
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
        desired_date = nc.num2date(time_values[desired_time], units=time_units, calendar='360_day')

        # Crear una lista para almacenar los datos
        data_list = []
        # creamos listas para almacenar coordenadas y temperaturas por separado
        coordenadas_list = []
        valores_list = []

        t_max = -float('inf')  # Inicializar tmax_max con un valor muy pequeño


        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de temperatura para este tiempo
                tmin_value = tmin_var[t, :, :]
                for j in range(len(lat_values)):
                    for k in range(len(lon_values)):
                        tmin = tmin_value[j, k]
                        if np.ma.is_masked(tmin):
                            # Valor enmascarado, asignar un valor predeterminado
                            tmin = -9999.0
                        else:
                            # Convertir a float
                            tmin = float(tmin)

                        if tmin > t_max:
                            t_max = tmin
                    
                        coordenadas = {
                            'lat': float(lat_values[j]),
                            'lon': float(lon_values[k]),
                        }
                        valores = tmin
                        coordenadas_list.append(coordenadas)
                        valores_list.append(valores)


        t_units = tmin_var.units
        tiempos = num_times
        nombre_largo = tmin_var.long_name
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito'
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            't_max': t_max,
            'units': t_units,
            'tiempos': tiempos,
            'mensaje': mensaje,
            'nombre_largo': nombre_largo
        }

        # Especificar la ruta y nombre del archivo de salida
        formatted_date = desired_date.strftime('%Y-%m-%d')
        output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times} Fecha: {formatted_date}"
        output_data = {
            'result': result,
            'mapa': mapa_data
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
        data_list = []
        # creamos listas para almacenar coordenadas y temperaturas por separado
        coordenadas_list = []
        valores_list = []
        # Inicializar tmax_max con un valor muy pequeño
        t_max = -float('inf')  
        tmin_value = tmin_var[ :, :]
        for j in range(len(lat_values)):
            for k in range(len(lon_values)):
                tmin = tmin_value[j, k]
                if np.ma.is_masked(tmin):
                    # Valor enmascarado, asignar un valor predeterminado
                    tmin = -9999.0
                else:
                    # Convertir a float
                    tmin = float(tmin)

                if tmin > t_max:
                    t_max = tmin
                    
                coordenadas = {
                    'lat': float(lat_values[j]),
                    'lon': float(lon_values[k]),
                }
                valores = tmin
                coordenadas_list.append(coordenadas)
                valores_list.append(valores)

        t_units = tmin_var.units
        tiempos = 1
        nombre_largo = tmin_var.long_name
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito'
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            't_max': t_max,
            'units': t_units,
            'tiempos': tiempos,
            'mensaje': mensaje,
            'nombre_largo': nombre_largo
        }
        formatted_date = 1
        output_file = 'uploads/' + session_id + '/Lectura_temperatura_' + session_id + '.json'


        # Guardar los datos en el archivo JSON
        with open(output_file, 'w') as file:
            json.dump(mapa_data, file)


        # Enviar el resultado al proceso padre (Express) a través de la salida estándar
        result = f"{numero_time}/{num_times}"
        output_data = {
            'result': result,
            'mapa': mapa_data
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