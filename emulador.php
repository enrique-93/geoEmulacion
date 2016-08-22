<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>Simulación</title>
    <link rel="stylesheet" type="text/css" href="css/estilos.css">
    <script type="text/javascript" src="js/jquery.min.js"></script>
    <script type="text/javascript" src="js/mapaSimulacion.js"></script>
    <!---->
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAUumuN3izJOT09CfqIUovuYPVgym61W4M&libraries=places&signed_in=true&callback=iniciarMapa"></script>
    <!---->
</head>

<body>
    <header>
        <div class="encabezado">
            <h1 id="encabezado">
              <i class="boton_movil"></i>
              Emulación
            </h1>
            <div class="tabla-celda inicio">
                <div class="iniciarSimulacion">
                    <div class="tabla-fila">
                      <div class="tabla-celda">
                        <a href="index.html">
                          Configurar Simulaciones
                        </a>
                      </div>
                        
                    </div>
                </div>
            </div>
        </div>
    </header>
    <div class="container">
        <div class="area_simulacion emulacion ancho">
            <h2>
            Representación Gráfica
          </h2>
            <div id="mapa" ></div>
            <div class="tabla mapa_info">
                <div class="tabla-fila changeSize ">
                    <div class="tabla-celda boton">
                        Maximizar <i class="min"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="area_configuracion">
            <h2>
            Conductores
          </h2>
            <p class="instrucciones">
                <br />
            </p>
            <div class="tabla">
                <!--<div class="tabla-fila">
                    <div class="tabla-celda info">
                        <img src="img/flag.png" />
                        <input id="conductores" type="number" value="10" min="2" max="30" step="1" /> <i>Conductores</i>
                    </div>
                </div>
                <div class="tabla-fila">
                    <div class="tabla-celda info">
                        <img src="img/flag_user.png" />
                        <input id="usuarios" type="number" value="5" min="2" max="30" step="1" /> <i>Usuarios</i>
                    </div>
                </div>
                <div class="tabla-fila center">
                    <div class="tabla-celda info guardardatos">
                        Guardar Datos
                    </div>
                </div>-->
            </div>
        </div>
    </div>
</body>

</html>
