const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const settings = require('./settings.json');
const gallery = require('./gallery.js');
const images = require('./images.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

//adds all /gallery routes
gallery(app);

//adds all /images routes
images(app);


app.listen(settings.port, () => {
    console.log("Express listening on :" + settings.port);
});