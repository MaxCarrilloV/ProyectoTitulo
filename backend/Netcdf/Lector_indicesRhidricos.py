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



# Especificar el tiempo deseado (por ejemplo, el primer tiempo)(restamos 1 por ser una posicion)
desired_time = numero_time - 1

# Abrir el archivo NetCDF
dataset = nc.Dataset(file_path)
if 'ih' in dataset.variables:
    #esto es para los archivos netcdf que si tienen la variable time
    if 'time' in dataset.variables:
        # Obtener las variables necesarias
        ih_var = dataset.variables['ih']
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
        # creamos listas para almacenar coordenadas y precipitaciones por separado
        coordenadas_list = []
        valores_list = []

        ih_max = -float('inf')  # Inicializar ih_max con un valor muy pequeño


        # Recorrer los tiempos
        for t in range(num_times):
            if t == desired_time:
                # Obtener los valores de la variable de ih para este tiempo
                ih_value = ih_var[t, :, :]
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
                    
                        coordenadas = {
                            'lat': float(lat_values[j]),
                            'lon': float(lon_values[k]),
                        }
                        valores = ih
                        coordenadas_list.append(coordenadas)
                        valores_list.append(valores)


        ih_units = ih_var.units
        tiempos = num_times
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito' 
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            'ih_max': ih_max,
            'units': ih_units,
            'tiempos': tiempos,
            "mensaje": mensaje
        }

        # Especificar la ruta y nombre del archivo de salida
        formatted_date = desired_date.strftime('%Y-%m-%d')
        output_file = 'uploads/' + session_id + '/Lectura_indicesRHidrico_' + session_id + '.json'


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
        # Obtener las variables necesarias
        ih_var = dataset.variables['ih']
        lon_var = dataset.variables['lon']
        lat_var = dataset.variables['lat']
        # Obtener los valores de las variables
        lon_values = lon_var[:]
        lat_values = lat_var[:]    
        # Crear una lista para almacenar los datos
        data_list = []
        # creamos listas para almacenar coordenadas y precipitaciones por separado
        coordenadas_list = []
        valores_list = []
        # Inicializar ih_max con un valor muy pequeño
        ih_max = -float('inf')  
        ih_value = ih_var[ :, :]
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
                    
                coordenadas = {
                    'lat': float(lat_values[j]),
                    'lon': float(lon_values[k]),
                }
                valores = ih
                coordenadas_list.append(coordenadas)
                valores_list.append(valores)

        ih_units = ih_var.units
        tiempos = 1
        # Crear un diccionario con las coordenadas y los valores
        mensaje = 'exito' 
        mapa_data = {
            'coordenadas': coordenadas_list,
            'valores': valores_list,
            'ih_max': ih_max,
            'units': ih_units,
            'tiempos': tiempos,
            'mensaje': mensaje
        }
        formatted_date = 1
        output_file = 'uploads/' + session_id + '/Lectura_indicesRHidrico_' + session_id + '.json'


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