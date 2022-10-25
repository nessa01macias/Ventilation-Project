const mongoose = require("mongoose")
const UserStatSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    login: { //date of latest login
        type: Date,
    },
    mode: { //mode of last controller setting
        type: Number
    },
    value: { //value of last controller setting
        type: Number
    }
}, { timestamps: true }); //timestamp records date of creation and latest update

const UserStats = mongoose.model('userActivity', UserStatSchema)
module.exports = UserStats;