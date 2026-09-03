// routes/bookings.js
const express = require('express');
const router = express.Router();
const { reqAuth } = require('../../middlewares/auth');
const Booking = require('../../models/Booking');

router.delete('/:id', reqAuth, async (req, res, next) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id
        });
        if (!booking) {
            return res.status(404).send('Booking not found');
        }
        // Mark as canceled
        booking.status = 'canceled';
        await booking.save();
        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
