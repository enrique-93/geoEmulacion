var shuffle = function(esto) {
    var i = esto.length,
        j, temp;
    if (i == 0) return esto;
    while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        temp = esto[i];
        esto[i] = esto[j];
        esto[j] = temp;
    }
    return esto;
}

//Datos por defecto para la simulacion
var config = {

    //Latitud y longitud de la torre latinoamericana
    centro: {
        lat: 19.4338363,
        lng: -99.1405492
    },

    radio: 3200,
    radioMinimo: 1000,
    lugaresMinimos: 20,
    conductores: 10,
    usuarios: 5,
    zoom: 13
}

var mapa,
    loader,
    circulo,
    error,
    gente,
    guardar,
    mServ,
    dServ,
    boton,
    guardarDatosBoton,
    marcadores = [],
    conductores = [],
    usuarios = [],
    dataObjetos = {
        conductores: {},
        usuarios: {}
    }

$().ready(function() {
    loader = $('.loader');
    boton = $('.boton');

    boton.click(function() {
        $('.emulacion.area_simulacion').toggleClass('maximizado');
        google.maps.event.trigger(mapa, "resize");
        mapa.panTo(config.centro);
        if ($('.emulacion.area_simulacion').is('.maximizado'))
            boton.html('Minimizar <i class="min"></i>')
        else
            boton.html('Maximizar <i class="min"></i>')
    });

});



// Funcion que invoka la API de Mapas de Google al cargarse
function iniciarMapa() {
    mapa = new google.maps.Map($('#mapa').get(0), {
        zoom: config.zoom,
        center: config.centro
    });

    mServ = new google.maps.DistanceMatrixService();
    dServ = new google.maps.DirectionsService();

    obtenerDatosIniciales();
}


function configurarMapa() {

    mapa.setZoom(config.zoom);
    mapa.setCenter(config.centro);

    config.lugares = shuffle(config.lugares);

    $.ajax({
        url: 'https://randomuser.me/api/?results='+(config.usuarios+config.conductores)+'&nat=es',
        dataType: 'json',
        success: function(data) {
            gente = data;
            setMarkers(mapa);
            drawPaths();
        }
    });
    

}

//Consulta la configuracion inicial guardada en el server
function obtenerDatosIniciales() {
    var intentos = 0;

    function preinicio() {
        intentos++;
        if (intentos == 2)
            configurarMapa();
    }

    $.getJSON('json/mapa.json', function(data) {
        console.log(data)
        if (data.centro)
            config.centro = data.centro;
        if (data.radio)
            config.radio = data.radio;
        if (data.zoom)
            config.zoom = data.zoom;
        config.lugares = data.lugares;
        preinicio();
    }).fail(function() {
        preinicio();
    });

    $.getJSON('json/datos.json', function(data) {
        if (data.conductores)
            config.conductores = data.conductores;
        if (data.usuarios)
            config.usuarios = data.usuarios;
        preinicio();
    }).fail(function() {
        preinicio();
    });
}

function borrarMarcadores() {
    for (var a = 0; a < marcadores.length; a++) {
        marcadores[a].setMap(null)
    }

    marcadores = [];
}

function drawPaths() {

    var origenes = [];
    var destinos = [];



    for(var i=0;i<Math.max(conductores.length,usuarios.length);i++){
        if(i<conductores.length)
            origenes.push(conductores[i].getPosition())
        if(i<usuarios.length)
            destinos.push(usuarios[i].getPosition());
    }



    mServ.getDistanceMatrix({
        origins: origenes,
        destinations: destinos,
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: true
    }, function(res, status) {

        var texto = $('.relacion .invisible').html();

        for(var a in res.rows){
            var conductor=dataObjetos.conductores[a],
                row = res.rows[a].elements,
                min = Infinity,
                pos = -1;

            for(var b in row){
                if(row[b].duration.value<min){
                    min = row[b].duration.value;
                    pos = b;
                }
            }

            conductor.viaje = row[pos];
            conductor.usuario = pos;

            $('.relacion').append(
                texto.replace(/\$id/gi,a)
                    .replace(/\$srcC/,conductor.info.picture.medium)
                    .replace(/\$srcUser/gi,dataObjetos.usuarios[pos].info.picture.medium)
                    .replace(/\$nombreC/g,conductor.info.name.first+' '+conductor.info.name.last)
                    .replace(/\$nombreUser/gi,dataObjetos.usuarios[pos].info.name.first+' '+dataObjetos.usuarios[pos].info.name.last)
                    .replace(/\$distancia/gi,conductor.viaje.distance.value)
                    .replace(/\$tiempo/gi,conductor.viaje.duration.value)
                );

            $('.relacion .tabla-fila[rel='+a+'] .rutainfo').css('background-color',conductor.color);

            encontrarRutaConductor(conductor,a);
        }

        
        
    });

    for(var e in usuarios){
            encontrarRutaUsuario(dataObjetos.usuarios[e],e);
        }
}

