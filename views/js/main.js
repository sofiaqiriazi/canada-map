mapboxgl.accessToken = 'pk.eyJ1Ijoic3BsdXNoeXMiLCJhIjoiY2owODJ6M3ltMDAwcTMyb2JtbXYxYW9qeCJ9.vyLqVwBmSEFqsasn1ybVDg';
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v9',
	center: [-96, 37.8],
	zoom: 3
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
});

map.addControl(geocoder);



var coordinates = [];
//Retreive all the coordinates from the database
function getNames(){
	$.get("./api/map")
		.done(function(geojson) {
			layer = geojson;
			map.on('load', function () {
				test = {
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
				map.addLayer(test);
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
        			map.getSource('single-point').setData(ev.result.geometry);
    			});
			});
		});
}

//Call getNames on page load.

getNames();