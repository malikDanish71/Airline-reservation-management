// models/Booking.js
const { Schema, model } = require('mongoose');

const bookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: Schema.Types.ObjectId, ref: 'Flight', required: true },
    seatClass: { type: String, enum: ['economy', 'business', 'premium'], required: true },
    type: { type: String, enum: ['one-way', 'round-trip'], required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'canceled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Booking', bookingSchema);
