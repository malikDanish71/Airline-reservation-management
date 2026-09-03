// models/Flight.js
const { Schema, model } = require('mongoose');

const seatClassSchema = new Schema({
    class: { type: String, enum: ['economy', 'business', 'premium'], required: true },
    priceOneWay: { type: Number, required: true },
    priceRoundTrip: { type: Number, required: true },
});

const flightSchema = new Schema({
    flightNumber: { type: String, required: true, unique: true },
    airline: { type: Schema.Types.ObjectId, ref: 'Airline', required: true },
    origin: { type: Schema.Types.ObjectId, ref: 'Airport', required: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Airport', required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    seatClasses: [seatClassSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Flight', flightSchema);
