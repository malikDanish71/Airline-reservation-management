// routes/profile.js
const express = require('express');
const router = express.Router();
const { reqAuth } = require('../../middlewares/auth');
const Booking = require('../../models/Booking');

router.get('/', reqAuth, async (req, res, next) => {
    try {
        // Fetch user's bookings, populate flight → airline, origin, destination
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'flight',
                populate: ['airline', 'origin', 'destination']
            })
            .lean();

        // Add price to each booking
        bookings.forEach(b => {
            if (b.flight && b.flight.seatClasses) {
                const seat = b.flight.seatClasses.find(s => s.class === b.seatClass);
                if (seat) {
                    b.price = b.type === 'round-trip' ? seat.priceRoundTrip : seat.priceOneWay;
                } else {
                    b.price = null;
                }
            } else {
                b.price = null;
            }
        });

        res.render('profile', {
            title: 'My Profile',
            active: 'profile',
            user: req.user,
            bookings,
            css: 'profile.css'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
