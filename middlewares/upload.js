// middlewares/upload.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer storage factory: folder = 'airports' | 'airlines'
function storageFor(folder) {
    const dest = path.join(__dirname, '..', 'uploads', folder);
    return multer.diskStorage({
        destination: (_, __, cb) => cb(null, dest),
        filename: (_, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, Date.now() + ext);
        }
    });
}

// upload handlers
const uploadAirport = multer({ storage: storageFor('airport') });
const uploadAirline = multer({ storage: storageFor('airline') });

// delete old file helper
function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// Middleware: on replace, delete old image
function replaceImage(getOldPath) {
    return async (req, res, next) => {
        try {
            // get old path from model or function
            const oldPath = await getOldPath(req);
            if (oldPath) deleteFile(path.join(__dirname, '..', oldPath));
        } catch (e) { /* ignore */ }
        next();
    };
}

// Middleware: on doc deletion, delete image
function deleteImageOnDoc(Model, imageField) {
    return async (req, res, next) => {
        try {
            const doc = await Model.findById(req.params.id);
            if (doc && doc[imageField]) {
                deleteFile(path.join(__dirname, '..', doc[imageField]));
            }
        } catch (e) { /* ignore */ }
        next();
    };
}

module.exports = {
    uploadAirport,
    uploadAirline,
    replaceImage,
    deleteImageOnDoc
};
