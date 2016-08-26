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

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;

//Datos por defecto para la simulacion
var config = {

        //Latitud y longitud de la torre latinoamericana
        center: {
            lat: 19.4338363,
            lng: -99.1405492
        },

        drivers: 10,
        users: 5,
        zoom: 13
    },
    mapa,
    loader,
    error,
    people,
    mServ,
    dServ,
    boton,
    drivers = [],
    users = [],
    dataObjetos = {
        drivers: {},
        users: {}
    },
    image_user, image_driver,
    noUser = {
        name: {
            first: 'desconocido',
            last: 'x'
        },
        picture: {
            medium: 'img/nouser.png'
        }
    };

$().ready(function() {
    loader = $('.loader');
    boton = $('.boton');

    boton.click(function() {
        $('.emulacion.area_simulacion').toggleClass('maximizado');
        google.maps.event.trigger(mapa, "resize");
        mapa.panTo(config.center);
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
        center: config.center
    });

    mServ = new google.maps.DistanceMatrixService();
    dServ = new google.maps.DirectionsService();

    obtenerDatosIniciales();
}


function configurarMapa() {

    mapa.setZoom(config.zoom);
    mapa.setCenter(config.center);

    image_user = {
        url: 'img/flag_user.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
    };

    image_driver = {
        url: 'img/flag.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
    };

    config.lugares = shuffle(config.lugares);

    $.ajax({
        url: 'https://randomuser.me/api/?results=' + (config.users + config.drivers) + '&nat=es',
        dataType: 'json',
        success: function(data) {
            people = data;
            setMarkers(mapa);
            sistema.connectDriversAndUsers(true,function(){
                sistema.playing = true;
                sistema.init();
            });
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
        if (data.centro)
            config.center = data.centro;
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
            config.drivers = data.conductores;
        if (data.usuarios)
            config.users = data.usuarios;
        preinicio();
    }).fail(function() {
        preinicio();
    });
}

function getParts(googleWay, legNum, closedCircuit) {
    var dir = {}
    var parts = [];
    var totalTime = 0;
    var times = []

    var start = legNum;
    var end = legNum + 1;

    if (legNum < 0) {
        start = 0;
        end = googleWay.routes[0].legs.length
    }

    for (var leg = start; leg < end; leg++) {
        for (var a in googleWay.routes[0].legs[leg].steps) {
            var step = googleWay.routes[0].legs[leg].steps;
            for (var i in step) {
                for (var t in step[i].lat_lngs) {
                    var pos = step[i].lat_lngs[t];
                    if (dir[pos.lat() + '_' + pos.lng()] && !closedCircuit)
                        continue;
                    dir[pos.lat() + '_' + pos.lng()] = 1
                    parts.push(pos);
                    var time = step[i].duration.value;
                    times.push(time);
                    totalTime += time;
                }
            }
        }
    }

    return { path: parts, times: times, time: totalTime };
}



function setMarkers(map) {
    for (var i = 0; i < config.users; i++) {
        var inicio = config.lugares[i % config.lugares.length];

        inicio = {
            lat: inicio.geometry.location.lat,
            lng: inicio.geometry.location.lng
        }

        dataObjetos.users[i] = new User(people.results[i], inicio, mapa);
        users[i] = dataObjetos.users[i].marker;
    }
    for (var i = 0; i < config.drivers; i++) {
        var inicio = config.lugares[(config.drivers + i) % config.lugares.length];

        inicio = {
            lat: inicio.geometry.location.lat,
            lng: inicio.geometry.location.lng
        }

        dataObjetos.drivers[i] = new Driver(people.results[i + config.users], inicio, mapa);
        drivers[i] = dataObjetos.drivers[i].marker;
    }
}



function rand255() {
    return Math.round(Math.random() * 255);
}

var MapPerson = function(webInfo, start, map, mode) {

    webInfo || (webInfo = {});

    webInfo = $.extend(true, noUser, webInfo);

    this.name = webInfo.name.first + ' ' + webInfo.name.last;
    this.picture = webInfo.picture.medium;
    this.color = 'rgb(' + rand255() + ',' + rand255() + ',' + rand255() + ')';
    this.path = [];
    this.origen = start;
    this.map = map;
    this.mode = mode;
    this.projection = [];
    this.strokeWeight = 5;
    this.strokeOpacuty = .8;

    var that = this;

    this.init = function() {
        that = this;
        this.infoWindow = new google.maps.InfoWindow({
            content: '<div class="infomapa"><br/>' + '<img src="' + that.picture + '" width="60px" /><h3>' + that.name + '</h3></div>'
        });

        this.marker.addListener('click', function() {
            that.infoWindow.open(map, that.marker);
        });
    }

    this.marker = new google.maps.Marker({
        position: start,
        map: map,
        icon: (that.mode == 'user' && image_user) || image_driver,
        title: this.name
    });


    this.findRandomDestiny = function(n) {
        var destinations = [];

        n || (n = 8);

        var selected = {};

        selected[that.marker.position.lat() + '_' + that.marker.position.lng()] = 1;

        var a = 0;


        if (that.mode != 'user') {
            a = n;
            that.destiny
            destinations.push({
                location: that.marker.getPosition(),
                stopover: true
            });
        }

        for (a; a < n + 1; a++) {
            var todj = config.lugares[Math.floor(Math.random() * config.lugares.length)];
            while (selected[todj.geometry.location.lat + '_' + todj.geometry.location.lng]) {
                todj = config.lugares[Math.floor(Math.random() * config.lugares.length)];
            }

            selected[todj.geometry.location.lat + '_' + todj.geometry.location.lng] = 1;

            if (a < n) {
                destinations.push({
                    location: {
                        lat: todj.geometry.location.lat,
                        lng: todj.geometry.location.lng
                    },
                    stopover: that.mode == 'user'
                });
            } else {
                if (that.mode == 'driver')
                    that.origin = {
                        lat: todj.geometry.location.lat,
                        lng: todj.geometry.location.lng
                    }
                else
                    that.destiny = {
                        lat: todj.geometry.location.lat,
                        lng: todj.geometry.location.lng
                    }
            }
        }
        if (that.mode != 'user')
            that.destiny = that.user.marker.getPosition();
        that.destinations = destinations;
    }

    this.findWay = function(origin, cback, n) {

        n || (n = 1);
        origin || (origin = that.marker.getPosition());

        var destinations = that.destinations;

        if (that.mode != 'user') {
            origin = that.origin;
        }


        dServ.route({
            origin: origin,
            destination: that.destiny,
            travelMode: google.maps.TravelMode.WALKING,
            avoidTolls: true,
            avoidHighways: true,
            waypoints: destinations
        }, function(result) {

            var parts;

            if (!result || !result.routes[0]) {
                parts = {
                    parts: [],
                    times: [],
                    time: 0
                }
            } else {
                var legs = -1;

                if (that.mode == 'driver')
                    legs = 0;
                parts = getParts(result, legs, false);
                if (that.mode == 'driver') {
                    parts.path.reverse()
                    parts.times.reverse();

                    that.userParts = getParts(result, 1, false);
                }
            }

            that.keyParts = parts;

            if (cback && typeof cback == 'function')
                return cback(parts);
        });
    }

    this.drawLine = function() {
        that.line || (that.line = new google.maps.Polyline({
            path: (that.testMode && that.mode == 'user' && that.keyParts.path) || that.projection,
            geodesic: true,
            strokeColor: that.color,
            strokeWeight: that.strokeWeight,
            strokeOpacity: that.strokeOpacity,
            map: mapa
        }));

        if (that.testMode)
            return;

        that.line.setPath(that.projection);
    }

    this.calculatePosition = function(tiempo) {
        function calculatePart() {
            var acum = 0;
            var segment = 0;
            for (var a = 0; a < that.keyParts.times.length; a++) {
                var interval = that.keyParts.times[0];
                if (tiempo <= interval) {
                    segment = tiempo / interval;
                    break;
                }
                tiempo -= interval;

                that.keyParts.ready || (that.keyParts.ready = {});
                if(that.keyParts.ready[a])
                    continue;
                //that.projection.push(that.keyParts.path[a]);
                that.keyParts.ready[a] =1;
            }

            if(a>=that.keyParts.times.length){
                return recalculate();
            }

            var pA = that.keyParts.path[a - 1],
                pN = that.keyParts.path[a];

            if (!pA)
                pA = pN;


            getSegmentVectorPosition(pA, pN, segment);
        }

        function getSegmentVectorPosition(anterior, nuevo, relacion) {
            var dx = nuevo.lat() - anterior.lat(),
                dy = nuevo.lng() - anterior.lng(),
                r = Math.sqrt(dx * dx + dy * dy),
                rN = r * relacion,
                sinTeta = (r == 0 ? 0 : (dy / r)),
                teta = Math.asin(sinTeta),
                sy = rN * sinTeta,
                sx = rN * Math.cos(teta);

            var newPlace = {
                lat: anterior.lat() + sx,
                lng: anterior.lng() + sy
            }

            that.marker.setPosition(newPlace);
            that.projection || (that.projection = []);
            that.projection.push(newPlace);

        }

        function recalculate(){

            that.findRandomDestiny();

            if(that.mode !='user'){
                that.findWay(that.marker.getPosition());
            }else{
                that.findWay(that.marker);
            }

            
        }

        if (tiempo >= that.keyParts.time) {
            recalculate();
        } else {
            calculatePart();
        }

    }
}

var User = function(webInfo, start, map) {

    $.extend(true, this, new MapPerson(webInfo, start, map, 'user'));
    this.init();


    this.testMode = false;
    var that = this;

}

var Driver = function(webInfo, start, map) {

    $.extend(true, this, new MapPerson(webInfo, start, map, 'driver'));
    this.init();

    this.testMode = false;
    var that = this;

    this.strokeWeight = 10;
    this.strokeOpacity = .6;

    var drawMine = this.drawLine;

    this.drawLine = function() {
        drawMine();
        that.clientLine || (that.clientLine = new google.maps.Polyline({
            path: that.userParts.path,
            geodesic: true,
            strokeColor: that.color,
            strokeWeight: that.strokeWeight,
            strokeOpacity: that.strokeOpacity,
            map: mapa
        }));

        that.clientLine.setPath(that.userParts.path);
    }

}

var sistema = {
    connectDriversAndUsers: function(initialize,cback) {

        var origenes = [];
        var destinations = [];

        for (var i = 0; i < Math.max(drivers.length, users.length); i++) {
            if (i < drivers.length) {
                origenes.push(drivers[i].getPosition())
            }
            if (i < users.length) {
                destinations.push(users[i].getPosition());
                if (initialize) {
                    dataObjetos.users[i].findRandomDestiny();
                    (function(i) {
                        dataObjetos.users[i].findWay(users[i].marker, function() {
                            dataObjetos.users[i].drawLine();
                        });
                    })(i);
                } 
            }
        }

        mServ.getDistanceMatrix({
            origins: origenes,
            destinations: destinations,
            travelMode: google.maps.TravelMode.WALKING,
            avoidTolls: true,
            avoidHighways: true
        }, function(res, status) {

            $('.relacion > div').not('.invisible,.titulado').remove();

            var texto = $('.relacion .invisible').html();

            for (var a in res.rows) {
                var driver = dataObjetos.drivers[a],
                    row = res.rows[a].elements,
                    min = Infinity,
                    pos = -1;

                for (var b in row) {
                    if (row[b].duration.value < min) {
                        min = row[b].duration.value;
                        pos = b;
                    }
                }

                driver.travel = row[pos];
                driver.user = dataObjetos.users[pos];



                $('.relacion').append(
                    texto.replace(/\$id/gi, a)
                    .replace(/\$srcC/, driver.picture)
                    .replace(/\$srcUser/gi, driver.user.picture)
                    .replace(/\$nombreC/g, driver.name)
                    .replace(/\$nombreUser/gi, driver.user.name)
                    .replace(/\$distancia/gi, driver.travel.distance.value)
                    .replace(/\$tiempo/gi, driver.travel.duration.value)
                );

                $('.relacion .tabla-fila[rel=' + a + '] .rutainfo').css('background-color', driver.color);

                if (initialize) {
                    driver.findRandomDestiny();
                    (function(driver) {
                        driver.findWay(driver.marker.getPosition(), function() {
                            driver.drawLine();
                            if( cback && typeof cback =='function')
                                cback();
                        });
                    })(driver);
                } else {
                    driver.findWay(driver.marker.getPosition());
                    if( cback && typeof cback =='function')
                        cback();
                }

            }
        });
    },
    time: 0,
    playing: false,
    speed: 16,
    togglePlay: function(){
        if(sistema.playing){
            sistema.playing = false;
            sistema.time += new Date().getTime()- sistema.startTime;
        }else{
            this.playing = true;
            this.startTime = new Date().getTime();
        }
    },
    init: function(){
        sistema.startTime = new Date().getTime();
        setTimeout(sistema.ciclo,10);
    },
    ciclo: function(){
        if(!sistema.playing)
            return setTimeout(sistema.ciclo,10);

        var dt = new Date().getTime()-sistema.startTime;
        var pc = dt/1000;
        dt = dt + sistema.time;

        var pc2 = dt /1000;

        if(pc>=30){
            sistema.startTime = new Date().getTime();
            sistema.time += pc*1000;
            
            sistema.connectDriversAndUsers();
        }

        console.log(pc2);

        $('.barra').css({width:((pc%30)*100/30)+'%'});

        for(var a=0;a<config.drivers+config.users;a++){
            (function(a){
                var obj;
                if(a<config.users){
                    obj = dataObjetos.users[a];
                }else{
                    obj = dataObjetos.drivers[a-config.users];
                }
                obj.calculatePosition(pc2*sistema.speed);
                obj.drawLine();
            })(a);
        }
        setTimeout(sistema.ciclo,10);
    }
};
