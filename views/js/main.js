mapboxgl.accessToken = 'pk.eyJ1Ijoic3BsdXNoeXMiLCJhIjoiY2owODJ6M3ltMDAwcTMyb2JtbXYxYW9qeCJ9.vyLqVwBmSEFqsasn1ybVDg';

var filterGroup = document.getElementById('filter-group');
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v9',
	center: [-96, 37.8],
	zoom: 3
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    container: 'geocoder-container'
});

map.addControl(new MapboxGeocoder({
  container: 'geocoder-container',
  accessToken: mapboxgl.accessToken      
}));


var coordinates = [];
//Retreive all the coordinates from the database
function getNames(){
	$.get("./api/map")
		.done(function(geojson) {
			layer = geojson;
			map.on('load', function () {
/*				test = {
					"id": "points",
					"type": "symbol",
					"source": {
						"type": "geojson",
						"data": layer
					},
					"layout": {
						"icon-image": "{icon}-15",
						"text-field": "{title}",
						"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
						"text-offset": [0, 0.6],
						"text-anchor": "top"
					}
				}
				map.addLayer(test);*/
				map.addSource('single-point', {
        			"type": "geojson",
        			"data": {
            		"type": "FeatureCollection",
            		"features": []
        			}
    			});
    			map.addLayer({
        			"id": "point",
        			"source": "single-point",
        			"type": "circle",
        			"paint": {
            			"circle-radius": 9,
            			"circle-color": "#007cbf"
        			}
    			});

    			geocoder.on('result', function(ev) {
    				var local_req = ev.result.center;
        			map.getSource('single-point').setData(ev.result.geometry);

            		if (local_req.length > 0) { //catch Enter key
            			console.log(local_req);
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
                    		console.log(data);
                		});
            		}
    			});
        map.addSource("places", {
            "type": "geojson",
            "data": layer
        });
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
			});
		});
}


function showHouses(){

}
//Call getNames on page load.

getNames();