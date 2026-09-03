// routes/book.js
const express = require('express');
const router = express.Router();
const { optAuth, reqAuth } = require('../../middlewares/auth');
const Flight = require('../../models/Flight');
const Booking = require('../../models/Booking');

router.get('/', optAuth, async (req, res, next) => {
    if (!req.user) {
        // Not logged in → send to profile/login
        return res.redirect('/profile');
    }

    try {
        const {
            flight: flightId,
            class: seatClass,
            type = 'one-way',
            dep,
            ret
        } = req.query;

        const flight = await Flight
            .findById(flightId)
            .populate('airline origin destination')
            .lean();

        if (!flight) {
            return res.redirect('/filter');
        }

        // pick pricing
        const sc = flight.seatClasses.find(s => s.class === seatClass) ||
            flight.seatClasses[0];
        const price = type === 'round-trip' ? sc.priceRoundTrip : sc.priceOneWay;

        res.render('book', {
            title: 'Confirm Booking',
            active: '',
            user: req.user,
            css: 'book.css',
            flight,
            seatClass: sc.class,
            type,
            depDate: dep,
            retDate: type === 'round-trip' ? ret : null,
            price
        });
    } catch (err) {
        next(err);
    }
});

router.post('/', reqAuth, async (req, res, next) => {
    try {
        const {
            flightId,
            seatClass,
            type,
            depDate,
            retDate
        } = req.body;

        await Booking.create({
            user: req.user._id,
            flight: flightId,
            seatClass,
            type,
            departureDate: depDate,
            returnDate: type === 'round-trip' ? retDate : null,
            status: 'pending'
        });

        // After booking, send to profile (or your “my bookings” page)
        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
