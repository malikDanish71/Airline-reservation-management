// routes/home.js
const express = require('express');
const router = express.Router();
const { optAuth } = require('../../middlewares/auth');
const Airport = require('../../models/Airport');
const Airline = require('../../models/Airline');

router.get('/', optAuth, async (req, res, next) => {
    try {
        const airports = await Airport.aggregate([{ $sample: { size: 6 } }]);
        const airlines = await Airline.find();
        res.render('home', {
            airports,
            airlines,
            user: req.user,
            title: 'Flights. - Your Journey Starts Here',
            active: 'home',
            css: 'home.css'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
