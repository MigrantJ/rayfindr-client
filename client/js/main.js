var map, gjLayer, centerMarker, day;
var pos = {
    lat: null,
    lon: null
};

function initialize() {
    day = moment();
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
    $('#slider').slider({
        min: 0,
        max: 1439,
        value: day.hours() * 60 + day.minutes(),
        change: sliderOnChange,
        slide: sliderOnSlide
    });

    $('#time_display').text(day.format("h:mm A"));
}

function sliderOnChange(event, ui) {
    ajaxCall();
}

function sliderOnSlide(event, ui) {
    updateDay(ui.value);
    $('#time_display').text(day.format("h:mm A"));
    var sunheight = (day.hours() - 6) * -15 + 50;
    $('#bg').css({
        top: sunheight
    });
}

function updateDay(mins) {
    var hours = Math.min(mins / 60);
    var realmins = mins % 60;
    day.hours(hours);
    day.minutes(realmins);
}

function handleNoGeolocation(errorFlag) {
    var content = '';
    if (errorFlag) {
        showMsg('Error: The Geolocation service failed.', true);
    } else {
        showMsg('Error: Your browser doesn\'t support geolocation.');
    }

    //default location: Bellevue
    buildMap([47.6, -122.2]);
}

function buildMap() {
    var loc = [pos.lat, pos.lon];
    map = L.map('map').setView(loc, 18);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        minZoom: 17,
        maxZoom: 19,
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
        ajaxCall(center.lat, center.lng);
    });
}

function ajaxCall(lat, lon) {
    lat = lat || pos.lat;
    lon = lon || pos.lon;
    var bounds = map.getBounds();

    day.utc();

    var data = {
        lat: lat,
        lon: lon,
        year: day.year(),
        month: day.month(),
        day: day.day(),
        hour: day.hour(),
        minute: day.minute(),
        boundLatMin: bounds.getSouth(),
        boundLatMax: bounds.getNorth(),
        boundLonMin: bounds.getWest(),
        boundLonMax: bounds.getEast()
    };

    day.local();

    showMsg('Loading From Server...');

    $.ajax({
        method: "POST",
        url: "http://dev.rayfindr.com/api_request",
        //url: "http://localhost:6543/api_request",
        data: JSON.stringify(data),
    })
    .done(function(response) {
        if (!!gjLayer) {
            map.removeLayer(gjLayer);
        }
        if (response.hasOwnProperty("type")) {
            showMsg('Generating Shadows...');
            setTimeout(function() {
                var gjson = {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [lon - 0.02, lat - 0.02, 0],
                            [lon + 0.02, lat - 0.02, 0],
                            [lon + 0.02, lat + 0.02, 0],
                            [lon - 0.02, lat + 0.02, 0],
                            [lon - 0.02, lat - 0.02, 0]
                        ]
                    ]
                };

                if (response["type"] === "Polygon") {
                    gjson["coordinates"].push(response["coordinates"][0]);
                } else
                if (response["type"] === "MultiPolygon") {
                    for (var i in response["coordinates"]) {
                        for (var j in response["coordinates"][i]) {
                            gjson["coordinates"].push(response["coordinates"][i][j]);
                        }
                    }
                }

                buildPoly(gjson);
                showMsg('Done!');
            }, 50);
        } else {
            showMsg("It's Night Time! No Sun Found!");
        }
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
        "fillOpacity": 0.5,
        "fill": true
    };
    gjLayer = L.geoJson(data, {
        style: style
    });
    gjLayer.addTo(map);
}

function showMsg(text, isError) {
    var e = $('#message_text');
    e.show();
    e.text(text);
    if (isError) {
        e.addClass('error');
    } else {
        e.removeClass('error');
    }
}

function hideMsg() {
    var e = $('#message_text');
    e.hide();
}

initialize();
