var map;
var pos = {
    lat: null,
    lon: null
};
var gjLayer;
var centerMarker;

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
    $('#time_display').text(hours + ':00');

    slider.on('change', function () {
        var sliderval = $(this).val();
        var sunheight = (sliderval - 6) * -15 + 50;
        $('#bg').css({
            top: sunheight
        });
        $('#time_display').text(sliderval + ':00');
        ajaxCall(null, null, parseInt(sliderval));
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
    addMapEvents();
    ajaxCall();
}

function addMapEvents() {
    map.on('mouseup', function () {
        var center = map.getCenter();
        //L.marker(center).addTo(map);
        //ajaxCall(center.lat, center.lon);
    });
}

function ajaxCall(lat, lon, hour) {
    var today = new Date();
    lat = lat || pos.lat;
    lon = lon || pos.lon;
    hour = hour || today.getUTCHours();

    var data = {
        lat: lat,
        lon: lon,
        year: today.getUTCFullYear(),
        month: today.getUTCMonth(),
        day: today.getUTCDay(),
        hour: hour
    };

    $.ajax({
        method: "POST",
        url: "http://dev.rayfindr.com/api_request",
        //url: "http://dev.rayfindr.com/json_test",
        //url: "http://localhost:6543/api_request",
        data: JSON.stringify(data),
        //dataType: 'json',
        //contentType: 'application/json'
    })
    .done(function(response) {
        var gjson = { "type": "Polygon",
            "coordinates": [
                [
                    [lon - 0.02, lat - 0.02, 0],
                    [lon + 0.02, lat - 0.02, 0],
                    [lon + 0.02, lat + 0.02, 0],
                    [lon - 0.02, lat + 0.02, 0],
                    [lon - 0.02, lat - 0.02, 0]
                ],
                //[
                //    [lon - 0.0001, lat - 0.0001, 0],
                //    [lon + 0.0001, lat - 0.0001, 0],
                //    [lon + 0.0001, lat + 0.0001, 0],
                //    [lon - 0.0001, lat + 0.0001, 0],
                //    [lon - 0.0001, lat - 0.0001, 0]
                //]
            ]
        };
        for (var i in response["coordinates"]) {
            gjson["coordinates"].push(response["coordinates"][i]);
        }
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
    if (!!gjLayer) {
        map.removeLayer(gjLayer);
    }
    var style = {
        "color": "yellow",
        "weight": 2,
        "opacity": 1,
        "fillColor": "yellow",
        "fillOpacity": 0.5
    };
    gjLayer = L.geoJson(data, {
        style: style
    });
    gjLayer.addTo(map);
}

initialize();
