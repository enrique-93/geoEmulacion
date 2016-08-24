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
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAUumuN3izJOT09CfqIUovuYPVgym61W4M&signed_in=true&sensor=false&callback=iniciarMapa"></script>

    <!---->
</head>

<body class="emular">
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
            <div class="tabla relacion">
                <div id="$id" class="tabla-fila titulado">
                    <div class="tabla-celda userinfo">
                        Conductor
                    </div>
                    <div class="tabla-celda userinfo">
                        Usuario mas cercano
                    </div>
                    <div class="tabla-celda distanciainfo">
                        Distancia en metros
                    </div>
                    <div class="tabla-celda tiempoinfo">
                        Tiempo en segundos
                    </div>
                </div>
                <div class="invisible">
                    <div id="_$id" rel="$id" class="tabla-fila">
                        <div class="tabla-celda userinfo">
                            <div class="rutainfo"></div>
                            <img src="$srcC" /><br/>
                            $nombreC

                        </div>
                        <div class="tabla-celda userinfo">
                            <img src="$srcUser" /><br/>
                            $nombreUser
                        </div>
                        <div class="tabla-celda distanciainfo">
                            $distancia
                        </div>
                        <div class="tabla-celda tiempoinfo">
                            $tiempo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>
