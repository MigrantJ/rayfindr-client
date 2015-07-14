function initialize() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            buildMap([position.coords.latitude, position.coords.longitude]);
        }, function () {
            //Geolocation call did not return or errored
            handleNoGeolocation(true);
        });
    } else {
        // Browser doesn't support Geolocation
        handleNoGeolocation(false);
    }
}

function handleNoGeolocation(errorFlag) {
    var content = '';
    if (errorFlag) {
        content = 'Error: The Geolocation service failed.';
        console.log(errorFlag);
    } else {
        content = 'Error: Your browser doesn\'t support geolocation.';
    }

    //default location: Bellevue
    buildMap([47.6, -122.2]);
}

function buildMap(pos) {
    var map = L.map('map').setView(pos, 16);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        minZoom: 14,
        maxZoom: 18,
        id: 'migrantj.9344cb99',
        accessToken: 'pk.eyJ1IjoibWlncmFudGoiLCJhIjoiNmI3NjUwMmJkZjVlYTljYzRkMThhMDU4OWQ3NDI4MWIifQ.3of6hXIWW1bSWC4eqKAvQQ'
    }).addTo(map);
    L.marker(pos).addTo(map);
    doCalls(map, pos);
}

function doCalls(map, pos) {
    var data = {
        lat: pos[0],
        lon: pos[1],
        time: 0
    };

    $.ajax({
        method: "POST",
        url: "http://dev.rayfindr.com/json_test",
        data: data,
        //url: "http://localhost:6543/json_test",
    })
    .done(function(response) {
        console.log(response);
        var points = [
            [pos[0] - 0.001, pos[1] - 0.001, 100],
            [pos[0] + 0.001, pos[1] - 0.001, 100],
            [pos[0] - 0.001, pos[1] + 0.001, 100],
            [pos[0] + 0.001, pos[1] + 0.001, 100]
        ];
        var gjson = { "type": "Polygon",
            "coordinates": [
                [
                    [pos[1] - 0.001, pos[0] - 0.001],
                    [pos[1] + 0.001, pos[0] - 0.001],
                    [pos[1] + 0.001, pos[0] + 0.001],
                    [pos[1] - 0.001, pos[0] + 0.001],
                    [pos[1] - 0.001, pos[0] - 0.001]
                ],
                [
                    [pos[1] - 0.00075, pos[0] - 0.00075],
                    [pos[1] - 0.00050, pos[0] - 0.00075],
                    [pos[1] - 0.00050, pos[0] - 0.00050],
                    [pos[1] - 0.00075, pos[0] - 0.00050],
                    [pos[1] - 0.00075, pos[0] - 0.00075]
                ],
                [
                    [pos[1] + 0.00025, pos[0] + 0.00025],
                    [pos[1] + 0.00050, pos[0] + 0.00025],
                    [pos[1] + 0.00050, pos[0] + 0.00050],
                    [pos[1] + 0.00025, pos[0] + 0.00050],
                    [pos[1] + 0.00025, pos[0] + 0.00025]
                ]
            ],
            "properties": {
                "color": "red",
                "description": "a polygon"
            }
        };
        //buildHeatMap(map, points);
        buildPoly(map, gjson);
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

function buildPoly(map, data) {
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
