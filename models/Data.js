
const mongoose = require("mongoose")

const dataSchema = new mongoose.Schema({
    nr: {
        type: Number,
        required: true
    },
    speed: {
        type: Number,
        required: true
    },
    setpoint: {
        type: Number,
        required: true
    },
    pressure: {
        type: Number,
        required: true
    },
    auto: {
        type: Boolean,
        required: true
    },
    error: {
        type: Boolean,
        required: true
    },
    co2: {
        type: Number,
        required: true
    },
    rh: {
        type: Number,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
}, { timestamps: true });

const Data = mongoose.model('data', dataSchema)

module.exports = Data;
