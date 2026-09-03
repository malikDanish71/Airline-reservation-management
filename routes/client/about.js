// routes/home.js
const express = require('express');
const router = express.Router();
const { optAuth } = require('../../middlewares/auth');

router.get('/', optAuth, async (req, res, next) => {
    try {
        res.render('about', {
            user: req.user,
            title: 'Flights. - About us',
            active: 'about',
            css: 'about.css'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
