const express = require('express')
const mqtt = require('mqtt');
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require('mongoose');
const flash = require("connect-flash")
const methodOverride = require("method-override");
const path = require('path');
const LocalStrategy = require("passport-local");
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express()
const userRoute = require('./routes/User')
const PORT = 8000


// data
const Data = require("./models/Data")
const User = require('./models/User');

const { isLoggedIn } = require("./middleware/auth")

// configure dotenv
require('dotenv').config()

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

// PASSPORT CONFIGURATION 
app.use(require("express-session")({
    secret: "'SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}))


// // configuration
app.use(express.static('./public'))
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function (req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use("/", userRoute);

// connection to the db
mongoose.connect('mongodb://localhost:27017/sensors_data', () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))

// // Connects to the mongoDB
// mongoose.connect(process.env.USERDB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
//     if (err) {
//         console.log('Error in connect the database' + err);
//     } else {
//         console.log('Connected to Mongodb');
//     }
// });







// Retrieve Data
function retrieveData() {
    return Data.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
}

// serving the dasboard 
app.get("/dashboard", async (req, res) => {
    res.render('dashboard.ejs')
})


// created for later on feching to cliend-side the fan pressure
app.get("/getFanPressure", async (req, res) => {
    try {
        // the last piece of data saved
        const fanPressure = await retrieveData();
        res.json(fanPressure[0])
    } catch (err) {
        console.log("could not retrieve information from the latest fan pressure")
    }
})



// MQTT CONFIGURATION - SUBSCRIBING & SAVING THE INFO TO A DATABASE
const addr = 'mqtt://192.168.56.1:1883';

let default_pub_topic = "controller/settings"
let default_sub_topic = "controller/status"
const client = mqtt.connect(addr);


client.on("connect", function (err) {
    client.subscribe(default_sub_topic);
    console.log("client has subscribed succesfully")
});

client.on('message', async function (topic, message) {
    var data = JSON.parse(message)

    let new_data = new Data({
        nr: data.nr,
        speed: data.speed,
        setpoint: data.setpoint,
        pressure: data.pressure,
        auto: data.auto,
        error: data.error,
        co2: data.co2,
        rh: data.rh,
        temperature: data.temp
    })
    // console.log(new_data)
    try {
        // var saved_data = await new_data.save()
        // console.log(saved_data)
    } catch (err) {
        console.log(err);
    }
})




// gets the value of the data in certain date, of the current day!
app.get("/data", async (req, res) => {
    // today's date
    var isoDate = new Date().toISOString()
    const [onlyDate] = isoDate.split('T');
    //console.log(onlyDate)

    try {
        // pressure, co2, speed & temperature
        const datas = await Data.find({})
        const sendData = []
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            let co2 = data.co2
            let speed = data.speed
            let temperature = data.temperature
            let pressure = data.pressure
            let auto = data.auto
            // console.log(date)
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (onlyDate === onlyDateDB) {
                sendData.push({
                    "date": date,
                    "pressure": pressure,
                    "co2": co2,
                    "speed": speed,
                    "temperature": temperature,
                    "auto": auto
                })
            }
        }
        if (sendData.length != 0) res.json(sendData)
        else { res.send("<h2>I do not have data from today!<h2>") }
    } catch (err) {
        console.log(err)
    }
})

// FROM OUR PART WHEN MODE = MANUAL

// Send `{"auto": true, "pressure": 10}` to topic `controller/status`
// FROM THE EMBEDDED'S PART
// Recieved `{"auto": true, "pressure": 10}` from topic `controller/status`
// Send `{"nr": 40, "speed": 13, "setpoint": 10, "pressure": 3, "auto": true, "error": false, "co2": 300, "rh": 37, "temp": 20}` to topic `controller/settings`

// FROM OUR PART WHEN MODE = AUTO
// Send: `{"auto": false, "speed": 10}` from `controller/status` topic
// FROM THE EMBEDDED'S PART
// Recieved  `{"auto": false, "speed": 10}` from `controller/status` topic
// Send `{"nr": 22, "speed": 10, "setpoint": 10, "pressure": 3, "auto": false, "error": false, "co2": 300, "rh": 37, "temp": 20}` to topic `controller/settings`

app.post("/update", (req, res) => {
    let information = {}
    if ('send_mode' in req.body) {
        // information["mode"] = "auto"
        information["auto"] = true
        information["pressure"] = req.body.sliderPressure
    } else {
        // information["mode"] = "manual"
        information["auto"] = false
        information["speed"] = req.body.sliderSpeed
    }
    // console.log("we are in ", JSON.stringify(information))
    // publishing
    client.publish(default_pub_topic, JSON.stringify(information));
    console.log(`Send '${JSON.stringify(information)}' from topic '${default_pub_topic}'`)
    res.redirect('dashboard')
})

app.get("/stats", (req, res) => {
    res.render("sensors_chart.ejs")
})

app.listen(PORT, () => {
    console.log(`Server is running on port ` + PORT);
});
