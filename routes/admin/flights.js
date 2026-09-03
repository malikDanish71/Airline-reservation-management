// routes/admin/flights.js
const express = require('express');
const router = express.Router();
const Flight = require('../../models/Flight');
const Airline = require('../../models/Airline');
const Airport = require('../../models/Airport');
const Booking = require('../../models/Booking');
const { reqAuth, isAdmin } = require('../../middlewares/auth');


// GET /admin/flights — list + form
router.get('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const [flights, airlines, airports] = await Promise.all([
            Flight.find().populate('airline origin destination').lean(),
            Airline.find().lean(),
            Airport.find().lean()
        ]);

        const edit = req.query.edit
            ? flights.find(f => f._id.toString() === req.query.edit)
            : null;

        res.render('admin/flights', {
            title: 'Admin – Manage Flights',
            active: '',
            user: req.user,
            css: 'admin-flights.css',
            flights,
            airlines,
            airports,
            edit
        });
    } catch (err) {
        next(err);
    }
});

// POST /admin/flights — create flight
router.post('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const {
            flightNumber, airline, origin, destination,
            departureTime, arrivalTime
        } = req.body;

        // classes can be string or array
        let classes = req.body.class || [];
        if (!Array.isArray(classes)) classes = [classes];
        if (!classes.length) {
            throw new Error('At least one seat class must be selected');
        }

        // build seatClasses array
        const seatClasses = classes.map(c => ({
            class: c,
            priceOneWay: parseFloat(req.body[`priceOneWay-${c}`]),
            priceRoundTrip: parseFloat(req.body[`priceRoundTrip-${c}`])
        }));

        await Flight.create({
            flightNumber, airline, origin, destination,
            departureTime, arrivalTime, seatClasses
        });

        res.redirect('/admin/flights');
    } catch (err) {
        next(err);
    }
});

// PUT /admin/flights/:id — update flight
router.put('/:id', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const {
            flightNumber, airline, origin, destination,
            departureTime, arrivalTime
        } = req.body;

        let classes = req.body.class || [];
        if (!Array.isArray(classes)) classes = [classes];
        if (!classes.length) {
            throw new Error('At least one seat class must be selected');
        }

        // Only build seatClasses for checked classes
        const seatClasses = ['economy', 'business', 'premium'].filter(c => classes.includes(c)).map(c => ({
            class: c,
            priceOneWay: parseFloat(req.body[`priceOneWay-${c}`]),
            priceRoundTrip: parseFloat(req.body[`priceRoundTrip-${c}`])
        }));

        await Flight.findByIdAndUpdate(req.params.id, {
            flightNumber, airline, origin, destination,
            departureTime, arrivalTime, seatClasses
        });

        req.session.success = 'Flight updated successfully.';
        res.redirect('/admin/flights');
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/flights/:id — remove flight & cascade bookings
router.delete('/:id', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const flightId = req.params.id;
        await Booking.deleteMany({ flight: flightId });
        await Flight.findByIdAndDelete(flightId);
        req.session.success = 'Flight and related bookings deleted.';
        res.redirect('/admin/flights');
    } catch (err) {
        next(err);
    }
});

// Fallback: catch POST /admin/flights/:id if method-override fails
router.post('/:id', reqAuth, isAdmin, (req, res) => {
    res.status(400).send('Error: Method override failed. PUT was expected but POST was received. Please ensure the form includes <input type="hidden" name="_method" value="PUT"> and that method-override middleware is working.');
});

// Add middleware to pass flash messages to EJS
router.use((req, res, next) => {
    res.locals.success = req.session.success;
    delete req.session.success;
    next();
});

// Error handler for edit form: always pass css
router.use((err, req, res, next) => {
    if (req.originalUrl.startsWith('/admin/flights')) {
        // Re-fetch data for the form if possible
        Promise.all([
            Flight.find().populate('airline origin destination').lean(),
            Airline.find().lean(),
            Airport.find().lean()
        ]).then(([flights, airlines, airports]) => {
            res.status(500).render('admin/flights', {
                title: 'Admin – Manage Flights',
                active: '',
                user: req.user,
                css: 'admin-flights.css',
                flights,
                airlines,
                airports,
                edit: null,
                error: err.message || 'Server error.'
            });
        }).catch(() => {
            next(err);
        });
    } else {
        next(err);
    }
});

module.exports = router;
