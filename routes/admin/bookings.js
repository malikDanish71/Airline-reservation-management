// routes/admin/bookings.js
const express = require('express');
const router = express.Router();
const methodOverride = require('method-override');
const Booking = require('../../models/Booking');
const { reqAuth, isAdmin } = require('../../middlewares/auth');

// GET /admin/bookings — list all bookings
router.get('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate({
                path: 'flight',
                populate: ['airline', 'origin', 'destination']
            })
            .sort('-createdAt')
            .lean();

        res.render('admin/bookings', {
            title: 'Admin – Manage Bookings',
            active: '',
            user: req.user,
            css: 'admin-bookings.css',
            bookings
        });
    } catch (err) {
        next(err);
    }
});

// PUT /admin/bookings/:id/status — update booking status
router.put('/:id/status', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const { status } = req.body;
        // Only accept the three valid statuses
        if (!['pending', 'confirmed', 'canceled'].includes(status)) {
            return res.status(400).send('Invalid status');
        }
        await Booking.findByIdAndUpdate(req.params.id, { status });
        req.session.success = 'Booking status updated.';
        res.redirect('/admin/bookings');
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/bookings/:id — delete booking
router.delete('/:id', reqAuth, isAdmin, async (req, res, next) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.redirect('/admin/bookings');
    } catch (err) {
        next(err);
    }
});

// Add middleware to pass flash messages to EJS
router.use((req, res, next) => {
    res.locals.success = req.session.success;
    delete req.session.success;
    next();
});

module.exports = router;
