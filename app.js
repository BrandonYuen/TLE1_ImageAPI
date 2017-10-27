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

// API Version 1
app.post('/api/Upload', upload.single('imgUpload'), function (req, res, next) {
	console.log("Uploaded image to storage!");
	console.log("req.file: ",req.file);
	console.log("req.file.path: ",req.file.path);

	//Send image to IBM
	console.log("Sending request to IBM...")

	var ibmReq = request.post('https://gateway-a.watsonplatform.net/visual-recognition/api/v3/detect_faces?api_key='+apiKey+'&version=2016-05-20',
	function (err, response, body) {
		if (err) {
			console.log("Error on IBM request: ", err);
			return res.end("Something went wrong...");
		}
		console.log("Successfull response from IBM with body",body);
   		res.type('application/json');
		return res.send(body);
	});

	//Append multipart form data to request
	var form = ibmReq.form();
	form.append('images_file', fs.createReadStream(req.file.path));
});

//Start server
app.listen(1337, function () {
  console.log('Started App on port 1337.')
})
