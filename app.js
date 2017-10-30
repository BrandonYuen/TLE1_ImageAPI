//Modules
const express = require('express')

var multer = require('multer');
var bodyParser = require('body-parser');
var request = require('request');
var path = require('path');
var fs = require("fs")

const app = express()

//Settings
const apiKey = "d696c7025f6f45829213b748a8b7cca9f5cbd56b";

//Routes
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});


var Storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, "./images");
	},
	filename: function(req, file, callback) {
		callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
	}
});

var upload = multer({ storage: Storage });

// Watch for file changes in the images folder
fs.watch('./images', {}, (eventType, filename) => {
	if (filename) {
		console.log("file update (",eventType, ") for:",filename);
		checkImage("./images/"+filename);
	}
});

// API Version 1
function checkImage (path) {

	//Send image to IBM
	console.log("Sending request to IBM...")

	var ibmReq = request.post({
		url: 'https://gateway-a.watsonplatform.net/visual-recognition/api/v3/detect_faces?api_key='+apiKey+'&version=2016-05-20',
		headers: {
			"Content-Type": "application/json"
		},
		json:true
	},
	function (err, response, body) {
		if (err) {
			console.log("Error on IBM request: ", err);
			//TODO: Send error to central server.
		}

		console.log("Successfull response from IBM with body",body);

		if (body == undefined) {
			console.log("Body is undefined, not sending to central server.")
		} else {
			//Send data to central server
			sendToCentralServer(body);
		}
	});

	//Append multipart form data to request
	var form = ibmReq.form();
	form.append('images_file', fs.createReadStream(path));
};

function sendToCentralServer(data) {
	console.log("Sending IBM response to central server.");

	data = {"IBMResult": data};
	console.log("Data: ",data);

    // Send request to central server with IBM Result Data
    request({
        url: "http://lampies.imanidap.nl",
    	method: "POST",
    	json: data
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body)
        }
        else {

            console.log("error: " + error)
            console.log("response.statusCode: " + response.statusCode)
            console.log("response.statusText: " + response.statusText)
        }
    })
}

//Start server
app.listen(1337, function () {
  console.log('Started App on port 1337.')
})
