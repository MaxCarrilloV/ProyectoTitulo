import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker} from 'react-leaflet';
import './Formulario.css';
import { Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';



const useCircleMarkerRef = () => {
  const circleMarkerRef = useRef();
  return circleMarkerRef;
};




const IndicesRH = () => {
  useEffect(() => {
    // Obtener el sessionId de las cookies y configurarlo en el encabezado de la solicitud
    axios.defaults.headers.common['Authorization'] = `Bearer ${Cookies.get('sessionId')}`;
  }, []);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileConfirmed, setFileConfirmed] = useState(false);
  const [resultado, setResultado] = useState('');
  const [coordenadas, setCoordenadas] = useState([]);
  const [valores, setValores] = useState([]);
  const [ih_max, setih_max] = useState([]);
  const [units, setunits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [enableButton, setEnableButton] = useState(false);
  const [mapaActualizado, setMapaActualizado] = useState(false);
  const [botonLimpiarHabilitado, setBotonLimpiarHabilitado] = useState(false);
  const [botonCargarTiempoHabilitado, setBotonCargarTiempoHabilitado] = useState(false);
  const [indices, setIndices] = useState([]);
  const [colores, setColores] = useState([]);
  const [mostrarBarraColores, setMostrarBarraColores] = useState(true);
  const [maxTiempo, setMaxTiempo] = useState(null);
  const [mensaje, setMensaje] = useState('');
  //const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoMensaje, setTipoMensaje] = useState("danger")
  const [mostrarAlertaArchivo, setMostrarAlertaArchivo] = useState(false);
  const [mostrarAlertaTiempo, setMostrarAlertaTiempo] = useState(false);
  //const [bandera, setbandera] = useState(false);
  //const [bandera2, setbandera2] = useState(false);
  const navigate = useNavigate();



  const useModalRef = () => {
    const modalRef = useRef();
    return modalRef;
  };

  const modalRef = useModalRef();
  


  
      
//para enviar el archivo netcdf
  const enviarArchivo = () => {
    const Cookie = Cookies.get('sessionId');
    //con esto en caso de sesion expirada enviamos al usuario al inicio
    if (!Cookie) {
      // La sesión ha expirado, redirigir al usuario a pagina de inicio de sesion
      const error = 'usuario_expirado';
      Cookies.set('sessionId', error);
      console.log(Cookies.get('sessionId'));
      navigate('/');
    }

    if (selectedFile) {
      const formData = new FormData();
      formData.append('archivo', selectedFile);
      console.log(Cookies.get())
      setLoading(true); // Mostrar el mensaje de "Cargando archivo"
      setButtonsDisabled(true); // Deshabilitar los botones de archivo
  
      axios.post('/api/subir-archivo-indicerh', formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get('sessionId')}`
        }
      })
        .then(response => {
            if (response.data.mapa.mensaje !== 'exito') {
                setMensaje('Servidor: Variable incorrecta, por favor carga un archivo netcdf con una variable de Índices de Riesgo Hídrico');
                setMostrarAlertaArchivo(true);
                setTipoMensaje('danger');
                setLoading(false);
                setButtonsDisabled(false);
              } else {
                setMensaje('Servidor: Espere a que cargue el mapa por completo.');
                setMostrarAlertaArchivo(true);
                setTipoMensaje('info');
                Cookies.get('req.sessionId');
                setFileConfirmed(true);
                setLoading(false); // Cambiar el mensaje a "Archivo cargado"
                setEnableButton(true); // Habilitar el botón para habilitar los botones de archivo
                setBotonLimpiarHabilitado(true);
                setBotonCargarTiempoHabilitado(false);
                
               
                const resultado = response.data;
                setResultado(resultado);
                
                console.log(resultado.mapa.ih_max);
                setCoordenadas(resultado.mapa.coordenadas);
                setValores(resultado.mapa.valores);
                setih_max(resultado.mapa.ih_max);
                console.log(ih_max);
                setunits(resultado.mapa.units);
                setMaxTiempo(resultado.mapa.tiempos);
                console.log(resultado.mapa.tiempos);
                console.log(maxTiempo);

                // Generar los índices y colores de la barra de colores, porque es una funcion asincrona y las variables pueden no estar
                const niveles_ih = resultado.mapa.ih_max / 5;
                const nivel_1 = niveles_ih;
                const nivel_2 = niveles_ih * 2;
                const nivel_3 = niveles_ih * 3;
                const nivel_4 = niveles_ih * 4;
                const nivel_5 = resultado.mapa.ih_max;
                if (resultado.mapa.units === 'grados') {
                    setIndices([
                    `0 - ${nivel_1.toFixed(2)} grados`,
                    `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} grados`,
                    `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} grados`,
                    `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} grados`,
                    `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} grados`
                    ]);          
                }else if (resultado.mapa.units === 'mm/day') {//Actualizar a unidad que tenga sentido 
                    setIndices([
                    `0 - ${nivel_1.toFixed(2)} mm/dia`,
                    `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} mm/día`,
                    `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} mm/día`,
                    `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} mm/día`,
                    `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} mm/día`
                    ]);          
                }else{
                    setIndices([
                    `0 - ${nivel_1.toFixed(2)} ${resultado.mapa.units}`,
                    `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} ${resultado.mapa.units}`,
                    `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} ${resultado.mapa.units}`,
                    `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} ${resultado.mapa.units}`,
                    `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} ${resultado.mapa.units}`
                    ]);
                }
                const coloresGenerados = ['blue', '#00BFFF', 'white', 'yellow', 'red'];
                setColores(coloresGenerados);
                setMostrarBarraColores(true);
                //pintarMapa();
            }
            
        })
        .catch(error => {
          console.log('Error al enviar el archivo al backend:', error);
          setLoading(false); // Cambiar el mensaje a "Archivo cargado" incluso en caso de error
          setEnableButton(true); // Habilitar el botón para habilitar los botones de archivo
        });
    } else {
      console.log('Error: No se ha seleccionado un archivo.');
    }
  };

 
  
  
  
//para enviar el time a cargar
  const onSubmit = (data) => {
    const Cookie = Cookies.get('sessionId');
    //con esto en caso de sesion expirada enviamos al usuario al inicio
    if (!Cookie) {
      // La sesión ha expirado, redirigir al usuario a pagina de inicio de sesion
      const error = 'usuario_expirado';
      Cookies.set('sessionId', error);
      console.log(Cookies.get('sessionId'));
      navigate('/');
    }

    if (fileConfirmed) {

      const tiempo = parseInt(data["tiempo"]);

      if (isNaN(tiempo)) {
        console.log('Error: Debe ingresar un valor númerico válido.');
        setMensaje('Error: Debe ingresar un valor númerico válido.');
        setTipoMensaje('danger');
        setMostrarAlertaTiempo(true);
        return;
      }

      if (tiempo < 1 || tiempo > maxTiempo) {
        console.log(`Error: El tiempo debe estar en el rango de 1 a ${maxTiempo}.`);
        setMensaje(`Error: El tiempo debe estar en el rango de 1 a ${maxTiempo}.`);
        setTipoMensaje('danger');
        setMostrarAlertaTiempo(true);
        return;
      }

      axios.post('/api/enviar-tiempo-indicerh', { tiempo: data["tiempo"] })
        .then(response => {
          setMensaje('Servidor: Espere a que cargue el mapa por completo.');
          setMostrarAlertaTiempo(true);
          setTipoMensaje('info');
          console.log('Tiempo enviado exitosamente al backend.');
          const resultado = response.data;
          console.log(resultado);
          setResultado(resultado);
          setCoordenadas(resultado.mapa.coordenadas);
          setValores(resultado.mapa.valores);
          setih_max(resultado.mapa.ih_max);
          console.log(resultado.mapa.ih_max);
          console.log(ih_max);
          setunits(resultado.mapa.units);
          setMapaActualizado(true);
          setMostrarBarraColores(true);
          //generarIndices(); // Llamar a la función para generar los índices
          setBotonCargarTiempoHabilitado(false);
          setBotonLimpiarHabilitado(true);
          console.log(resultado.result);
          //pintarMapa();
          
        })
        .catch(error => {
          console.log('Error al enviar el tiempo al backend:', error);
        });
    } else {
      console.log('Error: Primero debes confirmar el archivo.');
      setMensaje('Error: Primero debe confirmar el archivo.');
      setMostrarAlertaTiempo(true);
    }
  };

  useEffect(() => {
    console.log(ih_max);
    generarIndices();
  }, [ih_max]);


//funcion de seleccionador
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file && file.name.endsWith('.nc')) {
      setSelectedFile(file);
      setSelectedFileName(file.name); // Establecer el nombre del archivo seleccionado
    } else {
      setSelectedFile(null);
      setSelectedFileName(""); // Reiniciar el nombre del archivo seleccionado
      console.log('Error: Debes seleccionar un archivo con extensión .nc');
    }
  };
  
  const circleMarkerRef = useCircleMarkerRef();
/*
  useEffect(() => {
    if (coordenadas.length > 0 || !bandera) {
      pintarMapa();
      setbandera(true); // Establecer la bandera para evitar futuras llamadas a pintarMapa
    }
  }, [coordenadas, bandera]);
*/
  
  const pintarMapa = () => {  
    if (coordenadas.length === 0 || valores.length === 0 ) {
      return null;
    }
  
    const niveles_ih = ih_max / 5;
    const nivel_1 = niveles_ih;
    const nivel_2 = niveles_ih * 2;
    const nivel_3 = niveles_ih * 3;
    const nivel_4 = niveles_ih * 4;
    const nivel_5 = ih_max;

    /*if(!bandera){*/
    // Limpia las capas de marcadores antes de agregar las nuevas
    if (circleMarkerRef.current) {
      const circleMarker = circleMarkerRef.current;
      circleMarker.clearLayers();
    }
    
    const circleMarkers = [];
    console.log(coordenadas.length)
        
    for (let i = 0; i < coordenadas.length; i++) {
      
      const Coordenada = coordenadas[i];
      const valor = valores[i];
      if (valor >= 0 && valor <= nivel_1){
        circleMarkers.push(
          <CircleMarker
            key={i} // Agrega una clave única para cada componente generado
            center={[Coordenada.lat, Coordenada.lon]}
            radius={0}
            color="blue"
            fillColor="blue"
            fillOpacity={0.8}
          />
        );
      }
      if(valor > nivel_1 && valor <= nivel_2){
        circleMarkers.push(
          <CircleMarker
            key={i} // Agrega una clave única para cada componente generado
            center={[Coordenada.lat, Coordenada.lon]}
            radius={0}
            color="#00BFFF"
            fillColor="#00BFFF"
            fillOpacity={0.8}
          />
        );
      }
      if(valor > nivel_2 && valor <= nivel_3){
        circleMarkers.push(
          <CircleMarker
            key={i} // Agrega una clave única para cada componente generado
            center={[Coordenada.lat, Coordenada.lon]}
            radius={0}
            color="white"
            fillColor="white"
            fillOpacity={0.8}
          />
        );
      }
      if(valor > nivel_3 && valor <= nivel_4){
        circleMarkers.push(
          <CircleMarker
            key={i} // Agrega una clave única para cada componente generado
            center={[Coordenada.lat, Coordenada.lon]}
            radius={0}
            color="yellow"
            fillColor="yellow"
            fillOpacity={0.8}
          />
        );
      }
      if(valor > nivel_4 && valor <= nivel_5){
        circleMarkers.push(
          <CircleMarker
            key={i} // Agrega una clave única para cada componente generado
            center={[Coordenada.lat, Coordenada.lon]}
            radius={0}
            color="red"
            fillColor="red"
            fillOpacity={0.8}
          />
        );
      }
      
      
    }
    console.log('sali del  if');    
    /* 
    if(bandera){
      if (circleMarkerRef.current) {
        const circleMarker = circleMarkerRef.current;
        circleMarker.clearLayers();
      }
      const circleMarkers = [];
      console.log(coordenadas.length)    
      for (let i = 0; i < coordenadas.length; i++) {
        
        const Coordenada = coordenadas[i];
        const valor = valores[i];
        if (valor >= 0 && valor <= nivel_1){
          circleMarkers.push(
            <CircleMarker
              key={i} // Agrega una clave única para cada componente generado
              center={[Coordenada.lat, Coordenada.lon]}
              radius={0}
              color="blue"
              fillColor="blue"
              fillOpacity={0.8}
            />
          );
        }
        if(valor > nivel_1 && valor <= nivel_2){
          circleMarkers.push(
            <CircleMarker
              key={i} // Agrega una clave única para cada componente generado
              center={[Coordenada.lat, Coordenada.lon]}
              radius={0}
              color="#00BFFF"
              fillColor="#00BFFF"
              fillOpacity={0.8}
            />
          );
        }
        if(valor > nivel_2 && valor <= nivel_3){
          circleMarkers.push(
            <CircleMarker
              key={i} // Agrega una clave única para cada componente generado
              center={[Coordenada.lat, Coordenada.lon]}
              radius={0}
              color="white"
              fillColor="white"
              fillOpacity={0.8}
            />
          );
        }
        if(valor > nivel_3 && valor <= nivel_4){
          circleMarkers.push(
            <CircleMarker
              key={i} // Agrega una clave única para cada componente generado
              center={[Coordenada.lat, Coordenada.lon]}
              radius={0}
              color="yellow"
              fillColor="yellow"
              fillOpacity={0.8}
            />
          );
        }
        if(valor > nivel_4 && valor <= nivel_5){
          circleMarkers.push(
            <CircleMarker
              key={i} // Agrega una clave única para cada componente generado
              center={[Coordenada.lat, Coordenada.lon]}
              radius={0}
              color="red"
              fillColor="red"
              fillOpacity={0.8}
            />
          );
        }
        
        
      }
      console.log('sali del segundo if');
      setbandera2(true);
    }*/
    //setbandera(true);
    return circleMarkers;
  };
/*
  const pintarMapa = () => {
    if (coordenadas.length === 0 || valores.length === 0 || bandera ) {
      return null;
    }
  
    console.log("Pintando el mapa...");
  
    const niveles_ih = ih_max / 5;
    const nivel_1 = niveles_ih;
    console.log(nivel_1);
    const nivel_2 = niveles_ih * 2;
    const nivel_3 = niveles_ih * 3;
    const nivel_4 = niveles_ih * 4;
    const nivel_5 = ih_max;
  
    const circleMarkers = coordenadas.map((Coordenada, i) => {
      console.log(`Generando marcador ${i}: ${Coordenada.lat}, ${Coordenada.lon}`);
      if(i === coordenadas.length-1){
        setbandera(true);
      }
      const valor = valores[i];
      let color = "blue"; // Definir color en función del valor
  
      if (valor > nivel_1 && valor <= nivel_2) {
        color = "#00BFFF";
      } else if (valor > nivel_2 && valor <= nivel_3) {
        color = "white";
      } else if (valor > nivel_3 && valor <= nivel_4) {
        color = "yellow";
      } else if (valor > nivel_4 && valor <= nivel_5) {
        color = "red";
      }
      
      return (
        <CircleMarker
          key={i}
          center={[Coordenada.lat, Coordenada.lon]}
          radius={0}
          color={color}
          fillColor={color}
          fillOpacity={0.8}
        />
      );
    });
  
    console.log(`Total de marcadores generados: ${circleMarkers.length}`);
    setbandera(true);
    return circleMarkers;
  };*/
  
/*  
  useEffect(() => {
    if (mapaActualizado) {
      setMapaActualizado(false); // Reiniciar la bandera después de pintar el mapa
    }
  }, [mapaActualizado]);
*/

  const generarIndices = () => {
    console.log(resultado.map);
    if (resultado.mapa) {
      setih_max(resultado.mapa.ih_max);
      const niveles_ih = ih_max / 5;
      console.log(ih_max);
      const nivel_1 = niveles_ih;
      const nivel_2 = niveles_ih * 2;
      const nivel_3 = niveles_ih * 3;
      const nivel_4 = niveles_ih * 4;
      const nivel_5 = niveles_ih * 5;
      console.log(units);
      if (units === 'grados') {
        
        const indice_1 = `0 - ${nivel_1.toFixed(2)} grados`;
        const indice_2 = `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} grados`;
        const indice_3 = `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} grados`;
        const indice_4 = `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} grados`;
        const indice_5 = `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} grados`;
        const indicesGenerados = [indice_1, indice_2, indice_3, indice_4, indice_5];
        setIndices(indicesGenerados);
        const coloresGenerados = ['blue', '#00BFFF', 'white', 'yellow', 'red'];
        setColores(coloresGenerados);
        return indicesGenerados;
      }
      else if(units === 'mm/day'){//actualizar a una unidad correcta cuando sea necesario
        
        const indice_1 = `0 - ${nivel_1.toFixed(2)} mm/dia`;
        const indice_2 = `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} mm/día`;
        const indice_3 = `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} mm/día`;
        const indice_4 = `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} mm/día`;
        const indice_5 = `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} mm/día`;
        const indicesGenerados = [indice_1, indice_2, indice_3, indice_4, indice_5];
        setIndices(indicesGenerados);
        const coloresGenerados = ['blue', '#00BFFF', 'white', 'yellow', 'red'];
        setColores(coloresGenerados);
        return indicesGenerados;
      }else{
        const indice_1 = `0 - ${nivel_1.toFixed(2)} ${units}`;
        const indice_2 = `${nivel_1.toFixed(2)} - ${nivel_2.toFixed(2)} ${units}`;
        const indice_3 = `${nivel_2.toFixed(2)} - ${nivel_3.toFixed(2)} ${units}`;
        const indice_4 = `${nivel_3.toFixed(2)} - ${nivel_4.toFixed(2)} ${units}`;
        const indice_5 = `${nivel_4.toFixed(2)} - ${nivel_5.toFixed(2)} ${units}`;
        const indicesGenerados = [indice_1, indice_2, indice_3, indice_4, indice_5];
        setIndices(indicesGenerados);
        const coloresGenerados = ['blue', '#00BFFF', 'white', 'yellow', 'red'];
        setColores(coloresGenerados);
        return indicesGenerados;
      }
    
      
    


      
    }
    else{
        setIndices([
            ``,
            ``,
            ``,
            ``,
            ``
        ]);
        const coloresGenerados = ['blue', '#00BFFF', 'white', 'yellow', 'red'];
        setColores(coloresGenerados);
    }
  };
  
  //Se utiliza en el boton que habilita botones para cargar el archivo y setear todo en 0
  const borrarArchivos = () => {
    axios.delete('/api/borrar-archivos-indicerh')
      .then(response => {
        console.log('Archivos eliminados:', response.data);
        setCoordenadas([]);
        setValores([]);
        setFileConfirmed(false);
        setMapaActualizado(true);
        setIndices([
            ``,
            ``,
            ``,
            ``,
            ``
          ]);
        setMostrarBarraColores(true);
        setResultado([]);
        setih_max([]);
        setBotonCargarTiempoHabilitado(false);
        setMaxTiempo([]);
        setValue('tiempo', '');
        
      })
      .catch(error => {
        console.error('Error al borrar los archivos:', error);
      });
  };

  const limpiarMapa = () => {
    setCoordenadas([]);
    setValores([]);
    setResultado([]);
    setMapaActualizado(true);
    setBotonCargarTiempoHabilitado(true);
    setBotonLimpiarHabilitado(false);
    setValue('tiempo', '');

    setIndices([
      ``,
      ``,
      ``,
      ``,
      ``
    ]);
  
    
  

    setMostrarBarraColores(true);
    setih_max(null);
    console.log(resultado.result);
    console.log("mapa limpiado");
  };

  const cargarTiempo = () =>{
    setBotonLimpiarHabilitado(true);
  };

  
   

  useEffect(() => {
    if (mapaActualizado) {
      setCoordenadas([]);
      setValores([]);
      //setMapaActualizado(false);
      console.log('Mapa actualizado');
         
    }
  }, [mapaActualizado]);

  useEffect(() => {
    // Establecer un tiempo de vida para la alerta de archivo (ejemplo: 5 segundos)
    const timeoutArchivo = setTimeout(() => {
      setMostrarAlertaArchivo(false); // Cerrar la alerta automáticamente después de 5 segundos
    }, 5000);
  
    // Establecer un tiempo de vida para la alerta de tiempo (ejemplo: 5 segundos)
    const timeoutTiempo = setTimeout(() => {
      setMostrarAlertaTiempo(false); // Cerrar la alerta automáticamente después de 5 segundos
    }, 5000);
  
    return () => {
      clearTimeout(timeoutArchivo); // Limpiar el temporizador de la alerta de archivo cuando el componente se desmonte
      clearTimeout(timeoutTiempo); // Limpiar el temporizador de la alerta de tiempo cuando el componente se desmonte
    };
  }, [mostrarAlertaArchivo, mostrarAlertaTiempo]);
  

  const circleMarkers = pintarMapa();

  return (
    <div className="formulario-container">
      {/* Header */}
      <header className='header'>
        <h1 className="formulario-title">Visualización de índices de riesgo hídrico</h1>
      </header>
      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="archivoInput"></label>
        <input
          id="archivoInput"
          className="formulario-input"
          type="file"
          accept=".nc"
          capture="environment"
          onChange={handleFileChange}
          disabled={buttonsDisabled}
        />
        

        <button
          className="formulario-button"
          type="button"
          onClick={enviarArchivo}
          disabled={buttonsDisabled} // Deshabilitar el botón de confirmar archivo
        >
          Confirmar archivo
        </button>


        <div className="error-message">
      {mostrarAlertaArchivo  && (
        <Alert variant={tipoMensaje} onClose={() => setMostrarAlertaArchivo(false)} >
          {mensaje}
        </Alert>
      )}
      </div>


          {fileConfirmed && enableButton && (
            <button
              className="formulario-button"
              type="button"
              onClick={() => {
                setButtonsDisabled(false); // Habilitar los botones de archivo
                setEnableButton(false); // Deshabilitar el botón para habilitar los botones de archivo
                borrarArchivos(); // Llamar a la función para borrar los archivos
                
              }}
              //Habilitar botones
            >
              Cargar nuevo archivo
            </button>
          )}
        <label className="formulario-label">
          {loading ? (
            <span style={{ color: 'red' }}>Cargando archivo...</span>
          ) : (
            fileConfirmed ? (
              <span style={{ color: 'green' }}>Archivo recibido</span>
            ) : (
              <span style={{ color: 'blue' }}>Seleccione y confirme un archivo</span>
            )
          )}
        </label>
    </div>

    <div>
      <input className="formulario-input" type="text" {...register("tiempo")} onChange={(e) => setValue("tiempo", e.target.value)} disabled={!botonCargarTiempoHabilitado} />
      <button className="formulario-button" type="submit" onClick={cargarTiempo} disabled={!botonCargarTiempoHabilitado}>Cargar tiempo</button>
      <div className="error-message">
      {mostrarAlertaTiempo && (
        <Alert variant={tipoMensaje} onClose={() => setMostrarAlertaTiempo(false)} >
          {mensaje}
        </Alert>
      )}
      </div>
      <button className="formulario-button" type="button" onClick={limpiarMapa} disabled={!botonLimpiarHabilitado}>Limpiar Mapa</button>
      <label className="formulario-label">Tiempo: {resultado && resultado.result}</label>
      </div>
        <div className="map-container" style={{width: '100%'}}>
          <MapContainer
            center={[0, 0]}
            zoom={2}
            maxBounds={[
              [-90, -180],
              [90, 180]
            ]}
            maxBoundsViscosity={1.0}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="Map data © OpenStreetMap contributors"
              minZoom={2}
              maxZoom={10}
            />
            
            {coordenadas.length > 0  && circleMarkers}
            
          </MapContainer>
        </div>
      </form>
    {mostrarBarraColores && ( 
      <div className="barra-container">
        <div className="barra-referencia">
          {indices.map((indice, index) => (
          <div className="rango" key={index}>
          <div className="color" style={{ backgroundColor: colores[index] }}></div>
          <span>{indice}</span>
        </div>
          ))}
      </div>

      </div>
    )}
      
      {/* Footer */}
      <footer className='footer'>
        <p>Nombre: Joaquin Alonso Bustos Torres.</p>
        <p>Profesor guía: Clemente Rubio Manzano.</p>
      </footer>

    </div>
  ); 
};

export default IndicesRH;