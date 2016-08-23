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
        url: 'https://randomuser.me/api/?results='+(config.usuarios+config.conductores),
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
            console.log(res.rows[a])
            var conductor=dataObjetos.conductores[a],
                row = res.rows[a].elements,
                min = Infinity,
                pos = -1;

            for(var b in row){
                console.log(row[b])
                if(row[b].duration.value<min){
                    min = row[b];
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

            encontrarRutaConductor(conductor,a);
        }

        
    })
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

        console.log(result)
        conductor.ruta = new google.maps.DirectionsRenderer(/*{polylineOptions: polylineOptionsActual}*/);
        console.log(conductor.ruta)
        conductor.ruta.setMap(mapa);
        conductor.ruta.setDirections(result);
        /*function moveToStep(yourmarker,yourroute,c) {
            if (c>=0) {
                yourmarker.setLatLng(yourroute.getStep(c).getLatLng());
                window.setTimeout(function(){
                    moveToStep(yourmarker,yourroute,c-1);
                },500);
            }
        }
        moveToStep(conductor.marcador,conductor.ruta,conductor.ruta.getNumSteps())*/
    })
}

function setMarkers(map) {

    borrarMarcadores();

    var image_user = {
        url: 'img/flag_user.png',
        size: new google.maps.Size(38, 64),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(19, 64)
    };

    var image_conductor = {
        url: 'img/flag.png',
        size: new google.maps.Size(38, 64),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(19, 64)
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
