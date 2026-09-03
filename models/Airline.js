// models/Airline.js
const { Schema, model } = require('mongoose');

const airlineSchema = new Schema({
    name: { type: String, required: true },
    logoUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Airline', airlineSchema);
