// routes/filter.js
const express = require('express');
const router = express.Router();
const { optAuth } = require('../../middlewares/auth');
const Flight = require('../../models/Flight');
const Airline = require('../../models/Airline');
const Airport = require('../../models/Airport');
const qs = require('querystring');

router.get('/', optAuth, async (req, res, next) => {
    try {
        // 1) Grab & normalize filters
        const {
            origin = '',
            destination = '',
            class: seatClass = '',
            airline = '',
            type = 'one-way',
            departureDate = '',
            arrivalDate = '',
            page = 1
        } = req.query;

        // 2) Fetch all for filtering
        let flights = await Flight
            .find()
            .populate('airline origin destination')
            .lean();

        // 3) Apply filters in JS
        const originTerm = origin.trim().toLowerCase();
        const destTerm = destination.trim().toLowerCase();

        flights = flights.filter(f => {
            // ORIGIN match on code or name
            if (originTerm) {
                const code = f.origin.code.toLowerCase();
                const name = f.origin.name.toLowerCase();
                if (!code.includes(originTerm) && !name.includes(originTerm)) {
                    return false;
                }
            }

            // DESTINATION match on code or name
            if (destTerm) {
                const code = f.destination.code.toLowerCase();
                const name = f.destination.name.toLowerCase();
                if (!code.includes(destTerm) && !name.includes(destTerm)) {
                    return false;
                }
            }

            // CLASS
            if (seatClass) {
                if (!f.seatClasses.some(s => s.class === seatClass)) return false;
            }

            // AIRLINE exact match by ID (you could expand this to name-based if desired)
            if (airline && f.airline._id.toString() !== airline) return false;

            // DEPARTURE DATE exact
            if (departureDate) {
                const dep = f.departureTime.toISOString().slice(0, 10);
                if (dep !== departureDate) return false;
            }

            return true;
        }).map(f => {
            // pricing & dates formatting
            const sc = f.seatClasses.find(s => s.class === seatClass) || f.seatClasses[0];
            const depDate = (departureDate || f.departureTime)
                .toISOString().slice(0, 10);
            const arrDate = (arrivalDate || f.arrivalTime)
                .toISOString().slice(0, 10);
            return {
                ...f,
                price: type === 'round-trip'
                    ? (sc.priceRoundTrip)
                    : (sc.priceOneWay),
                seatClass: sc.class,
                depDate,
                arrDate
            };
        });

        // 4) Pagination
        const perPage = 5;
        const pgNum = Math.max(1, parseInt(page));
        const total = flights.length;
        const totalPages = Math.ceil(total / perPage);
        const paged = flights.slice((pgNum - 1) * perPage, pgNum * perPage);

        // 5) Prepare QS for page links (without page)
        const queryObj = { ...req.query };
        delete queryObj.page;
        const qsWithoutPage = qs.stringify(queryObj);

        // 6) All Airlines for dropdown
        const airlines = await Airline.find().lean();

        res.render('filter', {
            user: req.user,
            flights: paged,
            airlines,
            // echo back filters
            origin, destination, seatClass, airline, type,
            departureDate, arrivalDate,
            page: pgNum,
            totalPages,
            qsWithoutPage,

            title: 'Search Flights',
            active: 'filter',
            css: 'filter.css'


        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
