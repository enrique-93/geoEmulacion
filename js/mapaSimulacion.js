Array.prototype.shuffle = function() {
    var i = this.length,
        j, temp;
    if (i == 0) return this;
    while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }
    return this;
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
    service,
    loader,
    circulo,
    error,
    guardar,
    boton,
    guardarDatosBoton,
    marcadores = [],
    conductores,
    usuarios;

$().ready(function() {
    loader = $('.loader');
    boton = $('.boton');

    boton.click(function(){
        $('.emulacion.area_simulacion').toggleClass('maximizado');
        google.maps.event.trigger(mapa, "resize");
        mapa.panTo(config.centro);
        if($('.emulacion.area_simulacion').is('.maximizado'))
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

    service = new google.maps.places.PlacesService(mapa)

    obtenerDatosIniciales();
}


function configurarMapa() {

    mapa.setZoom(config.zoom);
    mapa.setCenter(config.centro);

    config.lugares.shuffle();

    setMarkers(mapa);

}

//Consulta la configuracion inicial guardada en el server
function obtenerDatosIniciales() {
    var intentos = 0;
    function preinicio(){
        intentos++;
        if(intentos==2)
            configurarMapa();
    }

    $.getJSON('json/mapa.json',function(data){
        console.log(data)
        if(data.centro)
            config.centro = data.centro;
        if(data.radio)
            config.radio = data.radio;
        if(data.zoom)
            config.zoom = data.zoom;
        config.lugares = data.lugares;
        preinicio();
    }).fail(function(){
        preinicio();
    });

    $.getJSON('json/datos.json',function(data){
        if(data.conductores)
            config.conductores = data.conductores;
        if(data.usuarios)
            config.usuarios = data.usuarios;
        preinicio();
    }).fail(function(){
        preinicio();
    });
}

function borrarMarcadores() {
    for (var a = 0; a < marcadores.length; a++) {
        marcadores[a].setMap(null)
    }

    marcadores = [];
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

        bounds.extend(marker.getPosition());
        marcadores.push(marker);

        (function(marker){

            function toggleBounce() {
              if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
              } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
              }
            }

            marker.addListener('click', toggleBounce);
        })(marker);
    }
    //map.fitBounds(bounds);
}
