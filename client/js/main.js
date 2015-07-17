var map, gjLayer, timer, day;
var pos = {
    lat: null,
    lon: null
};
var MAP_PAN_WAIT = 1000;
var loading = false;

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
    callDelay();
}

function sliderOnSlide(event, ui) {
    updateDay(ui.value);
    $('#time_display').text(day.format("h:mm A"));
    //var sunheight = (day.hours() - 6) * -15 + 50;
    //$('#bg').css({
    //    top: sunheight
    //});
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
        showMsg('Error: Your browser doesn\'t support geolocation.', true);
    }

    //default location: Code Fellows
    buildMap([47.6235, -122.3360]);
}

function buildMap() {
    var loc = L.latLng(pos.lat, pos.lon);
    var bounds = L.latLngBounds(L.latLng(47.4462, -122.4516), L.latLng(47.7331, -122.2148));

    // default to Code Fellows if user loc not in city limits
    if (!bounds.contains(loc)) {
        loc = L.latLng(47.6235, -122.3360);
    }

    map = L.map('map', {
        center: loc,
        zoom: 18,
        maxBounds: bounds,
        zoomControl: false,
        touchZoom: false,
        scrollWheelZoom: false,
        boxZoom: false
    });

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'migrantj.9344cb99',
        accessToken: 'pk.eyJ1IjoibWlncmFudGoiLCJhIjoiNmI3NjUwMmJkZjVlYTljYzRkMThhMDU4OWQ3NDI4MWIifQ.3of6hXIWW1bSWC4eqKAvQQ'
    }).addTo(map);

    L.marker(loc).addTo(map);
    addMapEvents();
    ajaxCall();
}

function addMapEvents() {
    map.on('moveend', function () {
        callDelay();
    });
}

function callDelay() {
    if (!loading) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function () {
            ajaxCall();
        }, MAP_PAN_WAIT);
    }
}

function ajaxCall() {
    loading = true;
    var bounds = map.getBounds();
    var center = map.getCenter();
    var lat = center.lat;
    var lon = center.lng;

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
                            [lon - 0.005, lat - 0.005, 0],
                            [lon + 0.005, lat - 0.005, 0],
                            [lon + 0.005, lat + 0.005, 0],
                            [lon - 0.005, lat + 0.005, 0],
                            [lon - 0.005, lat - 0.005, 0]
                        ]
                    ]
                };

                if (response["type"] === "Polygon") {
                    gjson["coordinates"].push(response["coordinates"][0]);
                } else if (response["type"] === "MultiPolygon") {
                    for (var i in response["coordinates"]) {
                        gjson["coordinates"].push(response["coordinates"][i][0]);
                    }
                }

                buildPoly(gjson);
                showMsg('Done!');
                loading = false;
            }, 50);
        } else
        if (response.hasOwnProperty("error")) {
            if (response["error"] === "night") {
                showMsg("It's Night Time! No Sun Found!");
            } else {
                showMsg("Unknown Error. Try Refreshing!", true);
            }
            loading = false;
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
