var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
var fs = require('fs');
var google = require('google');
var NodeGeocoder = require('node-geocoder');

//initialize geocoder service for coordinates
var options = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyC4hVADnTtaaiE57-ySRd5gFJAwlIDU0HI', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var mydb;

/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
* 	"name": "Bob"
* }
*/
app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  if(!mydb) {
    console.log("No database.");
    response.send("Hello " + userName + "!");
    return;
  }
  // insert the username as a document
  mydb.insert({ "name" : userName }, function(err, body, header) {
    if (err) {
      return console.log('[mydb.insert] ', err.message);
    }
    response.send("Hello " + userName + "! I added you to the database.");
  });
});


app.get("/api/map", function (request, response) {
      var addresses = JSON.parse(fs.readFileSync('coordinates.json', 'utf8'));
      var coordinates = {};
      coordinates['type'] = "FeatureCollection";
      coordinates['features'] = [];
      var length = 0;
      for (var i=0; i<addresses.length; i++){
	      address = addresses[i]['Street Address']+' '+addresses[i]['City']+ ' '+ addresses[i]['Prov.']+ ' '+ addresses[i]['Postal Code'];
	      console.log(address);
	      geocoder.geocode( address, 
            function(err, res) {
              if(res[0]){
              length++;
	      //console.log(address);
              //console.log(length);
              var newFeature = {
                  "type": "Feature",
                  "geometry": {
                      "type": "Point",
                      "coordinates": [parseFloat(res[0].longitude), parseFloat(res[0].latitude)]
                  },
                  "properties": {
                      "title": res[0].zipcode,
                      "icon": "monument"
                  }
              }
              coordinates['features'].push(newFeature);
              }
              else{
		      //console.log(length);
		      //console.log(address);
		      length++;
	      }
              if(length==addresses.length){
                console.log(addresses.length);
                response.json(coordinates);
                return;
              }

        });
      }
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
/*  var names = [];
  if(!mydb) {

    response.json(names);
    return;
  }

  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });*/

  var coordinates = require("./coordinates.json");
  response.json(coordinates);
});


// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB']) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);

  //database name
  var dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);
}

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
