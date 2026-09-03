// routes/admin/airlines.js
const express = require('express');
const router = express.Router();
const Airline = require('../../models/Airline');
const { reqAuth, isAdmin } = require('../../middlewares/auth');
const {
    uploadAirline,
    replaceImage,
    deleteImageOnDoc
} = require('../../middlewares/upload');

// List & Manage Page + Edit query 
router.get('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        // 1) fetch all airlines
        const airlines = await Airline.find().sort('name').lean();

        // 2) determine if we're editing one
        let edit = null;
        if (req.query.edit) {
            edit = await Airline.findById(req.query.edit).lean();
        }

        // 3) render with 'edit' either null or the object
        res.render('admin/airlines', {
            title: 'Admin – Manage Airlines',
            active: '',
            user: req.user,
            css: 'admin-airlines.css',
            airlines,
            edit
        });
    } catch (err) {
        next(err);
    }
});

// Create new airline
router.post(
    '/', reqAuth, isAdmin,
    uploadAirline.single('logo'),
    async (req, res, next) => {
        try {
            const { name } = req.body;
            const logoUrl = req.file ? `/uploads/airline/${req.file.filename}` : '';
            await Airline.create({ name, logoUrl });
            res.redirect('/admin/airlines');
        } catch (err) { next(err); }
    }
);

// Update airline
router.put(
    '/:id', reqAuth, isAdmin,
    uploadAirline.single('logo'),
    replaceImage(async req => {
        const a = await Airline.findById(req.params.id);
        return a ? a.logoUrl : null;
    }),
    async (req, res, next) => {
        try {
            const { name } = req.body;
            const update = { name };
            if (req.file) update.logoUrl = `/uploads/airline/${req.file.filename}`;
            await Airline.findByIdAndUpdate(req.params.id, update);
            res.redirect('/admin/airlines');
        } catch (err) { next(err); }
    }
);

// routes/admin/airlines.js DELETE handler
router.delete(
    '/:id', reqAuth, isAdmin,
    deleteImageOnDoc(Airline, 'logoUrl'),
    async (req, res, next) => {
        try {
            const airlineId = req.params.id;

            // 1) Find flights for this airline
            const flightsToRemove = await Flight.find({ airline: airlineId })
                .select('_id').lean();

            const flightIds = flightsToRemove.map(f => f._id);

            // 2) Delete bookings for those flights
            await Booking.deleteMany({ flight: { $in: flightIds } });

            // 3) Delete those flights
            await Flight.deleteMany({ _id: { $in: flightIds } });

            // 4) Delete the airline
            await Airline.findByIdAndDelete(airlineId);

            res.redirect('/admin/airlines');
        } catch (err) {
            next(err);
        }
    }
);


module.exports = router;
