const jimp = require("jimp");
const path = require("path");

const settings = require('./settings.json');

module.exports = (app) => {
    app.get('/images/:res/*', (req, res) => {
        const resString = req.params.res;

        if(!resString || resString.indexOf("x") == -1) {
            res.status(500).send('Nepodarilo sa spracovať obrázok a vygenerovať náhľad.');
            return;
        }

        const resolution = resString.split("x");

        if(resolution.length != 2 || isNaN(resolution[0]) == true || isNaN(resolution[1]) == true || resolution[0] == "" || resolution[1] == "") {
            res.status(500).send('Nepodarilo sa spracovať obrázok a vygenerovať náhľad.');
            return;
        }

        resolution[0] = +resolution[0];
        resolution[1] = +resolution[1];

        const imagePath = req.url.split('/images/' + resString + '/').join('');

        jimp.read(path.join(__dirname, settings.galleryFolder, imagePath), (err, image) => {
            if(err) {
                res.status(404).send('Obrázok sa nenašiel');
                return;
            }

            if(resolution[0] != 0 && resolution[1] != 0) {
                image.resize(resolution[0], resolution[1]);
            } else if(resolution[0] == 0 && resolution[1] != 0) {
                image.resize(jimp.AUTO, resolution[1]);
            } else if(resolution[1] == 0 && resolution[0] != 0) {
                image.resize(resolution[0], jimp.AUTO);
            } else {
                //nejaky extremista zadal rozlisenia 0x0
                res.status(500).send('Nepodarilo sa spracovať obrázok a vygenerovať náhľad.');
                return;
            }

            image.getBuffer(image._originalMime, (err, buffer) => {
                if(err) {
                    res.status(500).send('Nepodarilo sa spracovať obrázok a vygenerovať náhľad.');
                    return;
                }

                res.set('Content-Type', image._originalMime);
                res.send(buffer);
            });
        });
    });
}