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
    guardarDatosBoton,
    marcadores = [],
    conductores,
    usuarios;

function guardarMapa(){
    $.post('datosMapa.php',{jsondata:JSON.stringify({
        centro: config.centro,
        radio: config.radio,
        zoom: mapa.getZoom(),
        lugares: config.lugares
    })},function(res){
        if(res.code!=0){
            guardar.parent().addClass('invisible');
            alert('¡Éxito!: El área actual ahora es donde se realizarán las simulaciones.');
        }else{
            alert('Error:',res.desc);
        }
    }).fail(function(){
        alert('Error: ¡Intenta de nuevo!');
    });
}

function guardarDatos(){
    $.post('datos.php',{jsondata:JSON.stringify({
        conductores: config.conductores,
        usuarios: config.usuarios
    })},function(res){
        if(res.code!=0){
            alert('¡Éxito!: Se han establecido '+config.usuarios+' usuarios y '+config.conductores+' conductores para las simulaciones.');
        }else{
            alert('Error:',res.desc);
        }
    }).fail(function(){
        alert('Error: ¡Intenta de nuevo!');
    });
}

$().ready(function() {
    loader = $('.loader');
    error = $('.mapaerror');
    guardar =$('.guardar');
    guardarDatosBoton =$('.guardardatos');
    conductores = $('#conductores'),
    usuarios = $('#usuarios')

    guardar.click(function(){
        guardarMapa();
    });

    guardarDatosBoton.click(function(){
        guardarDatos();
    });

    usuarios.change(function(){
        config.lugares.shuffle();
       config.usuarios = +$(this).val();
       setMarkers(mapa);
    })

    conductores.change(function(){
        config.lugares.shuffle();
       config.conductores = +$(this).val();
       setMarkers(mapa);
    })
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
    conductores.val(config.conductores);
    usuarios.val(config.usuarios);

    circulo = new google.maps.Circle({
        strokeColor: '#3367d6',
        strokeOpacity: 0.8,
        editable: true,
        strokeWeight: 2,
        fillColor: '#4285f4',
        fillOpacity: 0.35,
        map: mapa,
        center: config.centro,
        radius: config.radio,
        draggable: true
    });

    function errorEnMapa(err) {
        borrarMarcadores();
        error.removeClass('invisible').find('.errortexto').text(err);
    }

    function verificarDisponibilidad(lat, lng, radio) {
        loader.removeClass('invisible');
        error.addClass('invisible');
        guardar.parent().addClass('invisible');
        service.radarSearch({
            location: circulo.getCenter(),
            radius: circulo.getRadius(),
            types: ['all']
        }, function(results, status) {
            loader.addClass('invisible');
            if (!results || results.length < config.lugaresMinimos)
                return errorEnMapa(!results && 'Ocurrio un error ' + status || 'No hay suficientes lugares en esta área');
            config.lugares = results.shuffle();

            config.centro = circulo.getCenter();

            setMarkers(mapa);
            guardar.parent().removeClass('invisible');
        })
    }

    function moverCirculo() {
        if (circulo.getRadius() < config.radioMinimo)
            circulo.setRadius(config.radioMinimo);

        mapa.panTo(circulo.getCenter());

        config.radio = circulo.getRadius();

        var coords = circulo.getCenter(),
            radio = circulo.getRadius();

        verificarDisponibilidad(coords.lat(), coords.lng(), radio);
    }

    circulo.addListener('dragend', function() {
        moverCirculo();
    });

    circulo.addListener('bounds_changed', function() {
        if (config.radio != circulo.getRadius())
            moverCirculo();
    });

    moverCirculo();
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
                lat: marcador.geometry.location.lat(),
                lng: marcador.geometry.location.lng()
            },
            map: map,
            icon: (i < config.usuarios && image_user || image_conductor),
            title: 'Punto ' + (i + 1)
        });

        bounds.extend(marcador.geometry.location);
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
