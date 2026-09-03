// models/Airport.js
const { Schema, model } = require('mongoose');

const airportSchema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Airport', airportSchema);
