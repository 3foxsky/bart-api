const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const settings = require('./settings.json');

module.exports = (app) => {
    //POST
    app.post('/gallery', (req, res) => {
        const galleryName = req.body.name;

        if(!galleryName || galleryName.length <= 0 || galleryName.indexOf("/") != -1) {
            res.status(500).send({status: "error"});
            return;
        }

        const galleryPath = path.join(__dirname, settings.galleryFolder, galleryName);

        fs.access(galleryPath, fs.constants.F_OK, (err) => {
            if(!err) {
                res.status(409).send({status: "error"});
                return;
            }

            fs.mkdir(galleryPath, (err) => {
                if(err) {
                    res.status(500).send({status: "error"});
                    return;
                }

                res.send({
                    "path": encodeURIComponent(galleryName),
                    "name": galleryName
                });
            })
        });
    });

    app.post('/gallery/:galleryName', (req, res) => {
        const galleryName = req.params.galleryName;

        if(!req.files) {
            res.status(400).send({status: "error"});
            return;
        }

        const galleryPath = path.join(__dirname, settings.galleryFolder, galleryName);
        fs.access(galleryPath, fs.constants.F_OK, (err) => {
            if(err) {
                res.status(404).send({status: "error"});
                return;
            }

            let files = [];
            for(let imagePack in req.files) {
                let pack = req.files[imagePack];
                if(Array.isArray(pack)) {
                    for(let i = 0; i < pack.length; i++) {
                        files.push(pack[i]);
                    }
                } else {
                    files.push(pack);
                }
            }

            let allowedExts = [
                "image/jpeg", 
                "image/pjpeg"
            ];

            let newFiles = [];
            for(let i = 0; i < files.length; i++) {
                let fileName = files[i].name;
                let toSkip = false;

                for(let l = 0; l < newFiles.length; l++) {
                    if(fileName == newFiles[l].name) {
                        toSkip = true;
                    }
                }

                if(toSkip == true) {
                    continue;
                } else {
                    if(allowedExts.indexOf(files[i].mimetype) != -1) {
                        newFiles.push(files[i]);
                    }
                }
            }

            files = newFiles;

            if(files.length == 0) {
                res.status(400).send({status: "error"});
                return;
            }


            let filesUploadedNames = [];
            let filesWithErrorCount = 0;

            for(let i = 0; i < files.length; i++) {
                const file = files[i];
                file.nameNoExt = file.name.replace(/\.[^/.]+$/, "");
                
                let filearr = file.name.split(".");
                file.ext = filearr[filearr.length -1];

                let fileName = file.name;

                let fileNumber = 1;
                
                while(fs.existsSync(path.join(__dirname, settings.galleryFolder, galleryName, fileName)) == true) {
                    fileName = file.nameNoExt + "-" + fileNumber + "." + file.ext;
                    fileNumber++;
                }

                fs.writeFile(path.join(__dirname, settings.galleryFolder, galleryName, fileName), file.data, (err) => {
                    if(err) {
                        filesWithError++;
                        return;
                    }

                    filesUploadedNames.push(fileName);

                    if(filesUploadedNames.length + filesWithErrorCount == files.length) {
                        if(filesUploadedNames.length == 0) {
                            res.status(500).send({status: "error"});
                            return;
                        }

                        let responseObj = {
                            "uploaded": [ ]
                        };

                        for(let i = 0; i < filesUploadedNames.length; i++) {
                            const image = filesUploadedNames[i];
                            const imagePath = path.join(__dirname, settings.galleryFolder, galleryName, image);

                            fs.lstat(imagePath, (err, fileStats) => {
                                if(err) {
                                    res.status(500).send({status: "error"});
                                    return;
                                }
                
                                responseObj.uploaded.push({
                                    "path": encodeURIComponent(image),
                                    "fullpath": path.join(galleryName, image),
                                    "name": image.replace(/\.[^/.]+$/, ""),
                                    "modified": fileStats.mtime
                                });
                
                                if(responseObj.uploaded.length == filesUploadedNames.length) {
                                    res.send(responseObj);
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    //DELETE
    app.delete('/gallery/*', (req, res) => {
        const pathToDelete = req.url.substring(9);

        const fullPathToRemove = path.join(__dirname, settings.galleryFolder, pathToDelete);

        fs.access(fullPathToRemove, fs.constants.F_OK, (err) => {
            if(err) {
                res.status(404).send({status: "error"});
                return;
            }

            fse.remove(fullPathToRemove, (err) => {
                if(err) {
                    res.status(500).send({status: "error"});
                    return;
                }

                res.send({status: "ok"});
            });
        });
    });

    //GET
    app.get('/gallery', (req, res) => {
        fs.readdir(path.join(__dirname, settings.galleryFolder), (err, galleries) => {
            if(err) {
                res.status(500).send({status: "error"});
                return;
            }

            readGalleries(galleries)
                .then((galleriesObj) => {
                    res.send(galleriesObj);
                })
                .catch(() => {
                    res.status(500).send({status: "error"});
                });
        });
    });

    app.get('/gallery/:galleryName', (req, res) => {
        const galleryName = req.params.galleryName;
        const galleryPath = path.join(__dirname, settings.galleryFolder, galleryName + "/");

        fs.access(galleryPath, fs.constants.F_OK, (err) => {
            if(err) {
                res.status(404).send({status: "error"});
                return;
            }

            fs.readdir(galleryPath, (err, images) => {
                if(err) {
                    res.status(500).send({status: "error"});
                    return;
                }

                let galleryObj = {
                    "gallery": {
                        "path": encodeURIComponent(galleryName),
                        "name": galleryName
                    },
                    "images": [ ]
                };

                if(images.length <= 0) {
                    res.send(galleryObj);
                    return;
                }

                readGallery(galleryName, images)
                    .then((imagesArr) => {
                        galleryObj["images"] = imagesArr;

                        res.send(galleryObj);
                    })
                    .catch(() => {
                        res.status(500).send({status: "error"});
                    });

            });
        });
    });
};

function readGallery(galleryName, images) {
    return new Promise((res, rej) => {
        let imagesArr = [];

        let foldersCount = 0;

        for(let i = 0; i < images.length; i++) {
            let image = images[i];

            const imagePath = path.join(__dirname, settings.galleryFolder, galleryName, image);

            fs.lstat(imagePath, (err, fileStats) => {
                if(err) {
                    return rej();
                }

                const isDirectory = fileStats.isDirectory();

                if(image.indexOf('.') == -1 || image.split(".").length == 0) {
                    foldersCount++;
                    return;
                }

                const fileExt = image.split('.')[image.split('.').length - 1];

                if(isDirectory == true || (fileExt != "jpg") && fileExt != "jpeg") {
                    foldersCount++;
                    return;
                }

                imagesArr.push({
                    "path": encodeURIComponent(image),
                    "fullpath": path.join(galleryName, image),
                    "name": image.replace(/\.[^/.]+$/, ""),
                    "modified": fileStats.mtime
                });

                if(imagesArr.length == images.length - foldersCount) {
                    res(imagesArr);
                }
            });
        }
    });
}

function readGalleries(galleries) {
    return new Promise((res, rej) => {
        let galleriesObj = {
            "galleries": []
        };

        let filesCount = 0;

        for(let i = 0; i < galleries.length; i++) {
            let gallery = galleries[i];

            const galleryPath = path.join(__dirname, settings.galleryFolder, gallery);

            fs.lstat(galleryPath, (err, stats) => {
                if(err) {
                    return rej();
                }

                const isDirectory = stats.isDirectory();

                if(isDirectory == false) {
                    filesCount++;
                    return;
                }

                fs.readdir(galleryPath, (err, images) => {
                    if(err) {
                        return rej();
                    }

                    if(images.length > 0) {
                        let imagesOnlyArr = [];
                        for(let i = 0; i < images.length; i++) {
                            if(images[i].indexOf(".") != -1 && images[i].split(".").length != 0) {
                                let fileExt = images[i].split(".")[images[i].split(".").length -1];
                                if(fileExt == "jpg" || fileExt == "jpeg") {
                                    imagesOnlyArr.push(images[i]);
                                }
                            }
                        }

                        images = imagesOnlyArr;

                        fs.lstat(path.join(galleryPath, images[0]), (err, fileStats) => {
                            if(err) {
                                return rej();
                            }

                            let correctImage;

                            galleriesObj.galleries.push({
                                "path": encodeURIComponent(gallery),
                                "image": {
                                    "path": encodeURIComponent(images[0]),
                                    "fullpath": path.join(gallery, images[0]),
                                    "name": images[0].replace(/\.[^/.]+$/, ""),
                                    "modified": fileStats.mtime
                                },
                                "name": gallery
                            });

                            if(galleriesObj.galleries.length == galleries.length - filesCount) {
                                res(galleriesObj);
                            }
                        });
                    } else {
                        galleriesObj.galleries.push({
                            "path": encodeURIComponent(gallery),
                            "name": gallery
                        });

                        if(galleriesObj.galleries.length == galleries.length - filesCount) {
                            res(galleriesObj);
                        }
                    }
                });
            });
        }
    });
}