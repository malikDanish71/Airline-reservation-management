// routes/admin/airports.js
const express = require('express');
const router = express.Router();
const Airport = require('../../models/Airport');
const Flight = require('../../models/Flight');
const Booking = require('../../models/Booking');

const { reqAuth, isAdmin } = require('../../middlewares/auth');
const {
    uploadAirport,
    replaceImage,
    deleteImageOnDoc
} = require('../../middlewares/upload');


// List & Manage Page
router.get('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const airports = await Airport.find().sort('code').lean();
        let edit;
        if (req.query.edit) {
            edit = await Airport.findById(req.query.edit).lean();
        }
        res.render('admin/airports', {
            title: 'Admin – Manage Airports',
            active: '',
            user: req.user,
            css: 'admin-airports.css',
            airports,
            edit
        });
    } catch (err) { next(err); }
});

// Create new airport
router.post(
    '/', reqAuth, isAdmin,
    uploadAirport.single('image'),
    async (req, res, next) => {
        try {
            const { name, code } = req.body;
            const imageUrl = req.file ? `/uploads/airport/${req.file.filename}` : '';
            await Airport.create({ name, code, imageUrl });
            res.redirect('/admin/airports');
        } catch (err) { next(err); }
    }
);

function onlyIfFilePresent(req, res, next) {
    if (req.file) return replaceImage(async req => {
        const a = await Airport.findById(req.params.id);
        return a ? a.imageUrl : null;
    })(req, res, next);
    next();
}



// Update airport
router.put(
    '/:id', reqAuth, isAdmin,
    uploadAirport.single('image'),
    onlyIfFilePresent,
    async (req, res, next) => {
        try {
            const { name, code } = req.body;
            const update = { name, code };
            if (req.file) update.imageUrl = `/uploads/airport/${req.file.filename}`;
            await Airport.findByIdAndUpdate(req.params.id, update);
            res.redirect('/admin/airports');
        } catch (err) { next(err); }
    }
);

// Delete airport
router.delete(
    '/:id', reqAuth, isAdmin,
    deleteImageOnDoc(Airport, 'imageUrl'),
    async (req, res, next) => {
        try {
            await Airport.findByIdAndDelete(req.params.id);
            res.redirect('/admin/airports');
        } catch (err) { next(err); }
    }
);

// routes/admin/airports.js DELETE handler
router.delete(
    '/:id', reqAuth, isAdmin,
    deleteImageOnDoc(Airport, 'imageUrl'),
    async (req, res, next) => {
        try {
            const airportId = req.params.id;

            // 1) Find flights that use this airport as origin or destination
            const flightsToRemove = await Flight.find({
                $or: [
                    { origin: airportId },
                    { destination: airportId }
                ]
            }).select('_id').lean();

            const flightIds = flightsToRemove.map(f => f._id);

            // 2) Delete all bookings for those flights
            await Booking.deleteMany({ flight: { $in: flightIds } });

            // 3) Delete those flights
            await Flight.deleteMany({ _id: { $in: flightIds } });

            // 4) Finally delete the airport itself
            await Airport.findByIdAndDelete(airportId);

            res.redirect('/admin/airports');
        } catch (err) {
            next(err);
        }
    }
);


module.exports = router;
