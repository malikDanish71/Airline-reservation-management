// seeders/seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const Airport = require('../models/Airport');
const Airline = require('../models/Airline');
const Flight = require('../models/Flight');
const User = require('../models/User');
const Booking = require('../models/Booking');

const airportsData = [
    { code: 'JFK', name: 'John F. Kennedy Intl.', imageUrl: '/uploads/airport/jfk.jpg' },
    { code: 'LHR', name: 'London Heathrow', imageUrl: '/uploads/airport/lhr.jpg' },
    { code: 'DXB', name: 'Dubai International', imageUrl: '/uploads/airport/dxb.jpg' },
    { code: 'HND', name: 'Tokyo Haneda', imageUrl: '/uploads/airport/hnd.jpg' }
];

const airlinesData = [
    { name: 'Ryan Air', logoUrl: '/uploads/airline/ryan.svg' },
    { name: 'British Airways', logoUrl: '/uploads/airline/british.svg' },
    { name: 'Riyadh Airlines', logoUrl: '/uploads/airline/Riyadh.svg' }
];

async function seed() {
    await connectDB();

    // 1. Clear existing
    await Promise.all([
        Airport.deleteMany({}),
        Airline.deleteMany({}),
        Flight.deleteMany({}),
        User.deleteMany({}),
        Booking.deleteMany({})
    ]);

    // 2. Seed Airports & Airlines
    const [airports, airlines] = await Promise.all([
        Airport.insertMany(airportsData),
        Airline.insertMany(airlinesData)
    ]);

    // 3. Seed Flights (20 flights, all seat classes)
    const flightsData = [];
    for (let i = 0; i < 20; i++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        let [o, d] = [null, null];
        while (!d || o._id.equals(d._id)) {
            o = airports[Math.floor(Math.random() * airports.length)];
            d = airports[Math.floor(Math.random() * airports.length)];
        }
        const dTime = new Date(Date.now() + Math.random() * 1e10);
        const aTime = new Date((dTime.getTime() + (1 + Math.random() * 8) * 3600 * 1000) + 40);
        flightsData.push({
            flightNumber: `FL${1000 + i}`,
            airline: airline._id,
            origin: o._id,
            destination: d._id,
            departureTime: dTime,
            arrivalTime: aTime,
            seatClasses: [
                { class: 'economy', priceOneWay: 100 + Math.random() * 200, priceRoundTrip: 180 + Math.random() * 300 },
                { class: 'business', priceOneWay: 300 + Math.random() * 400, priceRoundTrip: 550 + Math.random() * 600 },
                { class: 'premium', priceOneWay: 500 + Math.random() * 500, priceRoundTrip: 900 + Math.random() * 800 }
            ]
        });
    }
    const flights = await Flight.insertMany(flightsData);

    // 4. Seed Users (4 users, 1 admin)
    const usersPlain = [
        { name: 'Alice', email: 'alice@example.com', password: 'pswd1', role: 'user' },
        { name: 'Bob', email: 'bob@example.com', password: 'pswd1', role: 'user' },
        { name: 'Carol', email: 'carol@example.com', password: 'pswd1', role: 'user' },
        { name: 'Admin', email: 'admin@admin.com', password: 'pswd1', role: 'admin' }
    ];
    const users = [];
    for (let u of usersPlain) {
        const hash = await bcrypt.hash(u.password, 12);
        users.push(await User.create({ ...u, password: hash }));
    }

    // 5. Seed Bookings: 5–8 per user
    const bookingsData = [];
    users.forEach(user => {
        const count = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const flight = flights[Math.floor(Math.random() * flights.length)];
            const seat = flight.seatClasses[Math.floor(Math.random() * flight.seatClasses.length)].class;
            bookingsData.push({
                user: user._id,
                flight: flight._id,
                seatClass: seat,
                type: Math.random() > 0.5 ? 'round-trip' : 'one-way',
                status: ['pending', 'confirmed', 'canceled'][Math.floor(Math.random() * 3)]
            });
        }
    });
    await Booking.insertMany(bookingsData);

    console.log('Seeding complete.');
    mongoose.connection.close();
}

seed().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