function encontrarRutaConductor(conductor,i){
    dServ.route({
        origin: conductor.destino,
        destination: usuarios[conductor.usuario].getPosition(),
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: true,
        waypoints:[{
            location: conductor.marcador.getPosition(),
            stopover: true
        }]
    },function(result){

        var polylineOptionsActual = new google.maps.Polyline({
            strokeColor: conductor.color,
            strokeOpacity: .8,
            strokeWeight: 10+(Math.random()*10)-5
        });

        conductor.ruta = obtenerPuntos(result,0).reverse();
        conductor.rutaCliente = obtenerPuntos(result,1);

        conductor.rutaCliente.unshift(conductor.marcador.getPosition());
        conductor.rutaCliente.push(usuarios[conductor.usuario].getPosition());

        conductor.ruta.unshift(conductor.marcador.getPosition());
        conductor.ruta.push(conductor.destino);

        conductor.rastro = [];

        conductor.lineaCliente = new google.maps.Polyline({
            path:conductor.rutaCliente,
            geodesic: true,
            strokeColor: conductor.color,
            strokeOpacity: .8,
            strokeWeight: 10+(Math.random()*4)-2
        });

        conductor.linea = new google.maps.Polyline({
            path:conductor.rastro,
            geodesic: true,
            strokeColor: conductor.color,
            strokeOpacity: .8,
            strokeWeight: 10+(Math.random()*4)-2
        });


        conductor.lineaCliente.setMap(mapa);
        conductor.linea.setMap(mapa);
    });

}

function encontrarRutaUsuario(usuario,i){
    dServ.route({
        origin: usuario.marcador.getPosition(),
        destination: usuario.destino,
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: true,
        waypoints : usuario.destinos
    },function(result){

        var polylineOptionsActual = new google.maps.Polyline({
            strokeColor: usuario.color,
            strokeOpacity: .8,
            strokeWeight: 10+(Math.random()*10)-5
        });

        usuario.ruta = [];
        if(!result.routes[0])
            console.log(result);
        else{
            for(var a in result.routes[0].leg){
                usuario.ruta.join()+','+obtenerPuntos(result,a);
            }
        }

        //usuario.ruta.unshift(usuario.marcador.getPosition());
        //usuario.ruta.push(usuario.destino);
        usuario.rastro = [];


        usuario.linea = new google.maps.Polyline({
            path : usuario.ruta,
            geodesic: true,
            strokeColor: usuario.color,
            //strokeOpacity: .4,
            //strokeWeight: 7+(Math.random()*4)-2,
            icons: [{
              icon: lineSymbol = {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: .4,
                  scale: 4
                },
              offset: '0',
              repeat: '20px'
            }]
        });

        usuario.linea.setMap(mapa);
    });
}

function obtenerPuntos(direccion,leg,close){
    var dir = {}
    var direcciones = [];
    for(var a in direccion.routes[0].legs[leg].steps){
      var step = direccion.routes[0].legs[leg].steps;
      for(var i in step){
        for(var t in step[i].lat_lngs){
         var pos = step[i].lat_lngs[t];
         if(dir[pos.lat()+'_'+pos.lng()]&&!close)
            continue;
         dir[pos.lat()+'_'+pos.lng()] = 1
         direcciones.push(pos)
        }
      }
    }

    return direcciones;
}

function setMarkers(map) {

    borrarMarcadores();

    var image_user = {
        url: 'img/flag_user.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
    };

    var image_conductor = {
        url: 'img/flag.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
    };


    for (var i = 0; i < config.conductores + config.usuarios; i++) {
        var bounds = new google.maps.LatLngBounds();
        var marcador = config.lugares[i % config.lugares.length];
        var marker = new google.maps.Marker({
            position: {
                lat: marcador.geometry.location.lat,
                lng: marcador.geometry.location.lng
            },
            map: map,
            icon: (i < config.usuarios && image_user || image_conductor),
            title: 'Punto ' + (i + 1)
        });

        var data = {
            marcador: marker,
            rutaCliente: null,
            ruta: null,
            color: 'rgb(' + rand255() + ',' + rand255() + ',' + rand255() + ')',
            tiempo: 0,
            destino: marcador,
            cliente: null,
            info: gente.results[i]
        };

        while(data.destino == marcador) {
            data.destino = config.lugares[Math.floor(Math.random() * config.lugares.length)]
        }

        data.destino = {
            lat: data.destino.geometry.location.lat,
            lng: data.destino.geometry.location.lng
        }

        if (i < config.usuarios) {
            usuarios.push(marker);
            dataObjetos.usuarios[i] = data;

            
            data.destinos = [];

            var selected={};

            selected[marcador.geometry.location.lat+'_'+marcador.geometry.location.lng] = 1;

            for(var a=0; a<9;a++){
                var todj = config.lugares[Math.floor(Math.random()*config.lugares.length)];
                while(selected[todj.geometry.location.lat+'_'+todj.geometry.location.lng]){
                     todj = config.lugares[Math.floor(Math.random()*config.lugares.length)];
                }

                selected[todj.geometry.location.lat+'_'+todj.geometry.location.lng] = 1;

                if(a<8){
                    data.destinos.push({
                        location:{
                            lat: todj.geometry.location.lat,
                            lng: todj.geometry.location.lng
                        },
                        stopover: false
                    });
                }else{
                    data.destino = {
                        lat: todj.geometry.location.lat,
                        lng: todj.geometry.location.lng
                    }
                }
            }
        } else {
            conductores.push(marker);
            dataObjetos.conductores[i-config.usuarios] = data;
        }

        bounds.extend(marker.getPosition());
        marcadores.push(marker);


    }
    //map.fitBounds(bounds);
}

function rand255() {
    return Math.round(Math.random() * 255);
}
