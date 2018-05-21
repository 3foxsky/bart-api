const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const settings = require('./settings.json');
const gallery = require('./gallery.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

//adds all /gallery routes
gallery(app);


app.listen(settings.port, () => {
    console.log("Express listening on :" + settings.port);
});