const mongoose = require("mongoose")
const UserStatSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    logins: {
        type: [Date],
    }
}, {timestamps:true});

const UserStats = mongoose.model('UserStat', UserStatSchema)
module.exports = UserStats;