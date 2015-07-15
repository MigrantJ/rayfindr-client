var map;
var pos = {
    lat: null,
    lon: null
};

function initialize() {
    initTimeSlider();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos.lat = position.coords.latitude;
            pos.lon = position.coords.longitude;
            buildMap();
        }, function () {
            //Geolocation call did not return or errored
            handleNoGeolocation(true);
        });
    } else {
        // Browser doesn't support Geolocation
        handleNoGeolocation(false);
    }
}

function initTimeSlider() {
    var today = new Date();
    var hours = today.getHours();
    var slider = $('#time_slider');

    slider.val(hours);

    slider.on('change', function () {
        var sliderval = $(this).val();
        var sunheight = (sliderval - 6) * -15 + 50;
        $('#bg').css({
            top: sunheight
        });
    });
}

function handleNoGeolocation(errorFlag) {
    var content = '';
    if (errorFlag) {
        content = 'Error: The Geolocation service failed.';
    } else {
        content = 'Error: Your browser doesn\'t support geolocation.';
    }

    //default location: Bellevue
    buildMap([47.6, -122.2]);
}

function buildMap() {
    var loc = [pos.lat, pos.lon];
    map = L.map('map').setView(loc, 16);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        minZoom: 14,
        maxZoom: 18,
        id: 'migrantj.9344cb99',
        accessToken: 'pk.eyJ1IjoibWlncmFudGoiLCJhIjoiNmI3NjUwMmJkZjVlYTljYzRkMThhMDU4OWQ3NDI4MWIifQ.3of6hXIWW1bSWC4eqKAvQQ'
    }).addTo(map);
    L.marker(loc).addTo(map);
    ajaxCall();
}

function ajaxCall() {
    var today = new Date();

    var data = {
        lat: pos.lat,
        lon: pos.lon,
        year: today.getUTCFullYear(),
        month: today.getUTCMonth(),
        day: today.getUTCDay(),
        hour: today.getUTCHours()
    };

    $.ajax({
        method: "POST",
        url: "http://dev.rayfindr.com/api_request",
        //url: "http://localhost:6543/api_request",
        data: JSON.stringify(data),
        //dataType: 'json',
        //contentType: 'application/json'
    })
    .done(function(response) {
        var gjson = { "type": "Polygon",
            "coordinates": [
                [
                    [pos.lon - 0.02, pos.lat - 0.02, 0],
                    [pos.lon + 0.02, pos.lat - 0.02, 0],
                    [pos.lon + 0.02, pos.lat + 0.02, 0],
                    [pos.lon - 0.02, pos.lat + 0.02, 0],
                    [pos.lon - 0.02, pos.lat - 0.02, 0]
                ]
            ],
            "properties": {
                "color": "red",
                "description": "a polygon"
            }
        };
        gjson["coordinates"].push(response["coordinates"]);
        buildPoly(gjson);
    })
    .error(function (response) {
        console.log(response);
    });
}

function buildHeatMap(map, data) {
    L.heatLayer(data, {
        radius: 20,
        gradient: {0.5: 'orange', 1: 'yellow'}
    })
    .addTo(map);
}

function buildPoly(data) {
    var style = {
        "color": "yellow",
        "weight": 2,
        "opacity": 1,
        "fillColor": "yellow",
        "fillOpacity": 0.5
    };
    L.geoJson(data, {
        style: style
    })
    .addTo(map);
}

initialize();
