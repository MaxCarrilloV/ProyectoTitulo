import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert, Modal, ModalBody } from "react-bootstrap";
import { MapContainer, TileLayer } from "react-leaflet";
import TControl from "./TControl";
import GeoTiffMap from "./GeoTiffMap";
import "./Formulario.css";
import Menu from "./Menu";

const Temperaturas = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileConfirmed, setFileConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [enableButton, setEnableButton] = useState(false);
  const [tipoMensaje, setTipoMensaje] = useState("danger");
  const [mostrarAlertaArchivo, setMostrarAlertaArchivo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();
  const [coordenadas, setCoordenadas] = useState([]);
  const [mapaActualizado, setMapaActualizado] = useState(false);
  const [mostrarAlertaTiempo, setMostrarAlertaTiempo] = useState(false);
  const [t_max, setT_max] = useState([]);
  const [Calendario, setCalendario] = useState(false);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [units, setUnits] = useState();
  const [nombreLargo, setnombreLargo] = useState();
  const [t_min, setT_min] = useState([]);
  const [tVariable, setTVariable] = useState("");
  const [lonVariable, setLonVariable] = useState("");
  const [latVariable, setLatVariable] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Obtener el sessionId de las cookies y configurarlo en el encabezado de la solicitud
    axios.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get(
      "sessionId"
    )}`;
    setTipoMensaje("info");
    setMensaje("Cargando datos preseteados");
    setMostrarAlertaArchivo(true);

    const presetearArchivo = async () => {
      axios
        .get("/api/preset-temperatura",{
          headers: {
            Authorization: `Bearer ${Cookies.get("sessionId")}`,
          },
        })
        .then(response => {
          setButtonsDisabled(true);
          setMensaje("Archivo recibido con éxito");
            console.log(response.data);
            setMostrarAlertaArchivo(true);
            setTipoMensaje("info");
            setLoading(false);
            setFileConfirmed(true);
            setMapaActualizado(true);
            setEnableButton(true);
            setValue("archivo", selectedFileName);
            setT_max(response.data.mapa.t_max);
            setCoordenadas(response.data.mapa.file);
            setCalendario(true);
            setUnits(response.data.mapa.units);
            setT_min(response.data.mapa.t_min);
            setTVariable('tmax');
            setLonVariable('lon');
            setLatVariable('lat');
            setnombreLargo(response.data.mapa.nombre_largo);
            if (
              response.data.mapa.nombre_largo === "Daily maximum temperature"
            ) {
              setnombreLargo("diaria máxima");
              setUnits("Celsius/day");
            } else {
              if (
                response.data.mapa.nombre_largo === "Daily minimum temperature"
              ) {
                setnombreLargo("diaria mínima");
                setUnits("Celsius/day");
              }
            }
            if (response.data.mapa.nombre_largo === "2 meter temperature") {
              setnombreLargo("2 metros");
              setUnits("Celsius");
            }
            if (
              response.data.mapa.time.includes("seconds") ||
              response.data.mapa.time.includes("day")
            ) {
              setUnits("Celsius/day");
            }
            if (
              response.data.mapa.available_dates.length > 0 &&
              (response.data.mapa.nombre_largo ===
                "mean daily maximum temperature" ||
                response.data.mapa.nombre_largo ===
                  "mean daily minimum temperature" ||
                response.data.mapa.nombre_largo ===
                  "daily mean 2-meter temperature")
            ) {
              for (
                let i = 0;
                i < response.data.mapa.available_dates.length;
                i++
              ) {
                const date = new Date(response.data.mapa.available_dates[i]);
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear();
                response.data.mapa.available_dates[i] = `${year}-${month}`;
              }
              setDates(response.data.mapa.available_dates);

              const date = new Date(response.data.mapa.available_dates[1]);
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const year = date.getFullYear();
              setSelectedDate(`${year}-${month}`);
            } else {
              setDates(response.data.mapa.available_dates);
              setSelectedDate(response.data.mapa.available_dates[0]);
            }
            if (
              response.data.mapa.available_dates ===
              "No time variable available"
            ) {
              setDates([]);
            }
        })
    }
    presetearArchivo();
  }, []);

  const handleOpenModal = () => setShowModal(true); 
  const handleCloseModal = () => setShowModal(false);

  const { handleSubmit, setValue } = useForm();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".nc")) {
      setSelectedFile(file);
      setSelectedFileName(file.name); // Establecer el nombre del archivo seleccionado
    } else {
      setSelectedFile(null);
      setSelectedFileName(""); // Reiniciar el nombre del archivo seleccionado
      console.log("Error: Debes seleccionar un archivo con extensión .nc");
    }
  };

  const borrarArchivos = () => {
    axios
      .delete("/api/borrar-archivos-temperatura")
      .then((response) => {
        console.log("Archivos eliminados:", response.data);
        setCoordenadas([]);
        setFileConfirmed(false);
        setDates([]);
        setSelectedDate();
        setUnits();
        setCalendario(false);
        setT_max([]);
        setT_min([]);
        setnombreLargo();
        setTVariable("");
        setLonVariable("");
        setLatVariable("");
      })
      .catch((error) => {
        console.error("Error al borrar los archivos:", error);
      });
  };

  const enviarArchivo = async () => {
    const Cookie = Cookies.get("sessionId");
    //con esto en caso de sesion expirada enviamos al usuario al inicio
    if (!Cookie) {
      // La sesión ha expirado, redirigir al usuario a pagina de inicio de sesion
      const error = "usuario_expirado";
      Cookies.set("sessionId", error);
      console.log(Cookies.get("sessionId"));
      navigate("/");
    }
    // Verificar que las variables no estén vacías, no contengan espacios y no sean números
    const validateVariable = (variable) => {
      const hasSpaces = /\s/.test(variable);
      const isNumber = /^\d+$/.test(variable);
      return variable && !hasSpaces && !isNumber;
    };

    if (!validateVariable(tVariable)) {
      setMensaje("Nombre de la variable de precipitación inválido");
      setMostrarAlertaArchivo(true);
      setTipoMensaje("danger");
      return;
    }

    if (!validateVariable(lonVariable)) {
      setMensaje("Nombre de la variable de longitud inválido");
      setMostrarAlertaArchivo(true);
      setTipoMensaje("danger");
      return;
    }

    if (!validateVariable(latVariable)) {
      setMensaje("Nombre de la variable de latitud inválido");
      setMostrarAlertaArchivo(true);
      setTipoMensaje("danger");
      return;
    }
    if (selectedFile) {
      const formData = new FormData();
      formData.append("archivo", selectedFile);
      formData.append("t_variable", tVariable);
      formData.append("lon_variable", lonVariable);
      formData.append("lat_variable", latVariable);
      console.log(Cookies.get());
      setLoading(true); // Mostrar el mensaje de "Cargando archivo"
      setButtonsDisabled(true);
      axios
        .post("/api/subir-archivo-temperatura", formData, {
          headers: {
            Authorization: `Bearer ${Cookies.get("sessionId")}`,
          },
        })
        .then((response) => {
          const IsExito = response.data.mapa.mensaje;
          if (
            IsExito ===
            "variable incorrecta, porfavor carge un archivo netcdf de temperatura"
          ) {
            setMensaje(
              "Servidor: Variable incorrecta, por favor carga un archivo netcdf con una variable de tmin - tmax - t2m"
            );
            setMostrarAlertaArchivo(true);
            setTipoMensaje("danger");
            setLoading(false);
            setButtonsDisabled(false);
          } else {
            setMensaje("Archivo recibido con éxito");
            console.log(response.data);
            setMostrarAlertaArchivo(true);
            setTipoMensaje("info");
            setLoading(false);
            setFileConfirmed(true);
            setMapaActualizado(true);
            setEnableButton(true);
            setValue("archivo", selectedFileName);
            setT_max(response.data.mapa.t_max);
            setCoordenadas(response.data.mapa.file);
            setCalendario(true);
            setUnits(response.data.mapa.units);
            setT_min(response.data.mapa.t_min);
            setnombreLargo(response.data.mapa.nombre_largo);
            handleCloseModal();
            if (
              response.data.mapa.nombre_largo === "Daily maximum temperature"
            ) {
              setnombreLargo("diaria máxima");
              setUnits("Celsius/day");
            } else {
              if (
                response.data.mapa.nombre_largo === "Daily minimum temperature"
              ) {
                setnombreLargo("diaria mínima");
                setUnits("Celsius/day");
              }
            }
            if (response.data.mapa.nombre_largo === "2 meter temperature") {
              setnombreLargo("2 metros");
              setUnits("Celsius");
            }
            if (
              response.data.mapa.time.includes("seconds") ||
              response.data.mapa.time.includes("day")
            ) {
              setUnits("Celsius/day");
            }
            if (
              response.data.mapa.available_dates.length > 0 &&
              (response.data.mapa.nombre_largo ===
                "mean daily maximum temperature" ||
                response.data.mapa.nombre_largo ===
                  "mean daily minimum temperature" ||
                response.data.mapa.nombre_largo ===
                  "daily mean 2-meter temperature")
            ) {
              for (
                let i = 0;
                i < response.data.mapa.available_dates.length;
                i++
              ) {
                const date = new Date(response.data.mapa.available_dates[i]);
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear();
                response.data.mapa.available_dates[i] = `${year}-${month}`;
              }
              setDates(response.data.mapa.available_dates);

              const date = new Date(response.data.mapa.available_dates[1]);
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const year = date.getFullYear();
              setSelectedDate(`${year}-${month}`);
            } else {
              setDates(response.data.mapa.available_dates);
              setSelectedDate(response.data.mapa.available_dates[0]);
            }
            if (
              response.data.mapa.available_dates ===
              "No time variable available"
            ) {
              setDates([]);
            }

          }
        })
        .catch((error) => {
          console.log("Error al enviar el archivo al backend:", error);
          setLoading(false); // Cambiar el mensaje a "Archivo cargado" incluso en caso de error
          setButtonsDisabled(false); // Habilitar el botón para habilitar los botones de archivo
        });
    }
  };
  useEffect(() => {
    if (mapaActualizado) {
      console.log("Mapa actualizado");
    }
  }, [mapaActualizado]);

  useEffect(() => {
    if (nombreLargo === "mean daily maximum temperature") {
      setnombreLargo("mensual máxima");
    } else {
      if (nombreLargo === "mean daily minimum temperature") {
        setnombreLargo("mensual mínima");
      }
    }
    if (nombreLargo === "daily mean 2-meter temperature") {
      setnombreLargo("2 metros media");
    }
  }, [nombreLargo]);

  useEffect(() => {
    // Establecer un tiempo de vida para la alerta de archivo (ejemplo: 5 segundos)
    const timeoutArchivo = setTimeout(() => {
      setMostrarAlertaArchivo(false);
    }, 5000);

    // Establecer un tiempo de vida para la alerta de tiempo (ejemplo: 5 segundos)
    const timeoutTiempo = setTimeout(() => {
      setMostrarAlertaTiempo(false);
    }, 5000);

    return () => {
      clearTimeout(timeoutArchivo);
      clearTimeout(timeoutTiempo);
    };
  }, [mostrarAlertaArchivo, mostrarAlertaTiempo]);

  const onSubmit = async (data) => {
    const Cookie = Cookies.get("sessionId");
    //con esto en caso de sesion expirada enviamos al usuario al inicio
    if (!Cookie) {
      // La sesión ha expirado, redirigir al usuario a pagina de inicio de sesion
      const error = "usuario_expirado";
      Cookies.set("sessionId", error);
      console.log(Cookies.get("sessionId"));
      navigate("/");
    }
    if (fileConfirmed) {
      let tiempo;
      if (data < dates[0] || data > dates[dates.length - 1]) {
        setMensaje("Servidor: Fecha no disponible, seleccione otra fecha");
        setMostrarAlertaTiempo(true);
        setTipoMensaje("danger");
        return;
      }
      for (let i = 0; i < dates.length; i++) {
        if (dates[i] === data) {
          tiempo = i;
        }
      }
      tiempo = tiempo + 1;
      console.log(tiempo);
      //corrobar que el tiempo este dentro de los valores permitidos
      if (tiempo > dates.length || tiempo < 1) {
        setMensaje("Servidor: Tiempo no disponible, seleccione otro tiempo");
        setMostrarAlertaTiempo(true);
        setTipoMensaje("danger");
        return;
      }
      tiempo = tiempo + 1;
      axios
        .post("/api/enviar-tiempo-temperatura", {
          tiempo: tiempo,
          t_variable: tVariable,
          lon_variable: lonVariable,
          lat_variable: latVariable,
        })
        .then((response) => {
          console.log(response.data);

          setTipoMensaje("info");
          setLoading(false);
          setFileConfirmed(true);
          setMapaActualizado(true);
          setEnableButton(true);
          setT_max(response.data.mapa.t_max);
          setCoordenadas(response.data.mapa.file);
          setCalendario(true);
          handleCloseModal();
        })
        .catch((error) => {
          console.log("Error al enviar el tiempo al backend:", error);
        });
    }
  };

  const handleDateChange = (e) => {
    setCoordenadas([]);
    setTipoMensaje("info");
    setMensaje("Servidor: Espere a que cargue el mapa por completo.");
    setMostrarAlertaTiempo(true);
    setSelectedDate(e.target.value);
    onSubmit(e.target.value);
  };

  const handletext = (e) => {
    const validKeys = /^[a-zA-Z\s\b_-]+$/;

    if (
      !validKeys.test(e.key) &&
      !["ArrowRight", "ArrowLeft"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <div className="d-flex">
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Subir Archivo NETCDF de temperatura</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form
              onSubmit={handleSubmit(onSubmit)}
              encType="multipart/form-data"
            >
              <Form.Group>
                <Form.Control
                  id="archivoInput"
                  className="my-3"
                  type="file"
                  accept=".nc"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={buttonsDisabled}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  id="prVariableInput"
                  className="my-3"
                  type="text"
                  value={tVariable}
                  placeholder="Nombre de la variable de temperatura"
                  onKeyDown={handletext}
                  onChange={(e) => setTVariable(e.target.value)}
                  disabled={buttonsDisabled}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  id="lonVariableInput"
                  className="my-3"
                  type="text"
                  value={lonVariable}
                  placeholder="Nombre de la variable de longitud"
                  onKeyDown={handletext}
                  onChange={(e) => setLonVariable(e.target.value)}
                  disabled={buttonsDisabled}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  id="latVariableInput"
                  className="my-3"
                  type="text"
                  value={latVariable}
                  placeholder="Nombre de la variable de latitud"
                  onKeyDown={handletext}
                  onChange={(e) => setLatVariable(e.target.value)}
                  disabled={buttonsDisabled}
                />
              </Form.Group>

              <Button
                className="my-3"
                type="button"
                onClick={enviarArchivo}
                disabled={buttonsDisabled} // Deshabilitar el botón de confirmar archivo
              >
                Confirmar archivo
              </Button>

              {fileConfirmed && enableButton && (
                <Button
                  className="my-3 mx-1"
                  type="button"
                  onClick={() => {
                    setButtonsDisabled(false); // Habilitar los botones de archivo
                    setEnableButton(false); // Deshabilitar el botón para habilitar los botones de archivo
                    borrarArchivos(); // Llamar a la función para borrar los archivos
                  }}
                  //Habilitar botones
                >
                  Cargar nuevo archivo
                </Button>
              )}
              <label className="formulario-label">
                {loading ? (
                  <span style={{ color: "red" }}>Cargando archivo...</span>
                ) : fileConfirmed ? (
                  <span style={{ color: "green" }}>Archivo recibido</span>
                ) : (
                  <span style={{ color: "blue" }}>
                    Seleccione y confirme un archivo
                  </span>
                )}
              </label>
              {dates.length > 0 && units === "Celsius" && (
                <Form.Group>
                  <Form.Control
                    className="my-3"
                    value={selectedDate}
                    min={dates[0]}
                    max={dates[dates.length - 1]}
                    type="month"
                    disabled={!Calendario}
                    onChange={handleDateChange}
                  />
                </Form.Group>
              )}
              {dates.length > 0 &&
                (units === "Celsius/day" || units === "unknown") && (
                  <Form.Group>
                    <Form.Control
                      className="my-3"
                      value={selectedDate}
                      min={dates[0]}
                      max={dates[dates.length - 1]}
                      type="date"
                      disabled={!Calendario}
                      onChange={handleDateChange}
                    />
                  </Form.Group>
                )}

              {dates.length <= 0 && (
                <Form.Group>
                  <Form.Control
                    className="my-3"
                    type="date"
                    disabled={!Calendario}
                  />
                </Form.Group>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
        <div style={{
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, 
            width: "80%", 
            maxWidth: "500px", 
          }}  className="error-message">
          {mostrarAlertaArchivo && (
            <Alert dismissible
              variant={tipoMensaje}
              onClose={() => setMostrarAlertaArchivo(false)}
            >
              {mensaje}
            </Alert>
          )}
        </div>
        <div style={{
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, 
            width: "80%",
            maxWidth: "500px",
          }}  className="error-message">
          {mostrarAlertaTiempo && (
            <Alert dismissible
              variant={tipoMensaje}
              onClose={() => setMostrarAlertaTiempo(false)}
            >
              {mensaje}
            </Alert>
          )}
        </div>

        {coordenadas?.length > 0 && (
          <div
            className="map-container"
            style={{ height: "100vh", width: "100vw", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                top: 50,
                left: 0,
                height: "100%",
                zIndex: 1000,
              }}
            >
              <Menu />
            </div>
            <div
              style={{
                position: "absolute",
                top: 10,
                right: "10px",
                zIndex: 1000,
              }}
            >
              <Button onClick={handleOpenModal}>
                Cambir datos de visualización
              </Button>
            </div>
            <MapContainer
              center={[-33.4489, -70.6693]}
              zoom={3}
              minZoom={3}
              style={{ position: "absolute", width: "100vw", height: "100vh" }}
              maxBounds={[
                [-90, -180],
                [90, 180],
              ]}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={`Visualizando temperatura ${nombreLargo} de ${selectedDate} en el archivo que abarca desde ${dates[0]} hasta ${dates[dates.length - 1]}.`}
              />
              <GeoTiffMap tiffUrl={coordenadas} />

              <TControl
                t_max={t_max}
                t_min={t_min}
                units={units}
                nombre={nombreLargo}
              />
            </MapContainer>
          </div>
        )}

        {coordenadas.length <= 0 && (
          <div
            className="map-container"
            style={{ height: "100vh", width: "100vw", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                top: 50,
                left: 0,
                height: "100%",
                zIndex: 1000,
              }}
            >
              <Menu />
            </div>
            <div
              style={{
                position: "absolute",
                top: 10,
                right: "10px",
                zIndex: 1000,
              }}
            >
              <Button onClick={handleOpenModal}>
                Desea visualizar su propio archivo NETCDF
              </Button>
            </div>
            <MapContainer
              center={[-33.4489, -70.6693]}
              zoom={3}
              style={{ position: "absolute", width: "100vw", height: "100vh" }}
              maxBounds={[
                [-90, -180],
                [90, 180],
              ]}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              />
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};
export default Temperaturas;