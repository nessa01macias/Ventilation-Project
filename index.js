// configure dotenv
require('dotenv').config()

const express = require('express')
const mqtt = require('mqtt');
const bodyParser = require("body-parser");
const passport = require("passport");
const crypto = require('crypto');
const mongoose = require('mongoose');
const flash = require("connect-flash")
const methodOverride = require("method-override");
const path = require('path');
const LocalStrategy = require("passport-local");
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express()
const PORT = 8000


let loggedInUser = null;
// data
const Data = require("./models/Data")
const User = require('./models/User');
const userActivity = require("./models/UserStat")

const { isLoggedIn } = require("./middleware/auth")

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

// connection to the db
mongoose.connect(process.env.USERDB_URI, () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))

// Retrieve Data
function retrieveData() {
    return Data.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
}



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
    // console.log(message)
    var data = JSON.parse(message)
    // console.log("data gotten is", data)
    let new_data = new Data({
        nr: data.nr,
        speed: data.speed,
        setpoint: data.setpoint,
        pressure: data.pressure,
        auto: data.auto,
        error: data.error,
        co2: data.co2,
        rh: data.rh,
        temperature: data.temp,
        date: new Date().toJSON().slice(0, 10).replace(/-/g, '/')
    })
    // console.log(new_data)
    try {
        // var saved_data = await new_data.save()
        // console.log(saved_data)
    } catch (err) {
        console.log(err);
    }
})



// gets the value of the data in certain date!
app.post("/setdate", async (req, res) => {

    let onlyDateForm = req.body.date;
    let date_exists = false;

    var theDate;

    // console.log("the date input is", onlyDateForm)
    // console.log("the dates from the db are ")
    try {
        const datas = await Data.find({})
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            const [onlyDateDB] = date.split("T")
            console.log(onlyDateDB)

            if (onlyDateForm === onlyDateDB) {
                date_exists = true;
                theDate = onlyDateForm;
            }
            if (date_exists) break;
        }
        console.log("does the date exist in the db? ", date_exists)
        if (!date_exists) showError('We do not have information from that date!');

        if (theDate) console.log(theDate)
    } catch (err) {
        console.log("Could not retrieve the data")
    }

    res.redirect("/stats")

})

// gets the value of the data in certain date, of the current day!
app.get("/data", async (req, res) => {
    // today's date
    let isDefined = false;
    let isoDate = new Date().toISOString()
    let [theRealDate] = isoDate.split('T');


    if (typeof theDate !== 'undefined') {
        isDefined = true;
        theRealDate = theDate;
    }


    // console.log("Date being used is", theRealDate, isDefined)

    try {
        // pressure, co2, speed & temperature
        const datas = await Data.find({})
        const sendData = []
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            // console.log(date)
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (theRealDate === onlyDateDB) {
                sendData.push({
                    "theRealDate": theRealDate,
                    "date": date,
                    "pressure": data.pressure,
                    "co2": data.co2,
                    "speed": data.speed,
                    "temperature": data.temperature,
                    "auto": data.auto
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
})


app.listen(PORT, () => {
    console.log(`Server is running on port ` + PORT);
});


// AUTHORIZATION AND ROUTING

// Route to register page
app.get('/register', (req, res) => {
    if (loggedInUser == null) {
        res.render('register.ejs'); //send to register page
    } else {
        res.redirect('/dashboard'); // redirect to dashboard if logged in
    }
});

// POST registration
app.post('/register', async (req, res) => {
    crypto.pbkdf2(req.body.password, 'salt', 10000, 64, 'sha512', (err, pbkdf2Key) => {
        if (err) throw err;
        if (req.body.teacherCode == process.env.TEACHER_CODE) {
            User.create({ username: req.body.username, password: pbkdf2Key.toString('hex'), isTeacher: true })
        } else {
            User.create({ username: req.body.username, password: pbkdf2Key.toString('hex') })
        }
        res.redirect('/')
    })
});

// Route to login page
app.get('/', (req, res) => {
    if (loggedInUser == null) {
        res.render('homepage.ejs'); //send to login page
    } else {
        res.redirect('/dashboard'); // redirect to dashboard if logged in
    }
});

// POST login
app.post('/', async (req, res) => {
    await myAuthorizer(req.body.username, req.body.password);

    if (loggedInUser != null) {
        res.redirect('/dashboard');
    }
});

app.get('/dashboard', (req, res) => {
    // console.log(loggedInUser);
    if (loggedInUser == null) {
        res.redirect('/'); //send to login page
    } else {
        res.render('dashboard.ejs'); // redirect to dashboard if logged in
    }
});

app.get("/stats", (req, res) => {
    if (loggedInUser == null) {
        res.redirect('/'); //send to login page
    } else {
        res.render("sensors_chart.ejs") // redirect to sensors_chart if logged in
    }
})


app.get('/logout', (req, res) => {
    loggedInUser = null;
    res.redirect('/'); //send to login page
});

//authorizer
async function myAuthorizer(username, password) {
    const key = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512');

    console.log("to be authed: " + key.toString('hex'));

    const userQuery = await User.findOne({ username: username, password: key.toString('hex') }).then(user => {
        if (user) {
            loggedInUser = user._id;
        } else {
            loggedInUser = null;
            req.flash('error', 'You must be signed in to see the content!');
        }
    })
        .catch(err => {
            loggedInUser = null;
        });
}