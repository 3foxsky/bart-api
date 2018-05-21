
const settings = require('./settings.json');

module.exports = (app) => {
    app.get('/images/:res/*', (req, res) => {
        const resolution = req.params.res;
        const path = req.url.split('/images/' + resolution + '/').join('');

        console.log(resolution);
        console.log(path);

        res.send("1");
    });
}