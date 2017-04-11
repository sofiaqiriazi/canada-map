mapboxgl.accessToken = 'pk.eyJ1Ijoic3BsdXNoeXMiLCJhIjoiY2owODJ6M3ltMDAwcTMyb2JtbXYxYW9qeCJ9.vyLqVwBmSEFqsasn1ybVDg';

var filterGroup = document.getElementById('filter-group');
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v9',
	center: [-96, 37.8],
	zoom: 3
});

var geocoder = new MapboxGeocoder({
  container: 'geocoder-container',
  accessToken: mapboxgl.accessToken      
})

map.addControl(geocoder);

var singlepoint = {
    "type": "geojson",
    "data": {
        "type": "FeatureCollection",
        "features": []
    }
};

var point = {
    "id": "point",
    "source": "single-point",
    "type": "circle",
    "paint": {
        "circle-radius": 9,
        "circle-color": "#007cbf"
    }
};

function cleanLocations(layer){
    $('#filter-group').empty();
    layer.features.forEach(function(feature){
        map.removeLayer(feature.properties['title']);    
    })
}           

//create points on map and the list of checkboxes
function showLocations(layer){
    if (!map.getSource("places")){
        map.addSource("places", {
            "type": "geojson",
            "data": layer
        });
    }

    layer.features.forEach(function(feature) {
        var symbol = feature.properties['icon'];
        var uniqueid = feature.properties['title'];
        var layerID = uniqueid;

        // Add a layer for this symbol type if it hasn't been added already.
        if (!map.getLayer(uniqueid)) {
            map.addLayer({
                "id": uniqueid,
                "type": "symbol",
                "source": "places",
                "layout": {
                        "icon-image": "{icon}-15",
                        "text-field": "{title}",
                        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                        "text-offset": [0, 0.6],
                        "text-anchor": "top"
                },
                "filter": ["==", "title", uniqueid]
            });

            // Add checkbox and label elements for the layer.
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = uniqueid;
            input.checked = true;
            filterGroup.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute('for', uniqueid);
            label.textContent = uniqueid;
            filterGroup.appendChild(label);

            // When the checkbox changes, update the visibility of the layer.
            input.addEventListener('change', function(e) {
                map.setLayoutProperty(uniqueid, 'visibility',
                    e.target.checked ? 'visible' : 'none');
            });
        }
    })
}

function lookUpDistances(layer, end){
    var results = [];
    var distances = []; 
    
    layer.features.forEach(function(feature){
        var start = feature.geometry.coordinates;
        var route  = {};
        $.ajax({
        url: 'https://api.mapbox.com/directions/v5/mapbox/driving/'+start+';'+end+'?access_token='+ mapboxgl.accessToken,
        beforeSend: function(xhr) {
             xhr.setRequestHeader("access_token", mapboxgl.accessToken)
        }, success: function(data){
            route['dist'] = data.routes[0].distance;
            route['start'] = feature.properties.title;
            distances.push(route);
            var results = {};
            //process the JSON data etc
            if(distances.length == layer.features.length){

                distances.sort(function(a, b){
                    return a.dist - b.dist;
                });

                var closest = distances.splice(0,5);
                results['type'] = "FeatureCollection";
                results['features'] = [];
                closest.forEach(function(distance){
                    var counter = 0;

                    layer.features.forEach(function(feat){
                    if(distance.start == feat.properties.title){
                        results['features'].push(feat);
                        if(results.features.length == 5){
                            console.log("TRYE");
                            console.log(results);
                            cleanLocations(layer);
                            showLocations(results);
                        }
                    }
                    counter+=1;

                })

                })
                

            }
            }
        })
        
    })
}

function searchBar(layer){
    geocoder.on('result', function(ev) {
            initMap();
            var local_req = ev.result.center;
            map.getSource('single-point').setData(ev.result.geometry);

            if (local_req.length > 0) { //catch Enter key
                
                //POST request to API to create a new visitor entry in the database
                $.ajax({
                        method: "POST",
                        url: "./api/visitors",
                        contentType: "application/json",
                        data: JSON.stringify({name: local_req })
                })
                .done(function(data) {
                        $('#response').html(data);
                        $('#nameInput').hide();
                        
                        //under progress
                        lookUpDistances(layer,data);
                });
            }
    });

}
var coordinates = [];
//Retreive all the coordinates from the database
function initMap(){
	$.get("./api/map").done(function(geojson) {
			layer = geojson;
			map.on('load', function () {

                map.addSource('single-point',singlepoint);
                map.addLayer(point);
                searchBar(layer);
                showLocations(layer);

            });
	    });
}

//call getNames on page Load
initMap();