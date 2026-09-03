// routes/admin/users.js
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const { reqAuth, isAdmin } = require('../../middlewares/auth');

// GET /admin/users — list all users
router.get('/', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const users = await User.find().sort('name').lean();
        res.render('admin/users', {
            title: 'Admin – Manage Users',
            active: '',
            user: req.user,
            css: 'admin-users.css',
            users
        });
    } catch (err) {
        next(err);
    }
});

// PUT /admin/users/:id/role — toggle role
router.put('/:id/role', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const u = await User.findById(req.params.id);
        if (!u) return res.status(404).send('User not found');
        u.role = u.role === 'admin' ? 'user' : 'admin';
        await u.save();
        res.redirect('/admin/users');
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/users/:id — delete user
router.delete('/:id', reqAuth, isAdmin, async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Prevent deleting yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).send("Can't delete yourself");
        }

        // 1) Delete all bookings belonging to that user
        await Booking.deleteMany({ user: userId });

        // 2) Delete the user record
        await User.findByIdAndDelete(userId);

        res.redirect('/admin/users');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
